import { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';

interface HandData {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  hand: 'left' | 'right';
  fingerDirection: { x: number; y: number; z: number };
  handSize: number;
  palmPosition: { x: number; y: number };
  fingerTips: {
    index: { x: number; y: number };
    middle: { x: number; y: number };
    ring: { x: number; y: number };
    pinky: { x: number; y: number };
  };
}

interface HandTrackerProps {
  webcamRef: React.RefObject<Webcam>;
  onHandsDetected: (hands: HandData[]) => void;
  enabled: boolean;
}

declare global {
  interface Window {
    HandLandmarker: any;
    FilesetResolver: any;
  }
}

export const HandTracker: React.FC<HandTrackerProps> = ({ webcamRef, onHandsDetected, enabled }) => {
  const handLandmarkerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>();
  const previousHands = useRef<HandData[]>([]);

  useEffect(() => {
    let isLoading = true;
    
    const loadMediaPipe = async () => {
      try {
        // Don't reload if already loaded
        if (handLandmarkerRef.current) {
          console.log('MediaPipe HandLandmarker already loaded');
          return;
        }
        
        // Load MediaPipe scripts
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
        script1.crossOrigin = 'anonymous';
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script2.crossOrigin = 'anonymous';
        document.head.appendChild(script2);

        // Wait for scripts to load
        await new Promise(resolve => {
          let loadedCount = 0;
          const checkLoaded = () => {
            loadedCount++;
            if (loadedCount === 2) resolve(true);
          };
          script1.onload = checkLoaded;
          script2.onload = checkLoaded;
        });

        // Import from CDN
        const { HandLandmarker, FilesetResolver } = await import(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0'
        );

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });

        console.log('MediaPipe HandLandmarker loaded successfully');
        isLoading = false;
        
        // Start detection if enabled and we have a webcam
        if (enabled && webcamRef.current && webcamRef.current.video) {
          detectHands();
        }
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        isLoading = false;
      }
    };

    loadMediaPipe();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const calculateFingerDirection = (landmarks: any[]) => {
    // Index finger landmarks: 5 (MCP), 6 (PIP), 7 (DIP), 8 (TIP)
    const mcp = landmarks[5]; // Base of index finger
    const tip = landmarks[8]; // Tip of index finger
    
    // Calculate 3D direction vector from base to tip
    const dx = tip.x - mcp.x;
    const dy = tip.y - mcp.y;
    const dz = (tip.z || 0) - (mcp.z || 0);
    
    // Normalize the vector
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return {
      x: dx / length,
      y: dy / length,
      z: dz / length
    };
  };

  const calculateHandSize = (landmarks: any[]) => {
    // Calculate hand size using wrist to middle finger tip distance
    const wrist = landmarks[0];
    const middleTip = landmarks[12];
    
    const distance = Math.sqrt(
      Math.pow(middleTip.x - wrist.x, 2) + 
      Math.pow(middleTip.y - wrist.y, 2)
    );
    
    // Scale factor to convert to reasonable saber length
    return distance * 800; // Adjust this multiplier for desired saber length
  };

  const detectHands = async () => {
    if (!handLandmarkerRef.current || !webcamRef.current || !enabled) {
      if (enabled) {
        animationFrameRef.current = requestAnimationFrame(detectHands);
      }
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    try {
      const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
      
      if (results.landmarks && results.landmarks.length > 0) {
        const hands: HandData[] = results.landmarks.map((landmarks: any, index: number) => {
          // Get palm position (wrist landmark 0)
          const wrist = landmarks[0];
          const palmX = (1 - wrist.x) * video.videoWidth; // Mirror horizontally
          const palmY = wrist.y * video.videoHeight;
          
          // Get all finger tip positions
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];
          
          const indexX = (1 - indexTip.x) * video.videoWidth;
          const indexY = indexTip.y * video.videoHeight;
          
          // Get previous position for this hand (using index finger for compatibility)
          const prevHand = previousHands.current[index];
          const prevX = prevHand?.x || indexX;
          const prevY = prevHand?.y || indexY;
          
          // Calculate finger direction and hand size
          const fingerDirection = calculateFingerDirection(landmarks);
          const handSize = calculateHandSize(landmarks);
          
          return {
            x: indexX,
            y: indexY,
            prevX,
            prevY,
            hand: results.handednesses[index]?.[0]?.categoryName === 'Left' ? 'right' : 'left', // Mirrored
            fingerDirection,
            handSize,
            palmPosition: { x: palmX, y: palmY },
            fingerTips: {
              index: { x: indexX, y: indexY },
              middle: { x: (1 - middleTip.x) * video.videoWidth, y: middleTip.y * video.videoHeight },
              ring: { x: (1 - ringTip.x) * video.videoWidth, y: ringTip.y * video.videoHeight },
              pinky: { x: (1 - pinkyTip.x) * video.videoWidth, y: pinkyTip.y * video.videoHeight }
            }
          };
        });
        
        previousHands.current = hands;
        onHandsDetected(hands);
      } else {
        onHandsDetected([]);
      }
    } catch (error) {
      console.error('Hand detection error:', error);
    }

    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
    }
  };

  useEffect(() => {
    if (enabled && handLandmarkerRef.current) {
      // Make sure webcam is ready before starting detection
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        console.log('Starting hand detection with ready webcam');
        detectHands();
      } else if (webcamRef.current) {
        // If webcam exists but video isn't ready, wait for it
        console.log('Waiting for webcam to be fully ready...');
        const checkVideo = setInterval(() => {
          const video = webcamRef.current?.video;
          if (video && video.readyState === 4) {
            console.log('Webcam now ready, starting detection');
            clearInterval(checkVideo);
            detectHands();
          }
        }, 100);
        
        // Clean up interval if component unmounts
        return () => clearInterval(checkVideo);
      }
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, webcamRef.current]);

  return null;
};
