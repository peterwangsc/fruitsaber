import { useRef, useCallback } from 'react';
import { Howl } from 'howler';

interface SoundEffects {
  ignition: HTMLAudioElement;
  slice1: HTMLAudioElement;
  slice2: HTMLAudioElement;
  backgroundMusic: Howl;
}

export const useSoundEffects = () => {
  const soundsRef = useRef<SoundEffects | null>(null);
  const initialized = useRef(false);
  const musicStarted = useRef(false);

  const initializeSounds = useCallback(() => {
    if (initialized.current) return;

    try {
      const ignition = new Audio('https://staging.mocha-cdn.com/019706c5-583c-73f1-b0d8-9727dac48ded/lightsaber-ignition-6816.mp3');
      const slice1 = new Audio('https://staging.mocha-cdn.com/019706c5-583c-73f1-b0d8-9727dac48ded/lightsaber3-87667.mp3');
      const slice2 = new Audio('https://staging.mocha-cdn.com/019706c5-583c-73f1-b0d8-9727dac48ded/knife-stab-sound-effect-36354.mp3');

      // Use Howler.js for background music for better control and reliability
      const backgroundMusic = new Howl({
        src: ['https://staging.mocha-cdn.com/019723e7-7857-7a59-a1bf-aad8d25cd1be/Crazy-Taxi.mp3'],
        loop: true,
        volume: 0.3,
        autoplay: false, // We'll control when it starts
        preload: true,
        onload: () => {
          console.log('Background music loaded successfully');
          // Music will be started only by App.tsx component
        },
        onloaderror: (id, error) => {
          console.warn('Failed to load background music:', error);
        },
        onplay: () => {
          console.log('Background music started playing');
          musicStarted.current = true;
        },
        onpause: () => {
          console.log('Background music paused');
        },
        onresume: () => {
          console.log('Background music resumed');
        }
      });

      // Set volume levels for other sounds
      ignition.volume = 0.6;
      slice1.volume = 0.4;
      slice2.volume = 0.5;

      // Preload sounds
      ignition.preload = 'auto';
      slice1.preload = 'auto';
      slice2.preload = 'auto';

      soundsRef.current = {
        ignition,
        slice1,
        slice2,
        backgroundMusic
      };

      initialized.current = true;
      console.log('Sound effects initialized with Howler.js background music');
    } catch (error) {
      console.warn('Failed to initialize sound effects:', error);
    }
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (!soundsRef.current?.backgroundMusic || musicStarted.current) return;
    
    try {
      // Howler.js handles autoplay policies automatically
      soundsRef.current.backgroundMusic.play();
      musicStarted.current = true; // Set flag immediately to prevent duplicates
    } catch (error) {
      console.warn('Could not start background music:', error);
    }
  }, []);

  const playIgnition = useCallback(() => {
    if (!soundsRef.current) return;
    
    try {
      soundsRef.current.ignition.currentTime = 0;
      soundsRef.current.ignition.play().catch(err => {
        console.warn('Could not play ignition sound:', err);
      });
    } catch (error) {
      console.warn('Error playing ignition sound:', error);
    }
  }, []);

  const playSlice = useCallback(() => {
    if (!soundsRef.current) return;

    try {
      // Alternate between the two slice sounds for variety
      const sound = Math.random() > 0.5 ? soundsRef.current.slice1 : soundsRef.current.slice2;
      sound.currentTime = 0;
      sound.play().catch(err => {
        console.warn('Could not play slice sound:', err);
      });
    } catch (error) {
      console.warn('Error playing slice sound:', error);
    }
  }, []);

  const playBackgroundMusic = useCallback(() => {
    startBackgroundMusic();
  }, [startBackgroundMusic]);

  const pauseBackgroundMusic = useCallback(() => {
    if (!soundsRef.current?.backgroundMusic) return;
    
    try {
      soundsRef.current.backgroundMusic.pause();
    } catch (error) {
      console.warn('Error pausing background music:', error);
    }
  }, []);

  const resumeBackgroundMusic = useCallback(() => {
    if (!soundsRef.current?.backgroundMusic) return;
    
    try {
      if (soundsRef.current.backgroundMusic.playing()) {
        return; // Already playing
      }
      soundsRef.current.backgroundMusic.play();
    } catch (error) {
      console.warn('Error resuming background music:', error);
    }
  }, []);

  return {
    initializeSounds,
    playIgnition,
    playSlice,
    playBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic
  };
};
