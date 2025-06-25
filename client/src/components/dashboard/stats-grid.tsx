import { Card, CardContent } from "@/components/ui/card";
import { Building, Bot, Phone, Activity, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/hooks/useDashboardData";

interface StatsGridProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Active Tenants",
      value: stats?.activeTenants || 0,
      change: "+12% from last month",
      icon: Building,
      color: "blue",
    },
    {
      title: "AI Agents Deployed",
      value: stats?.totalAgents || 0,
      change: "+8% from last week",
      icon: Bot,
      color: "green",
    },
    {
      title: "Active Calls",
      value: stats?.activeCalls || 0,
      change: "Real-time",
      icon: Phone,
      color: "yellow",
    },
    {
      title: "System Health",
      value: `${stats?.systemHealth || 99.8}%`,
      change: "All systems operational",
      icon: Activity,
      color: "green",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card key={item.title} className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                  <p className="text-3xl font-bold text-foreground">{item.value}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {item.change}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-${item.color}-100 dark:bg-${item.color}-900/20 rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 text-${item.color}-600 dark:text-${item.color}-400`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
