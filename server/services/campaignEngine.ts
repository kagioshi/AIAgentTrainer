import { storage } from "../storage";
import { voipOrchestrator } from "./voipOrchestrator";
import { InsertCampaign, InsertCampaignLead, Campaign, CampaignLead } from "@shared/schema";

interface CampaignSettings {
  maxConcurrentCalls: number;
  retryAttempts: number;
  retryDelay: number; // minutes
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
    timezone: string;
    daysOfWeek: number[]; // 0-6, Sunday is 0
  };
  voipProvider: string;
  agentPersona?: string;
  customMessage?: string;
}

interface CampaignProgress {
  id: string;
  name: string;
  status: string;
  totalLeads: number;
  completedLeads: number;
  successfulCalls: number;
  failedCalls: number;
  progress: number;
  estimatedCompletion?: Date;
}

export class CampaignExecutionEngine {
  private runningCampaigns: Set<string> = new Set();
  private campaignIntervals: Map<string, NodeJS.Timeout> = new Map();

  async createCampaign(campaignData: {
    tenantId: string;
    agentId: string;
    name: string;
    description?: string;
    leads: Array<{
      firstName?: string;
      lastName?: string;
      phoneNumber: string;
      email?: string;
      company?: string;
      customFields?: any;
    }>;
    settings: CampaignSettings;
    scheduledAt?: Date;
  }): Promise<Campaign> {
    // Create campaign
    const campaign = await storage.createCampaign({
      tenantId: campaignData.tenantId,
      agentId: campaignData.agentId,
      name: campaignData.name,
      description: campaignData.description,
      totalLeads: campaignData.leads.length,
      scheduledAt: campaignData.scheduledAt,
      settings: campaignData.settings
    });

    // Create campaign leads
    for (const leadData of campaignData.leads) {
      await storage.createCampaignLead({
        campaignId: campaign.id,
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        phoneNumber: leadData.phoneNumber,
        email: leadData.email,
        company: leadData.company,
        customFields: leadData.customFields
      });
    }

    // Auto-start if scheduled for now or past
    if (!campaignData.scheduledAt || campaignData.scheduledAt <= new Date()) {
      await this.startCampaign(campaign.id);
    } else {
      // Schedule for later
      this.scheduleCampaign(campaign.id, campaignData.scheduledAt);
    }

    return campaign;
  }

  async startCampaign(campaignId: string): Promise<void> {
    if (this.runningCampaigns.has(campaignId)) {
      throw new Error('Campaign is already running');
    }

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign cannot be started in current status');
    }

    // Update campaign status
    await storage.updateCampaign(campaignId, {
      status: 'running',
      startedAt: new Date()
    });

    this.runningCampaigns.add(campaignId);

    // Start processing leads
    this.processCampaignLeads(campaignId);

    // Log activity
    await storage.logActivity({
      tenantId: campaign.tenantId,
      type: 'campaign_started',
      description: `Campaign "${campaign.name}" started`,
      metadata: { campaignId }
    });
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    await storage.updateCampaign(campaignId, {
      status: 'paused'
    });

    this.runningCampaigns.delete(campaignId);
    
    const interval = this.campaignIntervals.get(campaignId);
    if (interval) {
      clearInterval(interval);
      this.campaignIntervals.delete(campaignId);
    }

