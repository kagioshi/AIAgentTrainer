import { storage } from "../storage";
import { InsertTrainingDocument } from "@shared/schema";

// Vector embedding interface
interface VectorEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    tenantId: string;
    documentId?: string;
    agentId?: string;
    chunkIndex?: number;
    createdAt: Date;
  };
}

interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: any;
}

// Mock embedding generation (would use OpenAI/Google in production)
function generateEmbedding(text: string): number[] {
  // Simplified embedding generation for demo
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  words.forEach((word, idx) => {
    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    embedding[hash % 384] += 1 / words.length;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export class KnowledgeRetrievalService {
  // In-memory vector store (would use Pinecone/Zilliz in production)
  private vectorStore: Map<string, VectorEmbedding[]> = new Map();
  
  constructor() {
    console.log('Knowledge Retrieval Service initialized');
  }

  // Chunk text into smaller segments for better retrieval
  private chunkText(text: string, chunkSize: number = 512, overlap: number = 128): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  // Index a document for a tenant
  async indexDocument(
    tenantId: string,
    documentId: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    const chunks = this.chunkText(content);
    const embeddings: VectorEmbedding[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const embedding = generateEmbedding(chunks[i]);
      embeddings.push({
        id: `${documentId}_chunk_${i}`,
        content: chunks[i],
        embedding,
        metadata: {
          tenantId,
          documentId,
          chunkIndex: i,
          createdAt: new Date(),
          ...metadata
        }
      });
    }
    
    // Store embeddings by tenant
    const tenantEmbeddings = this.vectorStore.get(tenantId) || [];
    tenantEmbeddings.push(...embeddings);
    this.vectorStore.set(tenantId, tenantEmbeddings);
    
    console.log(`Indexed ${chunks.length} chunks for document ${documentId}`);
  }

  // Search for relevant context
  async search(
    tenantId: string,
    query: string,
    topK: number = 3,
    filters?: any
  ): Promise<SearchResult[]> {
    const queryEmbedding = generateEmbedding(query);
    const tenantEmbeddings = this.vectorStore.get(tenantId) || [];
    
    if (tenantEmbeddings.length === 0) {
      return [];
    }
    
    // Calculate similarities
    const results = tenantEmbeddings.map(embedding => ({
      ...embedding,
      score: cosineSimilarity(queryEmbedding, embedding.embedding)
    }));
    
    // Apply filters if provided
    let filtered = results;
    if (filters) {
      filtered = results.filter(result => {
        if (filters.agentId && result.metadata.agentId !== filters.agentId) {
          return false;
        }
        if (filters.documentId && result.metadata.documentId !== filters.documentId) {
          return false;
        }
        return true;
      });
    }
    
    // Sort by score and return top K
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ id, content, score, metadata }) => ({
        id,
        content,
        score,
        metadata
      }));
  }

  // Retrieve context for an agent query
  async retrieveContext(
    tenantId: string,
    agentId: string,
    query: string,
    contextWindow: number = 3
  ): Promise<string> {
    const results = await this.search(tenantId, query, contextWindow, { agentId });
    
    if (results.length === 0) {
      return '';
    }
    
    // Format context for agent consumption
    const context = results
      .map((result, idx) => `[Context ${idx + 1}]: ${result.content}`)
      .join('\n\n');
    
    return context;
  }

  // Index training documents
  async indexTrainingDocuments(tenantId: string): Promise<void> {
    const documents = await storage.getTrainingDocumentsByTenant(tenantId);
    
    for (const doc of documents) {
      if (doc.content) {
        await this.indexDocument(
          tenantId,
          doc.id,
          doc.content,
          {
            agentId: doc.agentId,
            documentType: doc.type,
            fileName: doc.fileName
          }
        );
      }
    }
    
    console.log(`Indexed ${documents.length} training documents for tenant ${tenantId}`);
  }

  // Index agent personas
  async indexAgentPersona(
    tenantId: string,
    agentId: string,
    persona: any
  ): Promise<void> {
    const personaContent = `
      Name: ${persona.name}
      Role: ${persona.role}
      Background: ${persona.background}
      Personality Traits: ${persona.personalityTraits?.join(', ')}
      Communication Style: ${persona.communicationStyle}
      Goals: ${persona.goals?.join(', ')}
      Knowledge Areas: ${persona.knowledgeAreas?.join(', ')}
    `;
    
    await this.indexDocument(
      tenantId,
      `persona_${persona.id}`,
      personaContent,
      {
        agentId,
        type: 'persona'
      }
    );
  }

  // Update knowledge base incrementally
  async updateKnowledgeBase(
    tenantId: string,
    documentId: string,
    newContent: string,
    metadata?: any
  ): Promise<void> {
    // Remove old embeddings for this document
    const tenantEmbeddings = this.vectorStore.get(tenantId) || [];
    const updatedEmbeddings = tenantEmbeddings.filter(
      embedding => embedding.metadata.documentId !== documentId
    );
    this.vectorStore.set(tenantId, updatedEmbeddings);
    
    // Index new content
    await this.indexDocument(tenantId, documentId, newContent, metadata);
  }

  // Get knowledge base statistics
  async getKnowledgeStats(tenantId: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    avgChunkSize: number;
    lastIndexed?: Date;
  }> {
    const tenantEmbeddings = this.vectorStore.get(tenantId) || [];
    
    if (tenantEmbeddings.length === 0) {
      return {
        totalDocuments: 0,
        totalChunks: 0,
        avgChunkSize: 0
      };
    }
    
    const uniqueDocuments = new Set(
      tenantEmbeddings.map(e => e.metadata.documentId)
    );
    
    const avgChunkSize = tenantEmbeddings.reduce(
      (sum, e) => sum + e.content.length, 0
    ) / tenantEmbeddings.length;
    
    const lastIndexed = tenantEmbeddings
      .map(e => e.metadata.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    
    return {
      totalDocuments: uniqueDocuments.size,
      totalChunks: tenantEmbeddings.length,
      avgChunkSize: Math.round(avgChunkSize),
      lastIndexed
    };
  }

  // Clear knowledge base for a tenant
  async clearKnowledgeBase(tenantId: string): Promise<void> {
    this.vectorStore.delete(tenantId);
    console.log(`Cleared knowledge base for tenant ${tenantId}`);
  }

  // Export knowledge base (for backup/migration)
  async exportKnowledgeBase(tenantId: string): Promise<VectorEmbedding[]> {
    return this.vectorStore.get(tenantId) || [];
  }

  // Import knowledge base
  async importKnowledgeBase(
    tenantId: string,
    embeddings: VectorEmbedding[]
  ): Promise<void> {
    this.vectorStore.set(tenantId, embeddings);
    console.log(`Imported ${embeddings.length} embeddings for tenant ${tenantId}`);
  }
}

// Singleton instance
export const knowledgeRetrieval = new KnowledgeRetrievalService();