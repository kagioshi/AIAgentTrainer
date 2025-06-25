
import { useEffect } from 'react';
import { googleAIService } from '../services/googleAI';
import { CallStateManager } from '../utils/callStateManager';
import { useCallTimer } from './useCallTimer';
import { useAudioRecording } from './useAudioRecording';
import { useVoiceCallState } from './useVoiceCallState';
import { useCallProcessing } from './useCallProcessing';
import { useCallManagement } from './useCallManagement';

export { type VoiceState } from '../utils/callStateManager';

export const useVoiceCall = (onSpeechRecognized?: (text: string, response: string) => void) => {
  const {
    isInCall,
    setIsInCall,
    voiceState,
    setVoiceState,
    currentCallId,
    setCurrentCallId
  } = useVoiceCallState();
  
  const callDuration = useCallTimer(isInCall);
  const stateManager = new CallStateManager(setVoiceState);
  
  const {
    isRecording,
    isMuted,
    startRecording,
    toggleRecording,
    toggleMute,
    getAudioBlob,
    cleanupRecording
  } = useAudioRecording();

  const { processVoiceInput } = useCallProcessing({
    stateManager,
    currentCallId,
    isInCall,
    getAudioBlob,
    startRecording,
    onSpeechRecognized
  });

  const { 
    startCall, 
    endCall, 
    cleanupAudioResources,
    formatCallDuration 
  } = useCallManagement({
    stateManager,
    setIsInCall,
    setCurrentCallId,
    callDuration,
    processVoiceInput
  });

  useEffect(() => {
    googleAIService.initialize().catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  const handleEndCall = () => {
    endCall(currentCallId);
  };

  return {
    isInCall,
    voiceState,
    isRecording,
    isMuted,
    callDuration,
    currentCallId,
    startCall,
    endCall: handleEndCall,
    toggleMute,
    toggleRecording,
    formatCallDuration
  };
};

export default useVoiceCall;
