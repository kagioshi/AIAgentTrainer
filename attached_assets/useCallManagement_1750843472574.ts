
import { useToast } from '@/hooks/use-toast';
import { realtimeDataService } from '../services/realtimeData';
import { CallStateManager } from '../utils/callStateManager';
import { useAudioRecording } from './useAudioRecording';
import { useAudioPlayback } from './useAudioPlayback';
import { supabase } from '@/integrations/supabase/client';

interface UseCallManagementProps {
  stateManager: CallStateManager;
  setIsInCall: (inCall: boolean) => void;
  setCurrentCallId: (id: string | null) => void;
  callDuration: number;
  processVoiceInput: () => void;
}

export const useCallManagement = ({
  stateManager,
  setIsInCall,
  setCurrentCallId,
  callDuration,
  processVoiceInput
}: UseCallManagementProps) => {
  const { toast } = useToast();
  const { initializeAudioContext, cleanupAudioContext } = useAudioPlayback();
  const { 
    initializeRecording, 
    stopRecording,
    isRecording,
    cleanupRecording 
  } = useAudioRecording();

  const startCall = async () => {
    try {
      stateManager.transitionToConnecting();
      
      // Get a random customer for demo purposes
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .limit(1)
        .single();
      
      const customerId = customers?.id || 'demo-customer-id';
      
      const callData = await realtimeDataService.createCall({
        customer_id: customerId,
        call_type: 'inbound'
      });
      setCurrentCallId(callData.id);
      
      initializeAudioContext();
      const mediaRecorder = await initializeRecording();
      
      mediaRecorder.onstop = () => {
        processVoiceInput();
      };
      
      setIsInCall(true);
      mediaRecorder.start();
      stateManager.transitionToListening();
      
      if (callData.id) {
        await realtimeDataService.updateCall(callData.id, { status: 'active' });
      }
      
      toast({
        title: "Call Connected",
        description: "You're now connected to the AI Agent",
      });
      
    } catch (error) {
      console.error("Error starting voice call:", error);
      stateManager.transitionToInactive();
      toast({
        title: "Failed to Start Call",
        description: "Please ensure microphone permissions are enabled",
        variant: "destructive"
      });
    }
  };

  const endCall = async (currentCallId: string | null) => {
    if (isRecording) {
      stopRecording();
    }
    
    if (currentCallId) {
      await realtimeDataService.updateCall(currentCallId, {
        status: 'completed',
        duration: callDuration
      });
    }
    
    cleanupAudioResources();
    
    setIsInCall(false);
    stateManager.transitionToInactive();
    setCurrentCallId(null);
    
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatCallDuration(callDuration)}`,
    });
  };

  const cleanupAudioResources = () => {
    cleanupRecording();
    cleanupAudioContext();
  };

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    startCall,
    endCall,
    cleanupAudioResources,
    formatCallDuration
  };
};
