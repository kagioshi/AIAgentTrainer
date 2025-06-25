import { supabase } from '@/integrations/supabase/client';

export interface SpeechToTextResponse {
  transcript: string;
  confidence: number;
}

export interface TextToSpeechResponse {
  audioUrl: string;
  audioBlob: Blob;
}

export interface ConversationResponse {
  response: string;
  intent?: string;
  sentiment?: number;
  confidence: number;
}

class GoogleAIService {
  private speechToTextApiKey: string | null = null;
  private textToSpeechApiKey: string | null = null;
  private geminiApiKey: string | null = null;

  async initialize() {
    try {
      // Get API keys from Supabase secrets
      const { data: secrets, error } = await supabase.functions.invoke('get-secrets', {
        body: { keys: ['GOOGLE_STT_API_KEY', 'GOOGLE_TTS_API_KEY', 'GOOGLE_GEMINI_API_KEY'] }
      });

      if (error) {
        console.error('Error fetching secrets:', error);
        return;
      }

      if (secrets) {
        this.speechToTextApiKey = secrets.GOOGLE_STT_API_KEY;
        this.textToSpeechApiKey = secrets.GOOGLE_TTS_API_KEY;
        this.geminiApiKey = secrets.GOOGLE_GEMINI_API_KEY;
      }
    } catch (error) {
      console.error('Failed to initialize Google AI service:', error);
    }
  }

  async speechToText(audioBlob: Blob): Promise<SpeechToTextResponse> {
    if (!this.speechToTextApiKey) {
      throw new Error('Google Speech-to-Text API key not configured');
    }

    try {
      // Convert blob to base64
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.speechToTextApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            model: 'latest_long',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioBase64.split(',')[1], // Remove data:audio/webm;base64, prefix
          },
        }),
      });

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          transcript: result.alternatives[0].transcript,
          confidence: result.alternatives[0].confidence || 0.9,
        };
      }

      return { transcript: '', confidence: 0 };
    } catch (error) {
      console.error('Speech-to-Text error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async textToSpeech(text: string, voiceConfig = { languageCode: 'en-US', name: 'en-US-Standard-A' }): Promise<TextToSpeechResponse> {
    if (!this.textToSpeechApiKey) {
      throw new Error('Google Text-to-Speech API key not configured');
    }

    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.textToSpeechApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: voiceConfig,
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          },
        }),
      });

      const data = await response.json();
      
      if (data.audioContent) {
        // Convert base64 to blob
        const audioBlob = this.base64ToBlob(data.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        return { audioUrl, audioBlob };
      }

      throw new Error('No audio content received');
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  async generateResponse(userMessage: string, context?: string): Promise<ConversationResponse> {
    if (!this.geminiApiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful AI customer service agent. ${context ? `Context: ${context}` : ''} Customer message: "${userMessage}". Respond professionally and helpfully.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const responseText = data.candidates[0].content.parts[0].text;
        
        // Analyze sentiment and intent (simplified)
        const sentiment = this.analyzeSentiment(userMessage);
        const intent = this.detectIntent(userMessage);
        
        return {
          response: responseText,
          intent,
          sentiment,
          confidence: 0.9,
        };
      }

      throw new Error('No response generated');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private analyzeSentiment(text: string): number {
    // Simplified sentiment analysis - in production, use proper ML model
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'thank', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'angry', 'frustrated', 'disappointed', 'problem', 'issue'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score / words.length * 10));
  }

  private detectIntent(text: string): string {
    // Simplified intent detection - in production, use proper NLU model
    const intents = {
      'billing': ['bill', 'payment', 'charge', 'invoice', 'cost', 'price'],
      'support': ['help', 'problem', 'issue', 'error', 'broken', 'not working'],
      'account': ['account', 'profile', 'login', 'password', 'settings'],
      'general': ['hello', 'hi', 'thanks', 'thank you', 'goodbye']
    };

    const lowerText = text.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general';
  }
}

export const googleAIService = new GoogleAIService();
