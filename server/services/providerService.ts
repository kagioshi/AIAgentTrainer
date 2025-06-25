import { storage } from "../storage";
import type { Provider, InsertProvider, ProviderConfig } from "@shared/schema";

// VoIP Provider Configurations
const VOIP_PROVIDERS = {
  'voip.ms': {
    name: 'VoIP.ms',
    type: 'voip' as const,
    apiEndpoint: 'https://voip.ms/api/v1',
    requiredConfig: ['username', 'password', 'did'],
    features: ['inbound', 'outbound', 'sms', 'recording']
  },
  'twilio': {
    name: 'Twilio',
    type: 'voip' as const,
    apiEndpoint: 'https://api.twilio.com/2010-04-01',
    requiredConfig: ['account_sid', 'auth_token', 'phone_number'],
    features: ['inbound', 'outbound', 'sms', 'recording', 'conferencing']
  },
  'vonage': {
    name: 'Vonage (Nexmo)',
    type: 'voip' as const,
    apiEndpoint: 'https://api.nexmo.com',
    requiredConfig: ['api_key', 'api_secret', 'application_id'],
    features: ['inbound', 'outbound', 'sms', 'recording']
  },
  'grasshopper': {
    name: 'Grasshopper',
    type: 'voip' as const,
    apiEndpoint: 'https://api.grasshopper.com/v1',
    requiredConfig: ['api_key', 'phone_number'],
    features: ['inbound', 'outbound', 'voicemail']
  },
  'exotel': {
    name: 'Exotel',
    type: 'voip' as const,
    apiEndpoint: 'https://api.exotel.com/v1',
    requiredConfig: ['sid', 'token', 'subdomain'],
    features: ['inbound', 'outbound', 'recording']
  },
  'poptox': {
    name: 'Poptox',
    type: 'voip' as const,
    apiEndpoint: 'https://api.poptox.com/v1',
    requiredConfig: ['api_key', 'caller_id'],
    features: ['outbound']
  },
  'freepbx': {
    name: 'FreePBX',
    type: 'voip' as const,
    apiEndpoint: 'custom',
    requiredConfig: ['server_url', 'username', 'password', 'extension'],
    features: ['inbound', 'outbound', 'recording', 'queues']
  },
  'plivo': {
    name: 'Plivo',
    type: 'voip' as const,
    apiEndpoint: 'https://api.plivo.com/v1',
    requiredConfig: ['auth_id', 'auth_token', 'phone_number'],
    features: ['inbound', 'outbound', 'sms', 'recording']
  },
  '3cx': {
    name: '3CX',
    type: 'voip' as const,
    apiEndpoint: 'custom',
    requiredConfig: ['server_url', 'username', 'password'],
    features: ['inbound', 'outbound', 'recording', 'conferencing']
  },
  'zoho_voice': {
    name: 'Zoho Voice',
    type: 'voip' as const,
    apiEndpoint: 'https://voice.zoho.com/api/v1',
    requiredConfig: ['client_id', 'client_secret', 'refresh_token'],
    features: ['inbound', 'outbound', 'recording']
  }
};

// STT Provider Configurations
const STT_PROVIDERS = {
  'google_cloud_stt': {
    name: 'Google Cloud Speech-to-Text',
    type: 'stt' as const,
    apiEndpoint: 'https://speech.googleapis.com/v1',
    requiredConfig: ['service_account_json'],
    features: ['streaming', 'batch', 'multilingual', 'enhanced']
  },
  'azure_stt': {
    name: 'Azure Speech Services',
    type: 'stt' as const,
    apiEndpoint: 'https://api.cognitive.microsoft.com/sts/v1.0',
    requiredConfig: ['subscription_key', 'region'],
    features: ['streaming', 'batch', 'multilingual', 'custom_models']
  },
  'openai_whisper': {
    name: 'OpenAI Whisper',
    type: 'stt' as const,
    apiEndpoint: 'https://api.openai.com/v1',
    requiredConfig: ['api_key'],
    features: ['file_upload', 'multilingual', 'translation']
  }
};

