import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, 
  Mic, 
  Volume2, 
  Settings, 
  CheckCircle, 
  XCircle,
  Plus,
  TestTube
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: "voip" | "stt" | "tts";
  isActive: boolean;
  metadata?: {
    providerKey: string;
    requiredConfig: string[];
    features: string[];
  };
}

const PROVIDER_TYPES = {
  voip: {
    label: "VoIP Providers",
    icon: Phone,
    description: "Voice over IP communication providers"
  },
  stt: {
    label: "Speech-to-Text",
    icon: Mic,
    description: "Speech recognition and transcription services"
  },
  tts: {
    label: "Text-to-Speech",
    icon: Volume2,
    description: "Text-to-speech synthesis providers"
  }
};

export default function ProviderManagement() {
  const [selectedType, setSelectedType] = useState<"voip" | "stt" | "tts">("voip");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [config, setConfig] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["/api/tenants"]
  });

  // Fetch providers by type
  const { data: providers = [] } = useQuery({
    queryKey: ["/api/providers/types", selectedType]
  });

  // Configure provider mutation
  const configureProviderMutation = useMutation({
    mutationFn: async ({ providerId, tenantId, config }: {
      providerId: string;
      tenantId: string;
      config: Record<string, string>;
    }) => {
      return await apiRequest(`/api/providers/${providerId}/configure`, {
        method: "POST",
        body: { tenantId, config }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Provider configured successfully"
      });
      setConfig({});
      setSelectedProvider(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to configure provider",
        variant: "destructive"
      });
    }
  });

  // Test provider connection mutation
  const testProviderMutation = useMutation({
    mutationFn: async ({ providerId, tenantId }: {
      providerId: string;
      tenantId: string;
    }) => {
      return await apiRequest(`/api/providers/${providerId}/test`, {
        method: "POST",
        body: { tenantId }
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.connected ? "Success" : "Warning",
        description: data.connected ? "Provider connection successful" : "Provider connection failed",
        variant: data.connected ? "default" : "destructive"
      });
    }
  });

  const handleConfigureProvider = () => {
    if (!selectedProvider || !selectedTenant) {
      toast({
        title: "Error",
        description: "Please select a provider and tenant",
        variant: "destructive"
      });
      return;
    }

    const requiredConfig = selectedProvider.metadata?.requiredConfig || [];
    const missingConfig = requiredConfig.filter(key => !config[key]);
    
    if (missingConfig.length > 0) {
      toast({
        title: "Error",
        description: `Missing required configuration: ${missingConfig.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    configureProviderMutation.mutate({
      providerId: selectedProvider.id,
      tenantId: selectedTenant,
      config
    });
  };

  const handleTestConnection = () => {
    if (!selectedProvider || !selectedTenant) {
      toast({
        title: "Error",
        description: "Please select a provider and tenant",
        variant: "destructive"
      });
      return;
    }

    testProviderMutation.mutate({
      providerId: selectedProvider.id,
      tenantId: selectedTenant
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Management</h1>
          <p className="text-muted-foreground">
            Configure VoIP, STT, and TTS providers for your tenants
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Types</CardTitle>
              <CardDescription>
                Select provider category to manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  {Object.entries(PROVIDER_TYPES).map(([key, type]) => (
                    <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                      <type.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{type.label.split(' ')[0]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Providers</CardTitle>
              <CardDescription>
                {PROVIDER_TYPES[selectedType].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {providers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No providers available</p>
                </div>
              ) : (
                providers.map((provider: Provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProvider?.id === provider.id 
                        ? "border-primary bg-primary/10" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{provider.name}</h4>
                      {provider.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {provider.metadata?.features?.map((feature: string) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProvider ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Configure {selectedProvider.name}</CardTitle>
                  <CardDescription>
                    Set up provider configuration for tenant access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant">Target Tenant</Label>
                    <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Global Configuration</SelectItem>
                        {tenants.map((tenant: any) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProvider.metadata?.requiredConfig?.map((configKey: string) => (
                    <div key={configKey} className="space-y-2">
                      <Label htmlFor={configKey}>
                        {configKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={configKey}
                        type={configKey.toLowerCase().includes("password") || configKey.toLowerCase().includes("secret") || configKey.toLowerCase().includes("token") ? "password" : "text"}
                        value={config[configKey] || ""}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          [configKey]: e.target.value
                        }))}
                        placeholder={`Enter ${configKey.replace(/_/g, " ")}`}
                      />
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleConfigureProvider}
                      disabled={configureProviderMutation.isPending}
                      className="flex-1"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Provider
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testProviderMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Provider Details</CardTitle>
                  <CardDescription>
                    Technical specifications and capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Provider Type</h4>
                      <Badge variant="outline">{selectedProvider.type.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Status</h4>
                      <Badge variant={selectedProvider.isActive ? "default" : "secondary"}>
                        {selectedProvider.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedProvider.metadata?.features?.map((feature: string) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Required Configuration</h4>
                      <div className="space-y-1">
                        {selectedProvider.metadata?.requiredConfig?.map((config: string) => (
                          <div key={config} className="text-sm text-muted-foreground">
                            • {config.replace(/_/g, " ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a provider to configure</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}