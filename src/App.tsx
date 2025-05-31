import { useEffect, useState, useRef, useCallback } from 'react';
import './index.css';
import SaberSliceGame from './components/SaberSliceGame';
import { useAssetPreloader } from './hooks/useAssetPreloader';
import { useSoundEffects } from './hooks/useSoundEffects';

export function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const { loading, progress, error, allLoaded } = useAssetPreloader();
  const [musicStarted, setMusicStarted] = useState(false);
  const { initializeSounds, playBackgroundMusic } = useSoundEffects();

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Start background music on any user interaction
  useEffect(() => {
    const startMusicOnInteraction = () => {
      if (!musicStarted && allLoaded) {
        setMusicStarted(true);
        initializeSounds();
        setTimeout(() => {
          playBackgroundMusic();
        }, 100);
      }
    };

    const events = ['click', 'keydown', 'touchstart', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, startMusicOnInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, startMusicOnInteraction);
      });
    };
  }, [allLoaded, musicStarted, initializeSounds, playBackgroundMusic]);

  if (!gameStarted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 animate-gradient-shift">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-center min-h-screen p-8">
          <div className="max-w-2xl text-center space-y-8 animate-fade-in-up">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 font-orbitron tracking-tight animate-pulse-glow">
                FRUIT SABER
              </h1>
            </div>
            
            <div className="space-y-6 text-white/70">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-500 animate-float-1 opacity-0 animate-[fadeInUp_1.5s_cubic-bezier(0.4,0,0.2,1)_0.5s_forwards]">
                  <div className="flex justify-center mb-2">
                    <img 
                      src="https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/the-hand-emoji.png" 
                      alt="Hand Tracking" 
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="font-semibold text-cyan-300">Judo Chop</div>
                  <div className="text-sm">AI-powered detection</div>
                </div>
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-500 animate-float-2 opacity-0 animate-[fadeInUp_1.5s_cubic-bezier(0.4,0,0.2,1)_0.8s_forwards]">
                  <div className="flex justify-center mb-2">
                    <img 
                      src="https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/a-pair-of-crossed-lightsabers.png" 
                      alt="Crossed Lightsabers" 
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="font-semibold text-purple-300">Light Sabers</div>
                  <div className="text-sm">From your fingertips</div>
                </div>
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-500 animate-float-3 opacity-0 animate-[fadeInUp_1.5s_cubic-bezier(0.4,0,0.2,1)_1.1s_forwards]">
                  <div className="flex justify-center mb-2">
                    <img 
                      src="https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/emojis.com-fruit-being-sliced-by-a-g.png" 
                      alt="Apple" 
                      className="w-12 h-12 object-contain hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="font-semibold text-pink-300">Juicy Fruit</div>
                  <div className="text-sm">Epic combos await</div>
                </div>
              </div>
              
              
            </div>

            <div className="relative animate-pulse-soft opacity-0 animate-[fadeInUp_1s_cubic-bezier(0.4,0,0.2,1)_1.8s_forwards]">
              <button
                onClick={() => setGameStarted(true)}
                disabled={!allLoaded}
                className={`group relative px-12 py-4 rounded-full font-bold text-white text-xl transition-all duration-500 font-orbitron tracking-wide transform ${
                  allLoaded
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 cursor-pointer animate-ready-glow'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="relative z-10">
                  {loading ? 'LOADING...' : (error ? 'ERROR' : 'START GAME')}
                </span>
                {allLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                )}
              </button>
              
              {/* Progress Ring Border */}
              {loading && (
                <div className="absolute inset-0 -m-1">
                  <svg className="w-full h-full" viewBox="0 0 222 64" style={{ transform: 'rotate(0deg)' }}>
                    <rect
                      x="2"
                      y="2"
                      width="218"
                      height="60"
                      rx="30"
                      ry="30"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="2"
                      y="2"
                      width="218"
                      height="60"
                      rx="30"
                      ry="30"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${progress.total * 5.0} 500`}
                      className="transition-all duration-500 ease-out drop-shadow-lg"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.5))'
                      }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00ffff" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ff00ff" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
              
              {/* Loading Details */}
              {loading && (
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-white/80 text-sm font-medium">
                    {Math.round(progress.total)}% Complete
                  </div>
                  <div className="flex justify-center space-x-4 mt-2 text-xs text-white/60">
                    <span>Images: {Math.round(progress.images)}%</span>
                    <span>Audio: {Math.round(progress.sounds)}%</span>
                    <span>AI: {Math.round(progress.models)}%</span>
                    <span>Camera: {Math.round(progress.camera)}%</span>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 max-w-sm">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm text-center">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Copyright Notice */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-40">
          <div className="text-white/40 text-xs font-medium tracking-wide bg-black/10 backdrop-blur-sm px-3 py-1 rounded">
            © 2025 fruitsaber.fun
          </div>
        </div>
      </div>
    );
  }

  return <SaberSliceGame />;
}

export default App;