// TTS Provider Configurations
const TTS_PROVIDERS = {
  'google_cloud_tts': {
    name: 'Google Cloud Text-to-Speech',
    type: 'tts' as const,
    apiEndpoint: 'https://texttospeech.googleapis.com/v1',
    requiredConfig: ['service_account_json'],
    features: ['neural_voices', 'ssml', 'multilingual']
  },
  'azure_tts': {
    name: 'Azure Speech Services',
    type: 'tts' as const,
    apiEndpoint: 'https://api.cognitive.microsoft.com/sts/v1.0',
    requiredConfig: ['subscription_key', 'region'],
    features: ['neural_voices', 'ssml', 'multilingual', 'custom_voices']
  },
  'openai_tts': {
    name: 'OpenAI Text-to-Speech',
    type: 'tts' as const,
    apiEndpoint: 'https://api.openai.com/v1',
    requiredConfig: ['api_key'],
    features: ['natural_voices', 'streaming']
  },
  'elevenlabs': {
    name: 'ElevenLabs',
    type: 'tts' as const,
    apiEndpoint: 'https://api.elevenlabs.io/v1',
    requiredConfig: ['api_key'],
    features: ['voice_cloning', 'premium_voices', 'streaming']
  }
};

export class ProviderService {
  async initializeDefaultProviders() {
    const allProviders = {
      ...VOIP_PROVIDERS,
      ...STT_PROVIDERS,
      ...TTS_PROVIDERS
    };

    for (const [key, config] of Object.entries(allProviders)) {
      const existingProvider = await storage.getProviderByKey(key);
      
      if (!existingProvider) {
        await storage.createProvider({
          name: config.name,
          type: config.type,
          apiEndpoint: config.apiEndpoint,
          isActive: false,
          metadata: {
            providerKey: key,
            requiredConfig: config.requiredConfig,
            features: config.features
          }
        });
      }
    }
  }

  async configureProvider(providerId: string, tenantId: string | null, config: Record<string, any>) {
    const provider = await storage.getProvider(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const requiredConfig = provider.metadata?.requiredConfig as string[] || [];
    
    // Validate required configuration
    for (const key of requiredConfig) {
      if (!config[key]) {
        throw new Error(`Missing required configuration: ${key}`);
      }
    }

    // Store configuration securely
    for (const [key, value] of Object.entries(config)) {
      await storage.createProviderConfig({
        tenantId,
        providerId,
        configKey: key,
        configValue: value,
        isEncrypted: this.shouldEncrypt(key),
        isActive: true
      });
    }

    // Activate provider
    await storage.updateProvider(providerId, { isActive: true });
  }

  async getProviderConfig(providerId: string, tenantId?: string): Promise<Record<string, any>> {
    const configs = await storage.getProviderConfigs(providerId, tenantId);
    const result: Record<string, any> = {};
    
    for (const config of configs) {
      result[config.configKey] = config.configValue;
    }
    
    return result;
  }

  async testProviderConnection(providerId: string, tenantId?: string): Promise<boolean> {
    const provider = await storage.getProvider(providerId);
    const config = await this.getProviderConfig(providerId, tenantId);
    
    if (!provider) return false;

    try {
      switch (provider.type) {
        case 'voip':
          return await this.testVoipProvider(provider, config);
        case 'stt':
          return await this.testSttProvider(provider, config);
        case 'tts':
          return await this.testTtsProvider(provider, config);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Provider test failed for ${provider.name}:`, error);
      return false;
    }
  }

  private async testVoipProvider(provider: Provider, config: Record<string, any>): Promise<boolean> {
    // Implementation would depend on specific provider
    // For now, just check if required config is present
    const requiredConfig = provider.metadata?.requiredConfig as string[] || [];
    return requiredConfig.every(key => config[key]);
  }

  private async testSttProvider(provider: Provider, config: Record<string, any>): Promise<boolean> {
    // Test STT provider connection
    const requiredConfig = provider.metadata?.requiredConfig as string[] || [];
    return requiredConfig.every(key => config[key]);
  }

  private async testTtsProvider(provider: Provider, config: Record<string, any>): Promise<boolean> {
    // Test TTS provider connection
    const requiredConfig = provider.metadata?.requiredConfig as string[] || [];
    return requiredConfig.every(key => config[key]);
  }

  private shouldEncrypt(configKey: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'api_key', 'auth_token',
      'client_secret', 'service_account_json', 'subscription_key'
    ];
    
    return sensitiveKeys.some(sensitive => 
      configKey.toLowerCase().includes(sensitive)
    );
  }

  async getActiveProvidersByType(type: 'voip' | 'stt' | 'tts', tenantId?: string): Promise<Provider[]> {
    return await storage.getProvidersByType(type, true);
  }

  async setDefaultProvider(tenantId: string, providerType: 'voip' | 'stt' | 'tts', providerId: string) {
    await storage.createProviderConfig({
      tenantId,
      providerId,
      configKey: `default_${providerType}_provider`,
      configValue: providerId,
      isActive: true
    });
  }
}

export const providerService = new ProviderService();