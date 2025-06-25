export interface SystemStatus {
  component: string;
  status: "operational" | "degraded" | "error";
  description: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  type: "voip" | "ai" | "storage";
  status: "active" | "inactive" | "error";
  activeConnections: number;
  icon: string;
}

export interface DashboardData {
  stats: {
    activeTenants: number;
    totalAgents: number;
    activeCalls: number;
    systemHealth: number;
  };
  tenants: Array<{
    id: string;
    name: string;
    email: string;
    planType: string;
    status: string;
    currentAgents: number;
    maxAgents: number;
  }>;
  trainingJobs: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    documentsProcessed: number;
  }>;
  systemStatus: SystemStatus[];
  providerStatus: ProviderStatus[];
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}
