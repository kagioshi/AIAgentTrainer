import { storage } from "../storage";
import { knowledgeRetrieval } from "./knowledgeRetrieval";
import { InsertAiAgent, InsertAgentContainer } from "@shared/schema";

// Agent template configurations
interface AgentTemplate {
  id: string;
  name: string;
  provider: 'wit' | 'rasa' | 'dialogflow' | 'custom';
  baseConfig: any;
  requiredSecrets: string[];
  features: string[];
  replTemplate?: string;
}

interface AgentDeployment {
  agentId: string;
  containerName: string;
  replUrl: string;
  namespace: string;
  status: string;
  createdAt: Date;
}

// Mock Replit API (in production, would use actual Replit API)
class ReplitAPI {
  async createRepl(name: string, template: string): Promise<string> {
    // Simulate Repl creation
    return `https://${name}.repl.co`;
  }

  async setSecrets(replUrl: string, secrets: Record<string, string>): Promise<void> {
    // Simulate setting secrets
    console.log(`Setting secrets for ${replUrl}`);
  }

  async runRepl(replUrl: string): Promise<void> {
    // Simulate running the Repl
    console.log(`Starting ${replUrl}`);
  }

  async stopRepl(replUrl: string): Promise<void> {
    // Simulate stopping the Repl
    console.log(`Stopping ${replUrl}`);
  }
}

export class PersonaAgentFactory {
  private replitAPI: ReplitAPI;
  private templates: Map<string, AgentTemplate>;

