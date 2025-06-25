import {
  adminUsers,
  tenants,
  aiAgents,
  trainingJobs,
  calls,
  providers,
  systemStats,
  activityLog,
  trainingDocuments,
  agentPersonas,
  conversationFlows,
  voiceClones,
  mlModels,
  providerConfigs,
  callRecordings,
  type AdminUser,
  type InsertAdminUser,
  type Tenant,
  type InsertTenant,
  type AiAgent,
  type InsertAiAgent,
  type TrainingJob,
  type InsertTrainingJob,
  type Call,
  type InsertCall,
  type Provider,
  type InsertProvider,
  type SystemStats,
  type InsertSystemStats,
  type ActivityLog,
  type InsertActivityLog,
  type TrainingDocument,
  type InsertTrainingDocument,
  type AgentPersona,
  type InsertAgentPersona,
  type ConversationFlow,
  type InsertConversationFlow,
  type VoiceClone,
  type InsertVoiceClone,
  type MLModel,
  type InsertMLModel,
  type ProviderConfig,
  type InsertProviderConfig,
  type CallRecording,
  type InsertCallRecording,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // Admin Users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;

  // Tenants
  getAllTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant>;
  deleteTenant(id: string): Promise<void>;

  // AI Agents
  getAgentsByTenant(tenantId: string): Promise<AiAgent[]>;
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(id: string, updates: Partial<InsertAiAgent>): Promise<AiAgent>;

  // Training Jobs
  getAllTrainingJobs(): Promise<TrainingJob[]>;
  getTrainingJobsByTenant(tenantId: string): Promise<TrainingJob[]>;
  createTrainingJob(job: InsertTrainingJob): Promise<TrainingJob>;
  updateTrainingJob(id: string, updates: Partial<InsertTrainingJob>): Promise<TrainingJob>;

  // Calls
  getAllActiveCalls(): Promise<Call[]>;
  getCallsByTenant(tenantId: string): Promise<Call[]>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: string, updates: Partial<InsertCall>): Promise<Call>;

  // Providers
  getAllProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: string, updates: Partial<InsertProvider>): Promise<Provider>;

  // System Stats
  getLatestSystemStats(): Promise<SystemStats | undefined>;
  createSystemStats(stats: InsertSystemStats): Promise<SystemStats>;

  // Activity Log
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;

  // Dashboard Analytics
  getDashboardStats(): Promise<{
    activeTenants: number;
    totalAgents: number;
    activeCalls: number;
    systemHealth: number;
  }>;

  // Enhanced Provider Operations
  getProviderByKey(key: string): Promise<Provider | undefined>;
  getProvidersByType(type: string, activeOnly?: boolean): Promise<Provider[]>;
  getProviderConfigs(providerId: string, tenantId?: string): Promise<ProviderConfig[]>;
  createProviderConfig(config: InsertProviderConfig): Promise<ProviderConfig>;

  // Training Documents
  getTrainingDocumentsByTenant(tenantId: string): Promise<TrainingDocument[]>;
  createTrainingDocument(document: InsertTrainingDocument): Promise<TrainingDocument>;
  updateTrainingDocument(id: string, updates: Partial<InsertTrainingDocument>): Promise<TrainingDocument>;

  // Agent Personas
  getPersonasByTenant(tenantId: string): Promise<AgentPersona[]>;
  createAgentPersona(persona: InsertAgentPersona): Promise<AgentPersona>;
  updateAgentPersona(id: string, updates: Partial<InsertAgentPersona>): Promise<AgentPersona>;

  // Conversation Flows
  getFlowsByTenant(tenantId: string): Promise<ConversationFlow[]>;
  createConversationFlow(flow: InsertConversationFlow): Promise<ConversationFlow>;
  updateConversationFlow(id: string, updates: Partial<InsertConversationFlow>): Promise<ConversationFlow>;

  // Voice Clones
  getVoiceClonesByTenant(tenantId: string): Promise<VoiceClone[]>;
  createVoiceClone(clone: InsertVoiceClone): Promise<VoiceClone>;
  updateVoiceClone(id: string, updates: Partial<InsertVoiceClone>): Promise<VoiceClone>;

  // ML Models
  getMLModelsByTenant(tenantId: string): Promise<MLModel[]>;
  createMLModel(model: InsertMLModel): Promise<MLModel>;
  updateMLModel(id: string, updates: Partial<InsertMLModel>): Promise<MLModel>;

  // Call Recordings
  getCallRecordingsByTenant(tenantId: string): Promise<CallRecording[]>;
  createCallRecording(recording: InsertCallRecording): Promise<CallRecording>;
}

