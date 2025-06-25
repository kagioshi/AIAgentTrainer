import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  numeric,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const tenantStatusEnum = pgEnum("tenant_status", ["active", "inactive", "suspended", "trial"]);
export const planTypeEnum = pgEnum("plan_type", ["starter", "professional", "enterprise", "custom"]);
export const agentStatusEnum = pgEnum("agent_status", ["active", "inactive", "training", "deployed"]);
export const callStatusEnum = pgEnum("call_status", ["queued", "active", "completed", "failed", "dropped"]);
export const trainingStatusEnum = pgEnum("training_status", ["queued", "processing", "completed", "failed"]);
export const providerTypeEnum = pgEnum("provider_type", ["voip", "ai", "storage", "stt", "tts"]);
export const providerStatusEnum = pgEnum("provider_status", ["active", "inactive", "error"]);
export const documentTypeEnum = pgEnum("document_type", ["pdf", "txt", "docx", "csv", "json"]);
export const flowNodeTypeEnum = pgEnum("flow_node_type", ["start", "message", "condition", "action", "end", "api_call", "webhook"]);
export const voiceProviderEnum = pgEnum("voice_provider", ["openai", "google", "azure", "elevenlabs"]);

// Root Admin Users
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 50 }).default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenants
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  status: tenantStatusEnum("status").default("trial"),
  planType: planTypeEnum("plan_type").default("starter"),
  maxAgents: integer("max_agents").default(5),
  currentAgents: integer("current_agents").default(0),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Agents
export const aiAgents = pgTable("ai_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: agentStatusEnum("status").default("inactive"),
  modelConfig: jsonb("model_config"),
  trainingData: jsonb("training_data"),
  version: varchar("version", { length: 50 }).default("1.0"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Jobs
export const trainingJobs = pgTable("training_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id),
  name: varchar("name", { length: 255 }).notNull(),
  status: trainingStatusEnum("status").default("queued"),
  documentsProcessed: integer("documents_processed").default(0),
  totalDocuments: integer("total_documents").default(0),
  progress: integer("progress").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calls
export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id),
  phoneNumber: varchar("phone_number", { length: 50 }),
  status: callStatusEnum("status").default("queued"),
  duration: integer("duration").default(0),
  transcript: text("transcript"),
  sentiment: numeric("sentiment", { precision: 3, scale: 2 }),
  recordingUrl: text("recording_url"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Providers
export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: providerTypeEnum("type").notNull(),
  status: providerStatusEnum("status").default("active"),
  config: jsonb("config"),
  activeConnections: integer("active_connections").default(0),
  lastHealthCheck: timestamp("last_health_check"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Stats
export const systemStats = pgTable("system_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  activeTenants: integer("active_tenants").default(0),
  totalAgents: integer("total_agents").default(0),
  activeCalls: integer("active_calls").default(0),
  systemHealth: numeric("system_health", { precision: 5, scale: 2 }).default("99.9"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Activity Log
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Documents
export const trainingDocuments = pgTable("training_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  trainingJobId: uuid("training_job_id").references(() => trainingJobs.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: documentTypeEnum("file_type").notNull(),
  fileSize: integer("file_size"),
  storageUrl: text("storage_url"),
  extractedText: text("extracted_text"),
  processingStatus: varchar("processing_status", { length: 50 }).default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Personas
export const agentPersonas = pgTable("agent_personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id),
  name: varchar("name", { length: 255 }).notNull(),
  personality: text("personality"),
  voiceSettings: jsonb("voice_settings"),
  responseStyle: varchar("response_style", { length: 100 }),
  knowledgeBase: jsonb("knowledge_base"),
  behaviorRules: jsonb("behavior_rules"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversation Flows
export const conversationFlows = pgTable("conversation_flows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  flowData: jsonb("flow_data"),
  isActive: boolean("is_active").default(true),
  version: varchar("version", { length: 50 }).default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Flow Nodes
export const flowNodes = pgTable("flow_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  flowId: uuid("flow_id").references(() => conversationFlows.id).notNull(),
  nodeType: flowNodeTypeEnum("node_type").notNull(),
  position: jsonb("position"),
  data: jsonb("data"),
  connections: jsonb("connections"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice Clones
export const voiceClones = pgTable("voice_clones", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id),
  name: varchar("name", { length: 255 }).notNull(),
  voiceProvider: voiceProviderEnum("voice_provider").notNull(),
  voiceId: varchar("voice_id", { length: 255 }),
  sampleAudioUrl: text("sample_audio_url"),
  voiceSettings: jsonb("voice_settings"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ML Models
export const mlModels = pgTable("ml_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id),
  name: varchar("name", { length: 255 }).notNull(),
  modelType: varchar("model_type", { length: 100 }).notNull(),
  modelProvider: varchar("model_provider", { length: 100 }),
  modelConfig: jsonb("model_config"),
  trainingDataset: jsonb("training_dataset"),
  fineTuningStatus: varchar("fine_tuning_status", { length: 50 }).default("not_started"),
  accuracy: numeric("accuracy", { precision: 5, scale: 4 }),
  deploymentUrl: text("deployment_url"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider Configurations
export const providerConfigs = pgTable("provider_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  providerId: uuid("provider_id").references(() => providers.id).notNull(),
  configKey: varchar("config_key", { length: 255 }).notNull(),
  configValue: text("config_value"),
  isEncrypted: boolean("is_encrypted").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Call Recordings
export const callRecordings = pgTable("call_recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id").references(() => calls.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  recordingUrl: text("recording_url"),
  storageProvider: varchar("storage_provider", { length: 100 }),
  fileSize: integer("file_size"),
  duration: integer("duration"),
  transcript: text("transcript"),
  isEncrypted: boolean("is_encrypted").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingJobSchema = createInsertSchema(trainingJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemStatsSchema = createInsertSchema(systemStats).omit({
  id: true,
  recordedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;

export type TrainingJob = typeof trainingJobs.$inferSelect;
export type InsertTrainingJob = z.infer<typeof insertTrainingJobSchema>;

export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;

export type SystemStats = typeof systemStats.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type TrainingDocument = typeof trainingDocuments.$inferSelect;
export type InsertTrainingDocument = typeof trainingDocuments.$inferInsert;

export type AgentPersona = typeof agentPersonas.$inferSelect;
export type InsertAgentPersona = typeof agentPersonas.$inferInsert;

export type ConversationFlow = typeof conversationFlows.$inferSelect;
export type InsertConversationFlow = typeof conversationFlows.$inferInsert;

export type FlowNode = typeof flowNodes.$inferSelect;
export type InsertFlowNode = typeof flowNodes.$inferInsert;

export type VoiceClone = typeof voiceClones.$inferSelect;
export type InsertVoiceClone = typeof voiceClones.$inferInsert;

export type MLModel = typeof mlModels.$inferSelect;
export type InsertMLModel = typeof mlModels.$inferInsert;

export type ProviderConfig = typeof providerConfigs.$inferSelect;
export type InsertProviderConfig = typeof providerConfigs.$inferInsert;

export type CallRecording = typeof callRecordings.$inferSelect;
export type InsertCallRecording = typeof callRecordings.$inferInsert;
