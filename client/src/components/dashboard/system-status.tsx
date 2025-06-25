import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const systemComponents = [
  { name: "API Gateway", status: "operational" },
  { name: "AI Processing", status: "operational" },
  { name: "VoIP Services", status: "degraded" },
  { name: "Database", status: "operational" },
  { name: "Storage", status: "operational" },
];

export function SystemStatus() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "health-dot healthy";
      case "degraded":
        return "health-dot degraded";
      case "error":
        return "health-dot error";
      default:
        return "health-dot error";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {systemComponents.map((component) => (
          <div key={component.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={getStatusColor(component.status)}></div>
              <span className="text-sm text-foreground">{component.name}</span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{component.status}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
