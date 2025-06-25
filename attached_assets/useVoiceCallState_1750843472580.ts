
import { useState } from 'react';
import { VoiceState } from '../utils/callStateManager';

export const useVoiceCallState = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('inactive');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  return {
    isInCall,
    setIsInCall,
    voiceState,
    setVoiceState,
    currentCallId,
    setCurrentCallId
  };
};
