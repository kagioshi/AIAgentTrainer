import { MainLayout } from "@/components/layout/main-layout";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { TenantTable } from "@/components/dashboard/tenant-table";
import { TrainingPipeline } from "@/components/dashboard/training-pipeline";
import { SystemStatus } from "@/components/dashboard/system-status";
import { ProviderStatus } from "@/components/dashboard/provider-status";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const { stats, tenants, trainingJobs, providers, activities, isLoading } = useDashboardData();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <StatsGrid stats={stats!} isLoading={isLoading} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <TenantTable tenants={tenants} isLoading={isLoading} />
            <TrainingPipeline trainingJobs={trainingJobs} isLoading={isLoading} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <SystemStatus />
            <ProviderStatus providers={providers} isLoading={isLoading} />
            <RecentActivity activities={activities} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl">
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </MainLayout>
  );
}
