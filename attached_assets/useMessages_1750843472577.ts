
import { useState } from 'react';

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant powered by Google Genkit. How can I help you today?",
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');

  const simulateStreaming = async (userMessage: string) => {
    setIsStreaming(true);
    setStreamedResponse('');
    
    const responses = [
      "That's a great question! Let me think about this...",
      "Based on the latest AI research and Google Genkit capabilities...",
      "I can help you implement this using advanced machine learning techniques...",
      "Here's what I recommend for your specific use case..."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setStreamedResponse(prev => prev + response[i]);
    }
    
    setMessages(prev => [...prev, 
      {
        id: prev.length + 1,
        text: userMessage,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: prev.length + 2,
        text: response,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    
    setStreamedResponse('');
    setIsStreaming(false);
  };

  return {
    messages,
    setMessages,
    isStreaming,
    streamedResponse,
    simulateStreaming
  };
};