  constructor() {
    this.replitAPI = new ReplitAPI();
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Define agent templates
    const templates: AgentTemplate[] = [
      {
        id: 'wit-sales',
        name: 'Wit.ai Sales Agent',
        provider: 'wit',
        baseConfig: {
          language: 'en',
          timezone: 'UTC',
          confidence_threshold: 0.7
        },
        requiredSecrets: ['WIT_SERVER_TOKEN', 'WIT_CLIENT_TOKEN'],
        features: ['intent_recognition', 'entity_extraction', 'multilingual'],
        replTemplate: 'wit-agent-template'
      },
      {
        id: 'rasa-support',
        name: 'Rasa Support Agent',
        provider: 'rasa',
        baseConfig: {
          pipeline: 'pretrained_embeddings_spacy',
          policies: ['MemoizationPolicy', 'TEDPolicy'],
          language: 'en'
        },
        requiredSecrets: ['RASA_TOKEN'],
        features: ['custom_actions', 'forms', 'stories'],
        replTemplate: 'rasa-agent-template'
      },
      {
        id: 'dialogflow-scheduler',
        name: 'Dialogflow Appointment Scheduler',
        provider: 'dialogflow',
        baseConfig: {
          language_code: 'en-US',
          time_zone: 'America/New_York'
        },
        requiredSecrets: ['GOOGLE_APPLICATION_CREDENTIALS', 'DIALOGFLOW_PROJECT_ID'],
        features: ['context_management', 'fulfillment', 'rich_responses'],
        replTemplate: 'dialogflow-agent-template'
      },
      {
        id: 'custom-conversational',
        name: 'Custom Conversational Agent',
        provider: 'custom',
        baseConfig: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 150
        },
        requiredSecrets: ['OPENAI_API_KEY'],
        features: ['custom_logic', 'api_integration', 'webhook_support'],
        replTemplate: 'custom-agent-template'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Create agent from template
  async createAgent(
    tenantId: string,
    templateId: string,
    agentData: {
      name: string;
      description?: string;
      persona?: any;
      customConfig?: any;
    }
  ): Promise<AgentDeployment> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create agent record in database
    const agent = await storage.createAiAgent({
      tenantId,
      name: agentData.name,
      description: agentData.description || `Agent created from ${template.name} template`,
      status: 'inactive',
      modelConfig: {
        ...template.baseConfig,
        ...agentData.customConfig,
        provider: template.provider
      },
      version: '1.0'
    });

    // Create container for the agent
    const containerName = `${tenantId}-${agent.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const namespace = `/tenants/${tenantId}/agents/${agent.id}`;
    
    // Deploy to Replit
    const replUrl = await this.deployAgent(
      containerName,
      template,
      {
        tenantId,
        agentId: agent.id,
        persona: agentData.persona
      }
    );

    // Create container record
    await storage.createAgentContainer({
      tenantId,
      agentId: agent.id,
      containerName,
      namespace,
      status: 'starting',
      replUrl,
      resourceLimits: {
        cpu: '1 core',
        memory: '512MB',
        storage: '1GB'
      },
      environment: {
        NODE_ENV: 'production',
        AGENT_ID: agent.id,
        TENANT_ID: tenantId
      }
    });

    // Index persona in knowledge base if provided
    if (agentData.persona) {
      await knowledgeRetrieval.indexAgentPersona(
        tenantId,
        agent.id,
        agentData.persona
      );
    }

    return {
      agentId: agent.id,
      containerName,
      replUrl,
      namespace,
      status: 'deployed',
      createdAt: new Date()
    };
  }

  // Deploy agent to Replit
  private async deployAgent(
    containerName: string,
    template: AgentTemplate,
    config: any
  ): Promise<string> {
    // Create Repl from template
    const replUrl = await this.replitAPI.createRepl(
      containerName,
      template.replTemplate || 'base-agent-template'
    );

    // Set environment variables and secrets
    const secrets: Record<string, string> = {
      TENANT_ID: config.tenantId,
      AGENT_ID: config.agentId,
      CONTAINER_NAME: containerName
    };

    // Get tenant-specific secrets from storage
    const tenantSecrets = await this.getTenantSecrets(
      config.tenantId,
      template.requiredSecrets
    );
    
    Object.assign(secrets, tenantSecrets);

    await this.replitAPI.setSecrets(replUrl, secrets);

    // Start the Repl
    await this.replitAPI.runRepl(replUrl);

    return replUrl;
  }

  // Get tenant secrets (mock implementation)
  private async getTenantSecrets(
    tenantId: string,
    requiredSecrets: string[]
  ): Promise<Record<string, string>> {
    // In production, would fetch from secure storage
    const mockSecrets: Record<string, string> = {};
    
    requiredSecrets.forEach(secret => {
      mockSecrets[secret] = `mock_${secret}_for_${tenantId}`;
    });
    
    return mockSecrets;
  }

  // Clone existing agent
  async cloneAgent(
    tenantId: string,
    sourceAgentId: string,
    newName: string
  ): Promise<AgentDeployment> {
    // Get source agent
    const sourceAgent = await storage.getAgent(sourceAgentId);
    if (!sourceAgent) {
      throw new Error('Source agent not found');
    }

    // Create new agent with same config
    return await this.createAgent(tenantId, 'custom-conversational', {
      name: newName,
      description: `Cloned from ${sourceAgent.name}`,
      customConfig: sourceAgent.modelConfig
    });
  }

  // Update agent configuration
  async updateAgentConfig(
    agentId: string,
    updates: {
      config?: any;
      secrets?: Record<string, string>;
      resourceLimits?: any;
    }
  ): Promise<void> {
    const container = await storage.getAgentContainer(agentId);
    if (!container) {
      throw new Error('Agent container not found');
    }

    if (updates.config) {
      await storage.updateAiAgent(agentId, {
        modelConfig: updates.config
      });
    }

    if (updates.secrets) {
      await this.replitAPI.setSecrets(container.replUrl, updates.secrets);
    }

    if (updates.resourceLimits) {
      await storage.updateAgentContainer(container.id, {
        resourceLimits: updates.resourceLimits
      });
    }
  }

  // Get available templates
  getTemplates(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get template by ID
  getTemplate(templateId: string): AgentTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Version agent
  async versionAgent(agentId: string, versionTag?: string): Promise<string> {
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const currentVersion = agent.version || '1.0';
    const versionParts = currentVersion.split('.');
    const newPatch = parseInt(versionParts[2] || '0') + 1;
    const newVersion = versionTag || `${versionParts[0]}.${versionParts[1]}.${newPatch}`;

    // Save current state as version
    const versionData = {
      agentId,
      version: newVersion,
      modelConfig: agent.modelConfig,
      trainingData: agent.trainingData,
      createdAt: new Date()
    };

    // Store version (in production, would use version control system)
    await storage.updateAiAgent(agentId, {
      version: newVersion
    });

    console.log(`Created version ${newVersion} for agent ${agentId}`);
    return newVersion;
  }

  // Rollback to specific version
  async rollbackAgent(agentId: string, targetVersion: string): Promise<void> {
    // In production, would restore from version control
    console.log(`Rolling back agent ${agentId} to version ${targetVersion}`);
    
    await storage.updateAiAgent(agentId, {
      version: targetVersion
    });
  }

  // Health check for agent container
  async checkAgentHealth(agentId: string): Promise<{
    status: string;
    uptime?: number;
    lastHealthCheck: Date;
    metrics?: any;
  }> {
    const container = await storage.getAgentContainer(agentId);
    if (!container) {
      return {
        status: 'not_found',
        lastHealthCheck: new Date()
      };
    }

    // In production, would make actual health check request
    const health = {
      status: container.status || 'unknown',
      uptime: Math.floor(Math.random() * 86400), // Mock uptime in seconds
      lastHealthCheck: new Date(),
      metrics: {
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 512,
        request_count: Math.floor(Math.random() * 1000),
        error_rate: Math.random() * 5
      }
    };

    // Update last health check
    await storage.updateAgentContainer(container.id, {
      lastHealthCheck: health.lastHealthCheck,
      status: health.status as any
    });

    return health;
  }

  // Stop agent container
  async stopAgent(agentId: string): Promise<void> {
    const container = await storage.getAgentContainer(agentId);
    if (!container) {
      throw new Error('Agent container not found');
    }

    await this.replitAPI.stopRepl(container.replUrl);
    
    await storage.updateAgentContainer(container.id, {
      status: 'stopped'
    });

    await storage.updateAiAgent(agentId, {
      status: 'inactive'
    });
  }

  // Start agent container
  async startAgent(agentId: string): Promise<void> {
    const container = await storage.getAgentContainer(agentId);
    if (!container) {
      throw new Error('Agent container not found');
    }

    await this.replitAPI.runRepl(container.replUrl);
    
    await storage.updateAgentContainer(container.id, {
      status: 'running'
    });

    await storage.updateAiAgent(agentId, {
      status: 'deployed'
    });
  }
}

// Export singleton instance
export const personaAgentFactory = new PersonaAgentFactory();