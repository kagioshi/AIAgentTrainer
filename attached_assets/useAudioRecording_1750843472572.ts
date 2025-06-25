
import { useState, useRef } from 'react';
import { requestMicrophone } from '../utils/voiceUtils';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const initializeRecording = async (): Promise<MediaRecorder> => {
    const stream = await requestMicrophone();
    audioStreamRef.current = stream;
    
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.onstart = () => {
      audioChunksRef.current = [];
      setIsRecording(true);
    };
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      setIsRecording(false);
    };
    
    return mediaRecorder;
  };

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleMute = () => {
    if (audioStreamRef.current) {
      const audioTracks = audioStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const getAudioBlob = (): Blob | null => {
    if (audioChunksRef.current.length === 0) return null;
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];
    return audioBlob;
  };

  const cleanupRecording = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };

  return {
    isRecording,
    isMuted,
    initializeRecording,
    startRecording,
    stopRecording,
    toggleRecording,
    toggleMute,
    getAudioBlob,
    cleanupRecording
  };
};
