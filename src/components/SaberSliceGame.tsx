import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { HandTracker } from './HandTracker';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface Fruit {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'apple' | 'orange' | 'banana' | 'watermelon' | 'grapes' | 'pineapple' | 'pinata' | 'bomb';
  size: number;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  sliceEffect?: { startTime: number; sliceAngle: number; };
}

interface Saber {
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

const FRUIT_TYPES = ['apple', 'orange', 'banana', 'watermelon', 'grapes', 'pineapple'] as const;
const BOMB_TYPE = 'bomb' as const;

const SaberSliceGame = () => {
  const webcamRef = useRef<Webcam>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds timer
  const startTimeRef = useRef<number | null>(null);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [sabers, setSabers] = useState<Saber[]>([]);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isMobile, setIsMobile] = useState(false);

  const gameLoopRef = useRef<number>();
  const lastSpawnTime = useRef(Date.now());
  const lastPinataTime = useRef(Date.now());
  const comboTimer = useRef<number>();
  const { initializeSounds, playIgnition, playSlice, playBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic } = useSoundEffects();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobileDevice = width <= 768 || (width <= 1024 && height > width);
      
      setDimensions({ width, height });
      setIsMobile(isMobileDevice);
    };

    // Initial detection
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    // Initialize sound effects
    initializeSounds();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeSounds]);

  // Play ignition sound when game starts (background music handled globally)
  useEffect(() => {
    if (gameState === 'playing' && startTimeRef.current === null) {
      // Small delay to ensure user interaction for autoplay compliance
      setTimeout(() => {
        playIgnition();
      }, 100);
    }
  }, [gameState, playIgnition]);

  const spawnFruit = useCallback(() => {
    const now = Date.now();
    
    // More frequent fruit spawning for increased action
    if (now - lastSpawnTime.current < 1000 + Math.random() * 1500) return;

    lastSpawnTime.current = now;
    
    // Chance for pinata (every 10-20 seconds)
    const shouldSpawnPinata = now - lastPinataTime.current > 10000 && Math.random() < 0.2;
    
    // Chance for bomb (15% chance, but not with pinata)
    const shouldSpawnBomb = !shouldSpawnPinata && Math.random() < 0.15;
    
    if (shouldSpawnPinata) {
      lastPinataTime.current = now;
    }
    
    let fruitType: Fruit['type'];
    let fruitSize: number;
    
    if (shouldSpawnPinata) {
      fruitType = 'pinata';
      fruitSize = isMobile ? 60 : 80;
    } else if (shouldSpawnBomb) {
      fruitType = 'bomb';
      fruitSize = isMobile ? 45 : 60; // Slightly smaller than pinata
    } else {
      fruitType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
      fruitSize = isMobile ? 50 + Math.random() * 20 : 70 + Math.random() * 30;
    }
    
    const newFruit: Fruit = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (dimensions.width - 100) + 50,
      y: dimensions.height + 50,
      vx: isMobile ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 2, // Slower horizontal movement on mobile
      vy: isMobile ? -6 - Math.random() * 4 : -8 - Math.random() * 6, // Adjusted launch for mobile
      type: fruitType,
      size: fruitSize, // Adjusted size for mobile
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 5, // Slower rotation
      sliced: false,
    };

    setFruits(prev => [...prev, newFruit]);
  }, [dimensions, isMobile]);

  const checkCollisions = useCallback(() => {
    setFruits(prevFruits => {
      return prevFruits.map(fruit => {
        if (fruit.sliced) return fruit;

        for (const saber of sabers) {
          // Check collision with all four finger "sabers" from palm
          const fingers = ['index', 'middle', 'ring', 'pinky'] as const;
          
          for (const fingerName of fingers) {
            const startX = saber.palmPosition.x;
            const startY = saber.palmPosition.y;
            const endX = saber.fingerTips[fingerName].x;
            const endY = saber.fingerTips[fingerName].y;
            
            // Check collision with finger saber line
            const distance = pointToLineDistance(
              fruit.x, fruit.y,
              startX, startY,
              endX, endY
            );
            
            if (distance < fruit.size / 2 + 20) { // Generous hit detection
              const sliceAngle = Math.atan2(
                endY - startY,
                endX - startX
              );
              
              // Scoring based on fruit type
              let basePoints: number;
              if (fruit.type === 'bomb') {
                basePoints = -25; // Negative points for bombs
                setCombo(0); // Reset combo on bomb hit
              } else if (fruit.type === 'pinata') {
                basePoints = 50; // Bonus points for pinata
              } else {
                basePoints = 10; // Regular fruit points
              }
              
              if (fruit.type !== 'bomb') {
                setScore(prev => prev + basePoints * (combo + 1));
                setCombo(prev => prev + 1);
              } else {
                setScore(prev => Math.max(0, prev + basePoints)); // Don't go below 0
              }
              
              if (comboTimer.current) clearTimeout(comboTimer.current);
              comboTimer.current = window.setTimeout(() => setCombo(0), 3000); // Longer combo window
              
              // Play slice sound effect
              playSlice();
              
              return {
                ...fruit,
                sliced: true,
                sliceEffect: { startTime: Date.now(), sliceAngle }
              };
            }
          }
        }
        return fruit;
      });
    });
  }, [sabers, combo]);

  // Helper function to calculate distance from point to line segment
  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));
    
    const xx = x1 + param * C;
    const yy = y1 + param * D;
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const updateGame = useCallback(() => {
    // Update timer
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    } else {
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newTimeRemaining = Math.max(0, 60 - elapsedSeconds);
      setTimeRemaining(newTimeRemaining);
      
      // End game when timer reaches 0
      if (newTimeRemaining === 0 && gameState === 'playing') {
        setGameState('gameOver');
      }
    }
    
    setFruits(prevFruits => {
      const updatedFruits = prevFruits.map(fruit => ({
        ...fruit,
        x: fruit.x + fruit.vx,
        y: fruit.y + fruit.vy,
        vy: fruit.vy + 0.15, // Much lighter gravity for extended air time
        rotation: fruit.rotation + fruit.rotationSpeed,
      }));

      // Remove fruits that have fallen off screen or been sliced for too long
      const filteredFruits = updatedFruits.filter(fruit => {
        if (fruit.sliced && fruit.sliceEffect) {
          return Date.now() - fruit.sliceEffect.startTime < 1500; // Longer slice effect display
        }
        if (fruit.y > dimensions.height + 100) {
          if (!fruit.sliced) {
            setCombo(0); // Reset combo but don't reduce time
          }
          return false;
        }
        return true;
      });

      return filteredFruits;
    });

    spawnFruit();
    checkCollisions();

    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    }
  }, [spawnFruit, checkCollisions, gameState, dimensions.height]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, updateGame]);

  useEffect(() => {
    if (timeRemaining <= 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [timeRemaining, gameState]);

  const handleHandsDetected = useCallback((hands: any[]) => {
    setSabers(hands);
  }, []);

  const resetGame = () => {
    setScore(0);
    setCombo(0);
    setTimeRemaining(60);
    setFruits([]);
    setSabers([]);
    setGameState('playing');
    startTimeRef.current = null;
    lastSpawnTime.current = Date.now();
    lastPinataTime.current = Date.now();
    
    // Play ignition sound for new game (background music continues)
    setTimeout(() => {
      playIgnition();
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Webcam */}
      <Webcam
        ref={webcamRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        videoConstraints={{
          width: isMobile ? Math.min(dimensions.width, 720) : dimensions.width,
          height: isMobile ? Math.min(dimensions.height, 1280) : dimensions.height,
          facingMode: 'user',
          aspectRatio: isMobile ? 9/16 : 16/9
        }}
        onUserMedia={() => {
          console.log('Webcam ready');
          // Give the webcam a moment to fully initialize before enabling tracking
          setTimeout(() => setWebcamReady(true), 500);
        }}
        onUserMediaError={(error) => console.error('Webcam error:', error)}
      />

      {/* Hand Tracker */}
      <HandTracker 
        webcamRef={webcamRef}
        onHandsDetected={handleHandsDetected}
        enabled={gameState === 'playing' && webcamReady}
      />

      {/* Game Canvas */}
      <GameCanvas
        fruits={fruits}
        sabers={sabers}
        dimensions={dimensions}
      />

      {/* Loading Indicator */}
      {!webcamReady && gameState === 'playing' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-purple-500 border-b-pink-500 border-l-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            <h2 className="text-2xl font-bold text-white font-orbitron">Initializing Sabers</h2>
            <p className="text-white/70">Getting your webcam ready...</p>
          </div>
        </div>
      )}
      
      {/* Game UI */}
      <GameUI
        score={score}
        combo={combo}
        timeRemaining={timeRemaining}
        gameState={gameState}
        onReset={resetGame}
        onPause={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
      />
    </div>
  );
};

export default SaberSliceGame;
