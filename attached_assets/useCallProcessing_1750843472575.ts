
import { useToast } from '@/hooks/use-toast';
import { googleAIService } from '../services/googleAI';
import { realtimeDataService } from '../services/realtimeData';
import { CallStateManager } from '../utils/callStateManager';
import { useAudioPlayback } from './useAudioPlayback';

interface UseCallProcessingProps {
  stateManager: CallStateManager;
  currentCallId: string | null;
  isInCall: boolean;
  getAudioBlob: () => Blob | null;
  startRecording: () => void;
  onSpeechRecognized?: (text: string, response: string) => void;
}

export const useCallProcessing = ({
  stateManager,
  currentCallId,
  isInCall,
  getAudioBlob,
  startRecording,
  onSpeechRecognized
}: UseCallProcessingProps) => {
  const { toast } = useToast();
  const { playAudioResponse } = useAudioPlayback();

  const processVoiceInput = async () => {
    const audioBlob = getAudioBlob();
    if (!audioBlob) return;
    
    stateManager.transitionToProcessing();
    
    try {
      const sttResult = await googleAIService.speechToText(audioBlob);
      
      if (sttResult.transcript) {
        console.log("Speech recognized:", sttResult.transcript);
        
        const aiResponse = await googleAIService.generateResponse(sttResult.transcript);
        
        if (currentCallId) {
          await realtimeDataService.updateCall(currentCallId, {
            sentiment_score: aiResponse.sentiment,
            intent: aiResponse.intent,
            transcript: sttResult.transcript
          });
        }
        
        stateManager.transitionToSpeaking();
        const ttsResult = await googleAIService.textToSpeech(aiResponse.response);
        
        await playAudioResponse(ttsResult.audioUrl);
        
        if (onSpeechRecognized) {
          onSpeechRecognized(sttResult.transcript, aiResponse.response);
        }
        
        stateManager.transitionToListening();
        if (isInCall) {
          startRecording();
        }
      } else {
        stateManager.transitionToListening();
        if (isInCall) {
          startRecording();
        }
      }
      
    } catch (error) {
      console.error("Error processing voice input:", error);
      stateManager.transitionToListening();
      
      toast({
        title: "Processing Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive"
      });
      
      if (isInCall) {
        startRecording();
      }
    }
  };

  return {
    processVoiceInput
  };
};
