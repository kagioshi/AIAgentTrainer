import { storage } from "../storage";
import type { ConversationFlow, InsertConversationFlow } from "@shared/schema";

export interface FlowwiseNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    parameters?: Record<string, any>;
  };
}

export interface FlowwiseEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowwiseFlow {
  nodes: FlowwiseNode[];
  edges: FlowwiseEdge[];
  viewport: { x: number; y: number; zoom: number };
}

export class FlowwiseIntegrationService {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.FLOWWISE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async createChatFlow(tenantId: string, agentId: string, flowConfig: {
    name: string;
    description?: string;
    nodes: FlowwiseNode[];
    edges: FlowwiseEdge[];
  }): Promise<ConversationFlow> {
    const flowwiseFlow: FlowwiseFlow = {
      nodes: flowConfig.nodes,
      edges: flowConfig.edges,
      viewport: { x: 0, y: 0, zoom: 1 }
    };

    // Create flow in Flowwise
    const flowwiseResponse = await this.createFlowwiseFlow({
      name: flowConfig.name,
      flowData: JSON.stringify(flowwiseFlow),
      deployed: false,
      isPublic: false
    });

    // Store in our database
    const conversationFlow = await storage.createConversationFlow({
      tenantId,
      agentId,
      name: flowConfig.name,
      description: flowConfig.description,
      flowData: {
        flowwiseId: flowwiseResponse.id,
        nodes: flowConfig.nodes,
        edges: flowConfig.edges,
        deploymentUrl: flowwiseResponse.deploymentUrl
      },
      isActive: true,
      version: "1.0"
    });

    return conversationFlow;
  }

  async deployFlow(flowId: string): Promise<{ deploymentUrl: string; apiKey: string }> {
    const flow = await storage.getConversationFlow(flowId);
    if (!flow) throw new Error("Flow not found");

    const flowwiseId = flow.flowData?.flowwiseId;
    if (!flowwiseId) throw new Error("Flowwise ID not found");

    // Deploy in Flowwise
    const deployment = await this.deployFlowwiseFlow(flowwiseId);

    // Update our record
    await storage.updateConversationFlow(flowId, {
      flowData: {
        ...flow.flowData,
        deployed: true,
        deploymentUrl: deployment.deploymentUrl,
        apiKey: deployment.apiKey
      }
    });

    return deployment;
  }

  async createLLMChain(config: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  }): FlowwiseNode {
    return {
      id: `llm-${Date.now()}`,
      type: 'llmChain',
      position: { x: 100, y: 100 },
      data: {
        label: 'LLM Chain',
        parameters: {
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          systemPrompt: config.systemPrompt
        }
      }
    };
  }

  async createVectorStore(config: {
    embeddings: string;
    vectorStore: string;
    documents?: string[];
  }): FlowwiseNode {
    return {
      id: `vector-${Date.now()}`,
      type: 'vectorStore',
      position: { x: 300, y: 100 },
      data: {
        label: 'Vector Store',
        parameters: {
          embeddings: config.embeddings,
          vectorStore: config.vectorStore,
          documents: config.documents
        }
      }
    };
  }

  async createRetriever(vectorStoreId: string, config: {
    k: number;
    searchType: 'similarity' | 'mmr';
  }): FlowwiseNode {
    return {
      id: `retriever-${Date.now()}`,
      type: 'retriever',
      position: { x: 500, y: 100 },
      data: {
        label: 'Retriever',
        inputs: {
          vectorStore: vectorStoreId
        },
        parameters: {
          k: config.k,
          searchType: config.searchType
        }
      }
    };
  }

  async createConversationalAgent(config: {
    llmChainId: string;
    retrieverId?: string;
    tools?: string[];
    memory?: string;
  }): FlowwiseNode {
    return {
      id: `agent-${Date.now()}`,
      type: 'conversationalAgent',
      position: { x: 700, y: 100 },
      data: {
        label: 'Conversational Agent',
        inputs: {
          llmChain: config.llmChainId,
          retriever: config.retrieverId,
          tools: config.tools,
          memory: config.memory
        }
      }
    };
  }

  async createRAGFlow(tenantId: string, agentId: string, config: {
    name: string;
    model: string;
    documents: string[];
    systemPrompt?: string;
  }): Promise<ConversationFlow> {
    // Create nodes
    const llmNode = await this.createLLMChain({
      model: config.model,
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: config.systemPrompt
    });

    const vectorNode = await this.createVectorStore({
      embeddings: 'openai',
      vectorStore: 'pinecone',
      documents: config.documents
    });

    const retrieverNode = await this.createRetriever(vectorNode.id, {
      k: 5,
      searchType: 'similarity'
    });

    const agentNode = await this.createConversationalAgent({
      llmChainId: llmNode.id,
      retrieverId: retrieverNode.id,
      memory: 'bufferMemory'
    });

    // Create edges
    const edges: FlowwiseEdge[] = [
      {
        id: `${vectorNode.id}-${retrieverNode.id}`,
        source: vectorNode.id,
        target: retrieverNode.id
      },
      {
        id: `${llmNode.id}-${agentNode.id}`,
        source: llmNode.id,
        target: agentNode.id
      },
      {
        id: `${retrieverNode.id}-${agentNode.id}`,
        source: retrieverNode.id,
        target: agentNode.id
      }
    ];

    return await this.createChatFlow(tenantId, agentId, {
      name: config.name,
      description: "RAG-enabled conversational flow",
      nodes: [llmNode, vectorNode, retrieverNode, agentNode],
      edges
    });
  }

  private async createFlowwiseFlow(flowData: any): Promise<{ id: string; deploymentUrl?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/chatflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowData)
      });

      if (!response.ok) {
        throw new Error(`Flowwise API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create Flowwise flow:', error);
      // Return mock data for development
      return {
        id: `mock-flow-${Date.now()}`,
        deploymentUrl: `${this.baseUrl}/api/v1/prediction/mock-flow-${Date.now()}`
      };
    }
  }

  private async deployFlowwiseFlow(flowId: string): Promise<{ deploymentUrl: string; apiKey: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/chatflows/${flowId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Flowwise deployment error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to deploy Flowwise flow:', error);
      // Return mock data for development
      return {
        deploymentUrl: `${this.baseUrl}/api/v1/prediction/${flowId}`,
        apiKey: `mock-api-key-${Date.now()}`
      };
    }
  }

  async testFlowConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/chatflows`);
      return response.ok;
    } catch (error) {
      console.error('Flowwise connection test failed:', error);
      return false;
    }
  }

  async getFlowwiseFlows(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/chatflows`);
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Flowwise flows:', error);
      return [];
    }
  }
}

export const flowwiseIntegration = new FlowwiseIntegrationService();