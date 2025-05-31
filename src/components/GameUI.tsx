import { useEffect, useState } from 'react';

interface GameUIProps {
  score: number;
  combo: number;
  timeRemaining: number;
  gameState: 'playing' | 'paused' | 'gameOver';
  onReset: () => void;
  onPause: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  score,
  combo,
  timeRemaining,
  gameState,
  onReset,
  onPause,
}) => {
  const [showHelp, setShowHelp] = useState(score === 0);
  
  useEffect(() => {
    if (score > 0) {
      setShowHelp(false);
    }
  }, [score]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-orbitron">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-6 flex justify-between items-start pointer-events-auto">
        {/* Score and Combo */}
        <div className="space-y-2">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 md:px-6 md:py-3 border border-white/20">
            <div className="text-cyan-400 text-xs md:text-sm uppercase tracking-wider">Score</div>
            <div className="text-white text-xl md:text-3xl font-bold">{score.toLocaleString()}</div>
          </div>
          
          {combo > 0 && (
            <div className="bg-gradient-to-r from-purple-500/40 to-pink-500/40 backdrop-blur-sm rounded-lg px-3 py-1 md:px-4 md:py-2 border border-purple-400/30 animate-pulse">
              <div className="text-pink-300 text-xs md:text-sm uppercase tracking-wider">Combo</div>
              <div className="text-white text-lg md:text-xl font-bold">x{combo}</div>
            </div>
          )}
        </div>

        {/* Timer - Centered at top */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 md:px-6 md:py-3 border border-white/20">
          <div className="text-orange-400 text-xs md:text-sm uppercase tracking-wider text-center">Time</div>
          <div className={`text-white text-xl md:text-3xl font-bold ${timeRemaining <= 10 ? 'text-red-500 animate-pulse' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Empty div to maintain spacing - hidden on mobile */}
        <div className="hidden md:block w-32"></div>
      </div>

      {/* Game State Overlays */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white">PAUSED</h2>
            <button
              onClick={onPause}
              className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-white text-lg md:text-xl hover:scale-105 transition-transform"
            >
              RESUME
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="text-center space-y-6 md:space-y-8 max-w-md mx-4">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold text-orange-400">TIME'S UP!</h2>
              <div className="text-xl md:text-2xl text-white">Final Score: <span className="text-cyan-400 font-bold">{score.toLocaleString()}</span></div>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <button
                onClick={onReset}
                className="block w-full px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-white text-lg md:text-xl hover:scale-105 transition-transform"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {gameState === 'playing' && score === 0 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-3 md:px-6 md:py-4 border border-white/20 text-center mx-4">
            <div className="text-white text-base md:text-lg font-semibold mb-1 md:mb-2">🤚 Show your hands to the camera</div>
            <div className="text-white/80 text-xs md:text-sm">Energy sabers will extend from your palms to fingertips</div>
          </div>
        </div>
      )}

      {/* Simple pause button overlay for mobile/touch */}
      <div className="absolute top-3 right-3 md:top-6 md:right-6 pointer-events-auto">
        <button
          onClick={onPause}
          className="p-3 md:p-4 text-white hover:opacity-80 transition-all duration-200 bg-black/40 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/50"
        >
          {gameState === 'paused' ? (
            <img 
              src="https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/emojis.com-play-button-emoji-for-a-f.png" 
              alt="Resume Game" 
              className="w-5 h-5 md:w-6 md:h-6 object-contain"
            />
          ) : (
            <img 
              src="https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/emojis.com-pause-button-emoji-with-t.png" 
              alt="Pause Game" 
              className="w-5 h-5 md:w-6 md:h-6 object-contain"
            />
          )}
        </button>
      </div>

      {/* Copyright Notice */}
      {gameState === 'playing' && (
        <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 opacity-30 pointer-events-none">
          <div className="text-white/40 text-xs font-medium tracking-wide bg-black/20 backdrop-blur-sm px-2 py-1 rounded">
            © 2025 fruitsaber.fun
          </div>
        </div>
      )}
    </div>
  );
};
