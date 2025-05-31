import { useEffect, useRef } from 'react';

interface Fruit {
  id: string;
  x: number;
  y: number;
  type: 'apple' | 'orange' | 'banana' | 'watermelon' | 'grapes' | 'pineapple' | 'pinata' | 'bomb';
  size: number;
  rotation: number;
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

interface GameCanvasProps {
  fruits: Fruit[];
  sabers: Saber[];
  dimensions: { width: number; height: number };
}

const FRUIT_COLORS = {
  apple: '#ff4757',
  orange: '#ffa502',
  banana: '#ffdd59',
  watermelon: '#2ed573',
  grapes: '#9b59b6',
  pineapple: '#ffa502',
  pinata: '#ff6b6b',
  bomb: '#2c2c2c'
};

const FRUIT_IMAGES = {
  apple: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-apple-emoji.png',
  orange: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-orange-emoji.png',
  banana: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-banana-emoji.png',
  watermelon: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-watermelon-emoji.png',
  grapes: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-grapes-emoji.png',
  pineapple: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-pineapple-emoji.png',
  pinata: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-pinata-emoji.png',
  bomb: 'https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-bomb-emoji.png'
};

const FRUIT_EMOJIS = {
  apple: '🍎',
  orange: '🍊',
  banana: '🍌',
  watermelon: '🍉',
  grapes: '🍇',
  pineapple: '🍍',
  pinata: '🪅',
  bomb: '💣'
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ fruits, sabers, dimensions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailsRef = useRef<Array<{ x: number; y: number; time: number; hand: string }>>([]);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // Preload fruit images
    Object.entries(FRUIT_IMAGES).forEach(([type, src]) => {
      if (typeof src === 'string' && src.startsWith('http') && !imageCache.current[type]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
          imageCache.current[type] = img;
        };
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add saber positions to trails
    const now = Date.now();
    sabers.forEach(saber => {
      trailsRef.current.push({
        x: saber.x,
        y: saber.y,
        time: now,
        hand: saber.hand
      });
    });

    // Remove old trail points (older than 800ms for longer trails)
    trailsRef.current = trailsRef.current.filter(point => now - point.time < 800);

    // Draw saber trails
    const groupedTrails = trailsRef.current.reduce((acc, point) => {
      if (!acc[point.hand]) acc[point.hand] = [];
      acc[point.hand].push(point);
      return acc;
    }, {} as Record<string, Array<{ x: number; y: number; time: number }>>);

    Object.entries(groupedTrails).forEach(([hand, points]) => {
      if (points.length < 2) return;

      const gradient = ctx.createLinearGradient(
        points[0].x, points[0].y,
        points[points.length - 1].x, points[points.length - 1].y
      );
      
      if (hand === 'left') {
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 0, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0.8)');
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    });

    // Draw sabers (palm to index finger)
    sabers.forEach(saber => {
      const startX = saber.palmPosition.x;
      const startY = saber.palmPosition.y;
      const endX = saber.fingerTips.index.x;
      const endY = saber.fingerTips.index.y;

      // Saber glow
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      if (saber.hand === 'left') {
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 1)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 0, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 1)');
      }

      // Draw saber glow
      ctx.shadowBlur = 25;
      ctx.shadowColor = saber.hand === 'left' ? '#00ffff' : '#ff00ff';
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw saber core
      ctx.shadowBlur = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    });

    // Draw fruits
    fruits.forEach(fruit => {
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation * Math.PI / 180);

      if (fruit.sliced && fruit.sliceEffect) {
        // Draw sliced fruit with separation effect
        const elapsed = (now - fruit.sliceEffect.startTime) / 1000;
        const separation = elapsed * 40;
        
        // Special pinata explosion effect
        if (fruit.type === 'pinata') {
          // More dramatic explosion with confetti
          for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = elapsed * 150;
            const particleX = Math.cos(angle) * distance;
            const particleY = Math.sin(angle) * distance;
            
            ctx.fillStyle = `hsl(${i * 18}, 70%, 60%)`;
            ctx.globalAlpha = Math.max(0, 1 - elapsed * 0.8);
            ctx.fillRect(particleX - 3, particleY - 3, 6, 6);
          }
        }
        
        // Draw two halves
        ctx.save();
        ctx.translate(-separation, 0);
        ctx.rotate(fruit.sliceEffect.sliceAngle);
        drawFruitHalf(ctx, fruit, true);
        ctx.restore();
        
        ctx.save();
        ctx.translate(separation, 0);
        ctx.rotate(fruit.sliceEffect.sliceAngle);
        drawFruitHalf(ctx, fruit, false);
        ctx.restore();

        // Regular particle effect
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const distance = elapsed * 80;
          const particleX = Math.cos(angle) * distance;
          const particleY = Math.sin(angle) * distance;
          
          ctx.fillStyle = FRUIT_COLORS[fruit.type];
          ctx.globalAlpha = Math.max(0, 1 - elapsed);
          ctx.fillRect(particleX, particleY, 3, 3);
        }
        ctx.globalAlpha = 1;
      } else {
        // Draw whole fruit
        drawFruit(ctx, fruit);
      }
      
