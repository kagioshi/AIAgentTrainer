
import { useRef } from 'react';

export const useAudioPlayback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  };

  const playAudioResponse = (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.remove();
      }
      
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error("Audio playback error:", error);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  };

  const cleanupAudioContext = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
  };

  return {
    initializeAudioContext,
    playAudioResponse,
    cleanupAudioContext
  };
};