    await storage.logActivity({
      tenantId: campaign.tenantId,
      type: 'campaign_paused',
      description: `Campaign "${campaign.name}" paused`,
      metadata: { campaignId }
    });
  }

  async completeCampaign(campaignId: string): Promise<void> {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    await storage.updateCampaign(campaignId, {
      status: 'completed',
      completedAt: new Date()
    });

    this.runningCampaigns.delete(campaignId);
    
    const interval = this.campaignIntervals.get(campaignId);
    if (interval) {
      clearInterval(interval);
      this.campaignIntervals.delete(campaignId);
    }

    await storage.logActivity({
      tenantId: campaign.tenantId,
      type: 'campaign_completed',
      description: `Campaign "${campaign.name}" completed`,
      metadata: { campaignId }
    });
  }

  private scheduleCampaign(campaignId: string, scheduledAt: Date): void {
    const delay = scheduledAt.getTime() - Date.now();
    
    setTimeout(async () => {
      try {
        await this.startCampaign(campaignId);
      } catch (error) {
        console.error(`Failed to start scheduled campaign ${campaignId}:`, error);
      }
    }, delay);
  }

  private async processCampaignLeads(campaignId: string): Promise<void> {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || !campaign.settings) return;

    const settings = campaign.settings as CampaignSettings;
    
    // Process leads in batches with concurrency control
    const interval = setInterval(async () => {
      try {
        if (!this.runningCampaigns.has(campaignId)) {
          clearInterval(interval);
          this.campaignIntervals.delete(campaignId);
          return;
        }

        // Check if within working hours
        if (!this.isWithinWorkingHours(settings.workingHours)) {
          return;
        }

        // Get pending leads
        const pendingLeads = await storage.getCampaignLeadsByStatus(campaignId, 'pending');
        const activeCalls = await storage.getActiveCampaignCalls(campaignId);

        // Process leads up to concurrent limit
        const availableSlots = settings.maxConcurrentCalls - activeCalls.length;
        const leadsToProcess = pendingLeads.slice(0, availableSlots);

        for (const lead of leadsToProcess) {
          await this.processLead(campaign, lead, settings);
        }

        // Check if campaign is complete
        const allLeads = await storage.getCampaignLeads(campaignId);
        const completedLeads = allLeads.filter(lead => 
          lead.status === 'contacted' || lead.status === 'failed'
        );

        if (completedLeads.length === allLeads.length) {
          await this.completeCampaign(campaignId);
        } else {
          // Update progress
          await storage.updateCampaign(campaignId, {
            completedLeads: completedLeads.length,
            successfulCalls: allLeads.filter(lead => lead.status === 'contacted').length
          });
        }

      } catch (error) {
        console.error(`Error processing campaign ${campaignId}:`, error);
      }
    }, 30000); // Check every 30 seconds

    this.campaignIntervals.set(campaignId, interval);
  }

  private async processLead(campaign: Campaign, lead: CampaignLead, settings: CampaignSettings): Promise<void> {
    try {
      // Check retry logic
      if (lead.callAttempts >= settings.retryAttempts) {
        await storage.updateCampaignLead(lead.id, {
          status: 'failed',
          notes: 'Maximum retry attempts reached'
        });
        return;
      }

      // Check retry delay
      if (lead.lastCallAt) {
        const timeSinceLastCall = Date.now() - new Date(lead.lastCallAt).getTime();
        const retryDelayMs = settings.retryDelay * 60 * 1000;
        
        if (timeSinceLastCall < retryDelayMs) {
          return; // Not ready for retry yet
        }
      }

      // Make the call
      const callId = await voipOrchestrator.makeCall(
        settings.voipProvider,
        lead.phoneNumber,
        campaign.agentId,
        campaign.tenantId,
        {
          leadId: lead.id,
          campaignId: campaign.id,
          persona: settings.agentPersona,
          customMessage: settings.customMessage
        }
      );

      // Update lead status
      await storage.updateCampaignLead(lead.id, {
        callAttempts: lead.callAttempts + 1,
        lastCallAt: new Date()
      });

      console.log(`Initiated call for lead ${lead.id} in campaign ${campaign.id}`);

    } catch (error) {
      console.error(`Failed to process lead ${lead.id}:`, error);
      
      await storage.updateCampaignLead(lead.id, {
        status: 'failed',
        callAttempts: lead.callAttempts + 1,
        notes: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private isWithinWorkingHours(workingHours: CampaignSettings['workingHours']): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Check if today is a working day
    if (!workingHours.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }

    // Check if within working hours (simplified - assumes same timezone)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return currentTime >= startTime && currentTime <= endTime;
  }

  async getCampaignProgress(campaignId: string): Promise<CampaignProgress> {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const leads = await storage.getCampaignLeads(campaignId);
    const completedLeads = leads.filter(lead => 
      lead.status === 'contacted' || lead.status === 'failed'
    );
    const successfulCalls = leads.filter(lead => lead.status === 'contacted');

    const progress = campaign.totalLeads > 0 
      ? Math.round((completedLeads.length / campaign.totalLeads) * 100)
      : 0;

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalLeads: campaign.totalLeads,
      completedLeads: completedLeads.length,
      successfulCalls: successfulCalls.length,
      failedCalls: completedLeads.length - successfulCalls.length,
      progress
    };
  }

  async getAllCampaignProgress(tenantId: string): Promise<CampaignProgress[]> {
    const campaigns = await storage.getCampaignsByTenant(tenantId);
    const progressList: CampaignProgress[] = [];

    for (const campaign of campaigns) {
      const progress = await this.getCampaignProgress(campaign.id);
      progressList.push(progress);
    }

    return progressList;
  }

  // Process call webhook responses
  async handleCallWebhook(callId: string, status: string, data: any): Promise<void> {
    const call = await storage.getCall(callId);
    if (!call || !call.metadata?.leadId) return;

    const leadId = call.metadata.leadId as string;
    
    switch (status) {
      case 'answered':
        await storage.updateCampaignLead(leadId, {
          status: 'answered',
          callDuration: data.duration,
          callTranscript: data.transcript,
          callSentiment: data.sentiment
        });
        break;
        
      case 'busy':
      case 'no-answer':
        await storage.updateCampaignLead(leadId, {
          status: 'pending' // Will retry based on campaign settings
        });
        break;
        
      case 'completed':
        await storage.updateCampaignLead(leadId, {
          status: 'contacted',
          callDuration: data.duration,
          callTranscript: data.transcript,
          callSentiment: data.sentiment
        });
        break;
        
      case 'failed':
        await storage.updateCampaignLead(leadId, {
          status: 'failed',
          notes: data.error || 'Call failed'
        });
        break;
    }
  }
}

// Export singleton instance
export const campaignEngine = new CampaignExecutionEngine();