      ctx.restore();
    });

  }, [fruits, sabers, dimensions]);

  const drawFruit = (ctx: CanvasRenderingContext2D, fruit: Fruit) => {
    const fruitSrc = FRUIT_IMAGES[fruit.type];
    const hasImageAsset = typeof fruitSrc === 'string' && fruitSrc.startsWith('http') && imageCache.current[fruit.type];

    // Ensure maximum opacity for fruits with enhanced visibility
    ctx.globalAlpha = 1.0;

    // Draw fruit shadow (subtle for all fruits)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(2, 2, fruit.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Special glow for pinata and bomb
    if (fruit.type === 'pinata') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff6b6b';
    } else if (fruit.type === 'bomb') {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0000';
    }

    // Only draw background circle for fruits without image assets (emojis)
    if (!hasImageAsset) {
      const gradient = ctx.createRadialGradient(-fruit.size/4, -fruit.size/4, 0, 0, 0, fruit.size/2);
      gradient.addColorStop(0, FRUIT_COLORS[fruit.type]);
      gradient.addColorStop(1, adjustBrightness(FRUIT_COLORS[fruit.type], -0.3));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, fruit.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Draw fruit image or emoji with enhanced visibility
    if (hasImageAsset) {
      const img = imageCache.current[fruit.type];
      const size = fruit.size * 1.1; // Slightly larger to compensate for no background
      
      // Set maximum opacity for enhanced visibility
      ctx.globalAlpha = 1.0;
      
      // Add enhanced glow for better visibility
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
      
      // Add a stronger background glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.drawImage(img, -size/2, -size/2, size, size);
      
      // Second pass for extra visibility
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
      ctx.drawImage(img, -size/2, -size/2, size, size);
      
      // Third pass for maximum visibility
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
      ctx.drawImage(img, -size/2, -size/2, size, size);
      ctx.shadowBlur = 0;
    } else {
      // Fallback to actual emoji with maximum visibility
      const emoji = FRUIT_EMOJIS[fruit.type] || '🍎'; // Default to apple if undefined
      ctx.globalAlpha = 1.0;
      ctx.font = `${fruit.size * 0.8}px Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      
      // Enhanced glow for emoji fallback
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
      ctx.fillText(emoji, 0, 0);
      
      // Second pass for extra visibility
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
      ctx.fillText(emoji, 0, 0);
      
      // Third pass for maximum visibility
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
      ctx.fillText(emoji, 0, 0);
      ctx.shadowBlur = 0;
    }
  };

  const drawFruitHalf = (ctx: CanvasRenderingContext2D, fruit: Fruit, isLeft: boolean) => {
    ctx.save();
    ctx.beginPath();
    if (isLeft) {
      ctx.rect(-fruit.size/2, -fruit.size/2, fruit.size/2, fruit.size);
    } else {
      ctx.rect(0, -fruit.size/2, fruit.size/2, fruit.size);
    }
    ctx.clip();
    
    drawFruit(ctx, fruit);
    ctx.restore();
  };

  const adjustBrightness = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount * 255));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount * 255));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount * 255));
    
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
