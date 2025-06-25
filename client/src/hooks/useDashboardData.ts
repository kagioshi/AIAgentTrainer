import { useQuery } from "@tanstack/react-query";
import type { Tenant, TrainingJob, Provider, ActivityLog } from "@shared/schema";

export interface DashboardStats {
  activeTenants: number;
  totalAgents: number;
  activeCalls: number;
  systemHealth: number;
}

export const useDashboardData = () => {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: trainingJobs, isLoading: trainingLoading } = useQuery<TrainingJob[]>({
    queryKey: ["/api/training-jobs"],
    refetchInterval: 30000,
  });

  const { data: providers, isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
    refetchInterval: 60000,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  return {
    stats,
    tenants: tenants || [],
    trainingJobs: trainingJobs || [],
    providers: providers || [],
    activities: activities || [],
    isLoading: statsLoading || tenantsLoading || trainingLoading || providersLoading || activitiesLoading,
  };
};