export class DatabaseStorage implements IStorage {
  // Admin Users
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user;
  }

  async createAdminUser(userData: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(userData).returning();
    return user;
  }

  // Tenants
  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(tenantData).returning();
    
    // Log activity
    await this.logActivity({
      type: "tenant_created",
      title: "New tenant registered",
      description: `${tenant.name} signed up for ${tenant.planType} plan`,
      metadata: { tenantId: tenant.id, plan: tenant.planType }
    });
    
    return tenant;
  }

  async updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  // AI Agents
  async getAgentsByTenant(tenantId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.tenantId, tenantId));
  }

  async createAiAgent(agentData: InsertAiAgent): Promise<AiAgent> {
    const [agent] = await db.insert(aiAgents).values(agentData).returning();
    
    // Update tenant's current agents count
    await db
      .update(tenants)
      .set({ 
        currentAgents: sql`${tenants.currentAgents} + 1`,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, agentData.tenantId));
    
    return agent;
  }

  async updateAiAgent(id: string, updates: Partial<InsertAiAgent>): Promise<AiAgent> {
    const [agent] = await db
      .update(aiAgents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiAgents.id, id))
      .returning();
    return agent;
  }

  // Training Jobs
  async getAllTrainingJobs(): Promise<TrainingJob[]> {
    return await db.select().from(trainingJobs).orderBy(desc(trainingJobs.createdAt));
  }

  async getTrainingJobsByTenant(tenantId: string): Promise<TrainingJob[]> {
    return await db
      .select()
      .from(trainingJobs)
      .where(eq(trainingJobs.tenantId, tenantId))
      .orderBy(desc(trainingJobs.createdAt));
  }

  async createTrainingJob(jobData: InsertTrainingJob): Promise<TrainingJob> {
    const [job] = await db.insert(trainingJobs).values(jobData).returning();
    
    // Log activity
    await this.logActivity({
      tenantId: job.tenantId,
      type: "training_started",
      title: "AI training started",
      description: `Training job ${job.name} has been queued`,
      metadata: { jobId: job.id, agentId: job.agentId }
    });
    
    return job;
  }

  async updateTrainingJob(id: string, updates: Partial<InsertTrainingJob>): Promise<TrainingJob> {
    const [job] = await db
      .update(trainingJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingJobs.id, id))
      .returning();
    
    // Log completion
    if (updates.status === "completed") {
      await this.logActivity({
        tenantId: job.tenantId,
        type: "training_completed",
        title: "AI training completed",
        description: `Training job ${job.name} has been completed successfully`,
        metadata: { jobId: job.id, agentId: job.agentId }
      });
    }
    
    return job;
  }

  // Calls
  async getAllActiveCalls(): Promise<Call[]> {
    return await db
      .select()
      .from(calls)
      .where(sql`${calls.status} IN ('queued', 'active')`)
      .orderBy(desc(calls.createdAt));
  }

  async getCallsByTenant(tenantId: string): Promise<Call[]> {
    return await db
      .select()
      .from(calls)
      .where(eq(calls.tenantId, tenantId))
      .orderBy(desc(calls.createdAt));
  }

  async createCall(callData: InsertCall): Promise<Call> {
    const [call] = await db.insert(calls).values(callData).returning();
    return call;
  }

  async updateCall(id: string, updates: Partial<InsertCall>): Promise<Call> {
    const [call] = await db
      .update(calls)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calls.id, id))
      .returning();
    return call;
  }

  // Providers
  async getAllProviders(): Promise<Provider[]> {
    return await db.select().from(providers).orderBy(providers.name);
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  }

  async createProvider(providerData: InsertProvider): Promise<Provider> {
    const [provider] = await db.insert(providers).values(providerData).returning();
    return provider;
  }

  async updateProvider(id: string, updates: Partial<InsertProvider>): Promise<Provider> {
    const [provider] = await db
      .update(providers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(providers.id, id))
      .returning();
    return provider;
  }

  // System Stats
  async getLatestSystemStats(): Promise<SystemStats | undefined> {
    const [stats] = await db
      .select()
      .from(systemStats)
      .orderBy(desc(systemStats.recordedAt))
      .limit(1);
    return stats;
  }

  async createSystemStats(statsData: InsertSystemStats): Promise<SystemStats> {
    const [stats] = await db.insert(systemStats).values(statsData).returning();
    return stats;
  }

  // Activity Log
  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async logActivity(activityData: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLog).values(activityData).returning();
    return activity;
  }

  // Dashboard Analytics
  async getDashboardStats(): Promise<{
    activeTenants: number;
    totalAgents: number;
    activeCalls: number;
    systemHealth: number;
  }> {
    const [tenantsResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.status, "active"));

    const [agentsResult] = await db
      .select({ count: count() })
      .from(aiAgents)
      .where(eq(aiAgents.status, "deployed"));

    const [callsResult] = await db
      .select({ count: count() })
      .from(calls)
      .where(sql`${calls.status} IN ('queued', 'active')`);

    const latestStats = await this.getLatestSystemStats();

    return {
      activeTenants: tenantsResult.count,
      totalAgents: agentsResult.count,
      activeCalls: callsResult.count,
      systemHealth: latestStats?.systemHealth ? Number(latestStats.systemHealth) : 99.8,
    };
  }

  // Enhanced Provider Operations
  async getProviderByKey(key: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers)
      .where(sql`${providers.metadata}->>'providerKey' = ${key}`);
    return provider;
  }

  async getProvidersByType(type: string, activeOnly: boolean = false): Promise<Provider[]> {
    let query = db.select().from(providers).where(eq(providers.type, type as any));
    if (activeOnly) {
      query = query.where(eq(providers.isActive, true));
    }
    return await query;
  }

  async getProviderConfigs(providerId: string, tenantId?: string): Promise<ProviderConfig[]> {
    let query = db.select().from(providerConfigs)
      .where(eq(providerConfigs.providerId, providerId));
    
    if (tenantId) {
      query = query.where(eq(providerConfigs.tenantId, tenantId));
    }
    
    return await query;
  }

  async createProviderConfig(configData: InsertProviderConfig): Promise<ProviderConfig> {
    const [config] = await db.insert(providerConfigs).values(configData).returning();
    return config;
  }

  // Training Documents
  async getTrainingDocumentsByTenant(tenantId: string): Promise<TrainingDocument[]> {
    return await db.select().from(trainingDocuments)
      .where(eq(trainingDocuments.tenantId, tenantId));
  }

  async createTrainingDocument(documentData: InsertTrainingDocument): Promise<TrainingDocument> {
    const [document] = await db.insert(trainingDocuments).values(documentData).returning();
    return document;
  }

  async updateTrainingDocument(id: string, updates: Partial<InsertTrainingDocument>): Promise<TrainingDocument> {
    const [document] = await db.update(trainingDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingDocuments.id, id))
      .returning();
    return document;
  }

  async getTrainingDocument(id: string): Promise<TrainingDocument | undefined> {
    const [document] = await db.select().from(trainingDocuments)
      .where(eq(trainingDocuments.id, id));
    return document;
  }

  async getTrainingJob(id: string): Promise<TrainingJob | undefined> {
    const [job] = await db.select().from(trainingJobs)
      .where(eq(trainingJobs.id, id));
    return job;
  }

  // Agent Personas
  async getPersonasByTenant(tenantId: string): Promise<AgentPersona[]> {
    return await db.select().from(agentPersonas)
      .where(eq(agentPersonas.tenantId, tenantId));
  }

  async createAgentPersona(personaData: InsertAgentPersona): Promise<AgentPersona> {
    const [persona] = await db.insert(agentPersonas).values(personaData).returning();
    return persona;
  }

  async updateAgentPersona(id: string, updates: Partial<InsertAgentPersona>): Promise<AgentPersona> {
    const [persona] = await db.update(agentPersonas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentPersonas.id, id))
      .returning();
    return persona;
  }

  // Conversation Flows
  async getFlowsByTenant(tenantId: string): Promise<ConversationFlow[]> {
    return await db.select().from(conversationFlows)
      .where(eq(conversationFlows.tenantId, tenantId));
  }

  async createConversationFlow(flowData: InsertConversationFlow): Promise<ConversationFlow> {
    const [flow] = await db.insert(conversationFlows).values(flowData).returning();
    return flow;
  }

  async updateConversationFlow(id: string, updates: Partial<InsertConversationFlow>): Promise<ConversationFlow> {
    const [flow] = await db.update(conversationFlows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversationFlows.id, id))
      .returning();
    return flow;
  }

  async getConversationFlow(id: string): Promise<ConversationFlow | undefined> {
    const [flow] = await db.select().from(conversationFlows)
      .where(eq(conversationFlows.id, id));
    return flow;
  }

  // Voice Clones
  async getVoiceClonesByTenant(tenantId: string): Promise<VoiceClone[]> {
    return await db.select().from(voiceClones)
      .where(eq(voiceClones.tenantId, tenantId));
  }

  async createVoiceClone(cloneData: InsertVoiceClone): Promise<VoiceClone> {
    const [clone] = await db.insert(voiceClones).values(cloneData).returning();
    return clone;
  }

  async updateVoiceClone(id: string, updates: Partial<InsertVoiceClone>): Promise<VoiceClone> {
    const [clone] = await db.update(voiceClones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(voiceClones.id, id))
      .returning();
    return clone;
  }

  // ML Models
  async getMLModelsByTenant(tenantId: string): Promise<MLModel[]> {
    return await db.select().from(mlModels)
      .where(eq(mlModels.tenantId, tenantId));
  }

  async createMLModel(modelData: InsertMLModel): Promise<MLModel> {
    const [model] = await db.insert(mlModels).values(modelData).returning();
    return model;
  }

  async updateMLModel(id: string, updates: Partial<InsertMLModel>): Promise<MLModel> {
    const [model] = await db.update(mlModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mlModels.id, id))
      .returning();
    return model;
  }

  // Call Recordings
  async getCallRecordingsByTenant(tenantId: string): Promise<CallRecording[]> {
    return await db.select().from(callRecordings)
      .where(eq(callRecordings.tenantId, tenantId));
  }

  async createCallRecording(recordingData: InsertCallRecording): Promise<CallRecording> {
    const [recording] = await db.insert(callRecordings).values(recordingData).returning();
    return recording;
  }
}

export const storage = new DatabaseStorage();
