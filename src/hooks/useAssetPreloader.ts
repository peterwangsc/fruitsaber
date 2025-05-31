import { useState, useEffect, useCallback } from 'react';

interface LoadingProgress {
  images: number;
  sounds: number;
  models: number;
  camera: number;
  total: number;
}

interface UseAssetPreloaderReturn {
  loading: boolean;
  progress: LoadingProgress;
  error: string | null;
  allLoaded: boolean;
}

export const useAssetPreloader = (): UseAssetPreloaderReturn => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<LoadingProgress>({
    images: 0,
    sounds: 0,
    models: 0,
    camera: 0,
    total: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [allLoaded, setAllLoaded] = useState(false);

  const updateProgress = useCallback((category: keyof Omit<LoadingProgress, 'total'>, value: number) => {
    setProgress(prev => {
      const newProgress = { ...prev, [category]: value };
      const total = (newProgress.images + newProgress.sounds + newProgress.models + newProgress.camera) / 4;
      return { ...newProgress, total };
    });
  }, []);

  const preloadImages = useCallback(async () => {
    const imageUrls = [
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-apple-emoji.png',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-orange-emoji.png',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-banana-emoji.png',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-watermelon-emoji.png',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-grapes-emoji.png',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-pineapple-emoji.png',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-pinata-emoji.png',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-bomb-emoji.png'
    ];

    let loadedCount = 0;
    const totalImages = imageUrls.length;

    const loadPromises = imageUrls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          loadedCount++;
          updateProgress('images', (loadedCount / totalImages) * 100);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${url}`);
          loadedCount++;
          updateProgress('images', (loadedCount / totalImages) * 100);
          resolve(); // Don't reject, just continue
        };
        img.src = url;
      });
    });

    await Promise.all(loadPromises);
  }, [updateProgress]);

  const preloadSounds = useCallback(async () => {
    const soundUrls = [
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/lightsaber-ignition-6816.mp3',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/lightsaber3-87667.mp3',
      'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/knife-stab-sound-effect-36354.mp3'
    ];

    // Background music will be handled by Howler.js in the sound effects hook
    const backgroundMusicUrl = 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/Crazy-Taxi.mp3';

    let loadedCount = 0;
    const totalSounds = soundUrls.length + 1; // +1 for background music

    // Load regular sounds
    const loadPromises = soundUrls.map((url) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        
        const handleCanPlay = () => {
          loadedCount++;
          updateProgress('sounds', (loadedCount / totalSounds) * 100);
          cleanup();
          resolve();
        };

        const handleError = () => {
          console.warn(`Failed to load sound: ${url}`);
          loadedCount++;
          updateProgress('sounds', (loadedCount / totalSounds) * 100);
          cleanup();
          resolve();
        };

        const cleanup = () => {
          audio.removeEventListener('canplaythrough', handleCanPlay);
          audio.removeEventListener('error', handleError);
        };

        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('error', handleError);
        audio.src = url;
      });
    });

    // Background music loading check (handled by Howler.js)
    const backgroundMusicPromise = new Promise<void>((resolve) => {
      // Check if background music is accessible
      fetch(backgroundMusicUrl, { method: 'HEAD' })
        .then(() => {
          loadedCount++;
          updateProgress('sounds', (loadedCount / totalSounds) * 100);
          resolve();
        })
        .catch(() => {
          console.warn('Background music not accessible');
          loadedCount++;
          updateProgress('sounds', (loadedCount / totalSounds) * 100);
          resolve();
        });
    });

    await Promise.all([...loadPromises, backgroundMusicPromise]);
  }, [updateProgress]);

  const preloadModels = useCallback(async () => {
    try {
      updateProgress('models', 10);

      // Load MediaPipe scripts
      const script1 = document.createElement('script');
      script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
      script1.crossOrigin = 'anonymous';
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script2.crossOrigin = 'anonymous';
      document.head.appendChild(script2);

      updateProgress('models', 30);

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

      updateProgress('models', 50);

      // Import MediaPipe vision tasks
      const { HandLandmarker, FilesetResolver } = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0'
      );

      updateProgress('models', 70);

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );

      updateProgress('models', 85);

      // Create hand landmarker (this downloads the model)
      await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2
      });

      updateProgress('models', 100);
    } catch (error) {
      console.warn('Failed to preload MediaPipe models:', error);
      updateProgress('models', 100); // Continue anyway
    }
  }, [updateProgress]);

  const requestCameraPermission = useCallback(async () => {
    try {
      updateProgress('camera', 20);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      updateProgress('camera', 60);

      // Stop the stream immediately since we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      updateProgress('camera', 100);
    } catch (error) {
      console.warn('Camera permission denied:', error);
      // Still mark as complete to not block the game
      updateProgress('camera', 100);
    }
  }, [updateProgress]);

  useEffect(() => {
    const loadAllAssets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all assets in parallel
        await Promise.all([
          preloadImages(),
          preloadSounds(),
          preloadModels(),
          requestCameraPermission()
        ]);

        setAllLoaded(true);
        setLoading(false);
      } catch (error) {
        console.warn('Some assets failed to load:', error);
        // Still allow the game to start
        setAllLoaded(true);
        setLoading(false);
      }
    };

    loadAllAssets();
  }, [preloadImages, preloadSounds, preloadModels, requestCameraPermission]);

  return { loading, progress, error, allLoaded };
};
