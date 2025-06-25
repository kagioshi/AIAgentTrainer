import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, CheckCircle, AlertTriangle, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityLog } from "@shared/schema";

interface RecentActivityProps {
  activities: ActivityLog[];
  isLoading: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "tenant_created":
        return UserPlus;
      case "training_completed":
        return CheckCircle;
      case "provider_issue":
        return AlertTriangle;
      case "document_upload":
        return Upload;
      default:
        return CheckCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "tenant_created":
        return "blue";
      case "training_completed":
        return "green";
      case "provider_issue":
        return "yellow";
      case "document_upload":
        return "purple";
      default:
        return "gray";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity found.
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              const color = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 bg-${color}-100 dark:bg-${color}-900/20 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
