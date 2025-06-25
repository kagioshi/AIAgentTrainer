import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Cpu, MessageCircle, ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingJob } from "@shared/schema";

interface TrainingPipelineProps {
  trainingJobs: TrainingJob[];
  isLoading: boolean;
}

export function TrainingPipeline({ trainingJobs, isLoading }: TrainingPipelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "status-indicator completed";
      case "processing":
        return "status-indicator processing";
      case "queued":
        return "status-indicator trial";
      case "failed":
        return "status-indicator failed";
      default:
        return "status-indicator inactive";
    }
  };

  const getIcon = (index: number) => {
    const icons = [Brain, Cpu, MessageCircle];
    const IconComponent = icons[index % icons.length];
    return IconComponent;
  };

  const getIconColor = (index: number) => {
    const colors = ["blue", "yellow", "purple"];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Training Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Training Pipeline</CardTitle>
        <p className="text-sm text-muted-foreground">Recent training jobs and model deployments</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trainingJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No training jobs found. Start training your first AI agent.
            </div>
          ) : (
            trainingJobs.slice(0, 3).map((job, index) => {
              const IconComponent = getIcon(index);
              const iconColor = getIconColor(index);
              
              return (
                <div key={job.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-${iconColor}-100 dark:bg-${iconColor}-900/20 rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 text-${iconColor}-600 dark:text-${iconColor}-400`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{job.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.documentsProcessed || 0} documents processed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={cn("text-xs", getStatusColor(job.status || "queued"))}>
                      {job.status === "processing" && (
                        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5 animate-pulse"></span>
                      )}
                      {job.status !== "processing" && (
                        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5"></span>
                      )}
                      {job.status}
                    </Badge>
                    {job.status === "processing" && (
                      <div className="w-16">
                        <Progress value={job.progress || 0} className="h-2" />
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      {job.status === "queued" ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </Button>
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
