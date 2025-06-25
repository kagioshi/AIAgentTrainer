import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTenantSchema, insertAiAgentSchema, insertTrainingJobSchema, insertProviderSchema } from "@shared/schema";
import { providerService } from "./services/providerService";
import { aiTrainingService } from "./services/aiTrainingService";
import { flowwiseIntegration } from "./services/flowwiseIntegration";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default providers
  try {
    await providerService.initializeDefaultProviders();
  } catch (error) {
    console.error("Failed to initialize providers:", error);
  }

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Tenants
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      const validatedData = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(validatedData);
      res.status(201).json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create tenant" });
      }
    }
  });

  app.put("/api/tenants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const tenant = await storage.updateTenant(id, updates);
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  app.delete("/api/tenants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTenant(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Training Jobs
  app.get("/api/training-jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllTrainingJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching training jobs:", error);
      res.status(500).json({ message: "Failed to fetch training jobs" });
    }
  });

  app.post("/api/training-jobs", async (req, res) => {
    try {
      const validatedData = insertTrainingJobSchema.parse(req.body);
      const job = await storage.createTrainingJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating training job:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create training job" });
      }
    }
  });

  app.put("/api/training-jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const job = await storage.updateTrainingJob(id, updates);
      res.json(job);
    } catch (error) {
      console.error("Error updating training job:", error);
      res.status(500).json({ message: "Failed to update training job" });
    }
  });

  // Providers
  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getAllProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const validatedData = insertProviderSchema.parse(req.body);
      const provider = await storage.createProvider(validatedData);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create provider" });
      }
    }
  });

  // Calls
  app.get("/api/calls/active", async (req, res) => {
    try {
      const calls = await storage.getAllActiveCalls();
      res.json(calls);
    } catch (error) {
      console.error("Error fetching active calls:", error);
      res.status(500).json({ message: "Failed to fetch active calls" });
    }
  });

  // Activity Log
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });

  // AI Agents
  app.get("/api/agents", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      if (tenantId) {
        const agents = await storage.getAgentsByTenant(tenantId);
        res.json(agents);
      } else {
        res.status(400).json({ message: "Tenant ID is required" });
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const validatedData = insertAiAgentSchema.parse(req.body);
      const agent = await storage.createAiAgent(validatedData);
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create agent" });
      }
    }
  });

  // System health check
  app.get("/api/health", async (req, res) => {
    try {
      const stats = await storage.getLatestSystemStats();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        systemHealth: stats?.systemHealth || 99.8,
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      });
    }
  });

  // Enhanced Training Routes
  app.post("/api/training/upload", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { tenantId } = req.body;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      const document = await aiTrainingService.uploadAndProcessDocument(tenantId, {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.post("/api/training/start", async (req, res) => {
    try {
      const { tenantId, agentId, trainingType, documentIds, trainingParameters, targetModel } = req.body;
      
      const trainingJob = await aiTrainingService.createTrainingJob(tenantId, agentId, {
        trainingType,
        documentIds,
        trainingParameters,
        targetModel
      });

      res.json(trainingJob);
    } catch (error) {
      console.error("Error starting training:", error);
      res.status(500).json({ message: "Failed to start training" });
    }
  });

  app.get("/api/training/:jobId/progress", async (req, res) => {
    try {
      const progress = await aiTrainingService.getTrainingProgress(req.params.jobId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching training progress:", error);
      res.status(500).json({ message: "Failed to fetch training progress" });
    }
  });

  app.get("/api/training/documents/:tenantId", async (req, res) => {
    try {
      const documents = await storage.getTrainingDocumentsByTenant(req.params.tenantId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching training documents:", error);
      res.status(500).json({ message: "Failed to fetch training documents" });
    }
  });

  // Provider Configuration Routes
  app.get("/api/providers/types/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const providers = await providerService.getActiveProvidersByType(type as any);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.post("/api/providers/:providerId/configure", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { tenantId, config } = req.body;
      
      await providerService.configureProvider(providerId, tenantId, config);
      res.json({ message: "Provider configured successfully" });
    } catch (error) {
      console.error("Error configuring provider:", error);
      res.status(500).json({ message: "Failed to configure provider" });
    }
  });

  app.post("/api/providers/:providerId/test", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { tenantId } = req.body;
      
      const isConnected = await providerService.testProviderConnection(providerId, tenantId);
      res.json({ connected: isConnected });
    } catch (error) {
      console.error("Error testing provider:", error);
      res.status(500).json({ message: "Failed to test provider connection" });
    }
  });

  // Conversation Flow Routes
  app.get("/api/conversation-flows/:tenantId", async (req, res) => {
    try {
      const flows = await storage.getFlowsByTenant(req.params.tenantId);
      res.json(flows);
    } catch (error) {
      console.error("Error fetching flows:", error);
      res.status(500).json({ message: "Failed to fetch conversation flows" });
    }
  });

  app.post("/api/conversation-flows", async (req, res) => {
    try {
      const { tenantId, agentId, name, description, nodes, edges, flowType } = req.body;
      
      if (flowType === "rag") {
        const flow = await flowwiseIntegration.createRAGFlow(tenantId, agentId, {
          name,
          model: req.body.model || "gpt-4",
          documents: req.body.documents || []
        });
        res.json(flow);
      } else {
        const flow = await flowwiseIntegration.createChatFlow(tenantId, agentId, {
          name,
          description,
          nodes,
          edges
        });
        res.json(flow);
      }
    } catch (error) {
      console.error("Error creating flow:", error);
      res.status(500).json({ message: "Failed to create conversation flow" });
    }
  });

  app.post("/api/conversation-flows/:flowId/deploy", async (req, res) => {
    try {
      const deployment = await flowwiseIntegration.deployFlow(req.params.flowId);
      res.json(deployment);
    } catch (error) {
      console.error("Error deploying flow:", error);
      res.status(500).json({ message: "Failed to deploy flow" });
    }
  });

  // Agent Personas Routes
  app.get("/api/personas/:tenantId", async (req, res) => {
    try {
      const personas = await storage.getPersonasByTenant(req.params.tenantId);
      res.json(personas);
    } catch (error) {
      console.error("Error fetching personas:", error);
      res.status(500).json({ message: "Failed to fetch agent personas" });
    }
  });

  app.post("/api/personas", async (req, res) => {
    try {
      const persona = await storage.createAgentPersona(req.body);
      res.json(persona);
    } catch (error) {
      console.error("Error creating persona:", error);
      res.status(500).json({ message: "Failed to create agent persona" });
    }
  });

  // Voice Clones Routes
  app.get("/api/voice-clones/:tenantId", async (req, res) => {
    try {
      const clones = await storage.getVoiceClonesByTenant(req.params.tenantId);
      res.json(clones);
    } catch (error) {
      console.error("Error fetching voice clones:", error);
      res.status(500).json({ message: "Failed to fetch voice clones" });
    }
  });

  app.post("/api/voice-clones", async (req, res) => {
    try {
      const clone = await storage.createVoiceClone(req.body);
      res.json(clone);
    } catch (error) {
      console.error("Error creating voice clone:", error);
      res.status(500).json({ message: "Failed to create voice clone" });
    }
  });

  // ML Models Routes
  app.get("/api/ml-models/:tenantId", async (req, res) => {
    try {
      const models = await storage.getMLModelsByTenant(req.params.tenantId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching ML models:", error);
      res.status(500).json({ message: "Failed to fetch ML models" });
    }
  });

  // Call Recordings Routes
  app.get("/api/call-recordings/:tenantId", async (req, res) => {
    try {
      const recordings = await storage.getCallRecordingsByTenant(req.params.tenantId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching call recordings:", error);
      res.status(500).json({ message: "Failed to fetch call recordings" });
    }
  });

  // Agents by tenant
  app.get("/api/agents/:tenantId", async (req, res) => {
    try {
      const agents = await storage.getAgentsByTenant(req.params.tenantId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
