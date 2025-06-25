import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mic, Brain, Cloud } from "lucide-react";
import type { Provider } from "@shared/schema";

interface ProviderStatusProps {
  providers: Provider[];
  isLoading: boolean;
}

export function ProviderStatus({ providers, isLoading }: ProviderStatusProps) {
  const getProviderIcon = (type: string) => {
    switch (type) {
      case "voip":
        return Phone;
      case "ai":
        return Brain;
      case "storage":
        return Cloud;
      default:
        return Mic;
    }
  };

  const getProviderColor = (type: string) => {
    switch (type) {
      case "voip":
        return "blue";
      case "ai":
        return "purple";
      case "storage":
        return "green";
      default:
        return "gray";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default providers if none exist
  const defaultProviders = [
    { id: "1", name: "Twilio", type: "voip", status: "active", activeConnections: 47 },
    { id: "2", name: "OpenAI Whisper", type: "ai", status: "active", activeConnections: 12 },
    { id: "3", name: "Google Gemini", type: "ai", status: "active", activeConnections: 23 },
    { id: "4", name: "Google Drive", type: "storage", status: "active", activeConnections: 156 },
  ];

  const displayProviders = providers.length > 0 ? providers : defaultProviders;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayProviders.map((provider) => {
          const IconComponent = getProviderIcon(provider.type);
          const color = getProviderColor(provider.type);
          
          return (
            <div key={provider.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {provider.activeConnections} active connections
                  </p>
                </div>
              </div>
              <span className="health-dot healthy"></span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
