import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  Play, 
  Save, 
  Plus,
  Workflow,
  Database,
  Mic,
  Phone,
  Zap
} from "lucide-react";

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    parameters?: Record<string, any>;
  };
}

interface ConversationFlow {
  id: string;
  name: string;
  description?: string;
  flowData: any;
  isActive: boolean;
  version: string;
  createdAt: string;
}

const NODE_TYPES = {
  llm: { label: "LLM Chain", icon: Bot, color: "bg-blue-500" },
  vector: { label: "Vector Store", icon: Database, color: "bg-green-500" },
  retriever: { label: "Retriever", icon: MessageSquare, color: "bg-purple-500" },
  agent: { label: "Agent", icon: Workflow, color: "bg-orange-500" },
  voice: { label: "Voice", icon: Mic, color: "bg-pink-500" },
  phone: { label: "Phone", icon: Phone, color: "bg-indigo-500" },
  webhook: { label: "Webhook", icon: Zap, color: "bg-yellow-500" }
};

export default function FlowBuilder() {
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [flowName, setFlowName] = useState("");
  const [flowDescription, setFlowDescription] = useState("");
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [selectedNodeType, setSelectedNodeType] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["/api/tenants"]
  });

  // Fetch agents for selected tenant
  const { data: agents = [] } = useQuery({
    queryKey: ["/api/agents", selectedTenant],
    enabled: !!selectedTenant
  });

  // Fetch existing flows
  const { data: flows = [] } = useQuery({
    queryKey: ["/api/conversation-flows", selectedTenant],
    enabled: !!selectedTenant
  });

  // Create flow mutation
  const createFlowMutation = useMutation({
    mutationFn: async (flowData: any) => {
      return await apiRequest("/api/conversation-flows", {
        method: "POST",
        body: flowData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Conversation flow created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversation-flows"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create conversation flow",
        variant: "destructive"
      });
    }
  });

  // Deploy flow mutation
  const deployFlowMutation = useMutation({
    mutationFn: async (flowId: string) => {
      return await apiRequest(`/api/conversation-flows/${flowId}/deploy`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Flow deployed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversation-flows"] });
    }
  });

  const addNode = useCallback(() => {
    if (!selectedNodeType) return;

    const nodeType = NODE_TYPES[selectedNodeType as keyof typeof NODE_TYPES];
    const newNode: FlowNode = {
      id: `${selectedNodeType}-${Date.now()}`,
      type: selectedNodeType,
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 200 + 100 
      },
      data: {
        label: nodeType.label,
        parameters: {}
      }
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeType("");
  }, [selectedNodeType]);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
  }, []);

  const createFlow = useCallback(() => {
    if (!selectedTenant || !selectedAgent || !flowName || nodes.length === 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields and add at least one node",
        variant: "destructive"
      });
      return;
    }

    createFlowMutation.mutate({
      tenantId: selectedTenant,
      agentId: selectedAgent,
      name: flowName,
      description: flowDescription,
      nodes,
      edges: [] // Simplified for demo
    });
  }, [selectedTenant, selectedAgent, flowName, flowDescription, nodes]);

  const createRAGFlow = useCallback(() => {
    if (!selectedTenant || !selectedAgent || !flowName) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    createFlowMutation.mutate({
      tenantId: selectedTenant,
      agentId: selectedAgent,
      name: flowName,
      description: flowDescription,
      flowType: "rag",
      model: "gpt-4",
      documents: []
    });
  }, [selectedTenant, selectedAgent, flowName, flowDescription]);

  const resetForm = () => {
    setFlowName("");
    setFlowDescription("");
    setNodes([]);
    setSelectedNodeType("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flow Builder</h1>
          <p className="text-muted-foreground">
            Create and manage conversational AI flows with Flowwise integration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flow Configuration</CardTitle>
              <CardDescription>
                Set up your conversation flow parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant: any) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent">AI Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={!selectedTenant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Flow Name</Label>
                <Input
                  id="name"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Enter flow name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={flowDescription}
                  onChange={(e) => setFlowDescription(e.target.value)}
                  placeholder="Enter flow description"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={createFlow} 
                  disabled={createFlowMutation.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Flow
                </Button>
                <Button 
                  onClick={createRAGFlow} 
                  variant="outline"
                  disabled={createFlowMutation.isPending}
                  className="flex-1"
                >
                  <Database className="w-4 h-4 mr-2" />
                  RAG Flow
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Node Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Node Palette</CardTitle>
              <CardDescription>
                Drag and drop nodes to build your flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add Node</Label>
                <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select node type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NODE_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={addNode} disabled={!selectedNodeType} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Node
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Flow Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flow Canvas</CardTitle>
              <CardDescription>
                Visual representation of your conversation flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 relative">
                {nodes.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Add nodes to start building your flow</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {nodes.map((node) => {
                      const NodeIcon = NODE_TYPES[node.type as keyof typeof NODE_TYPES]?.icon || Bot;
                      const nodeColor = NODE_TYPES[node.type as keyof typeof NODE_TYPES]?.color || "bg-gray-500";
                      
                      return (
                        <div
                          key={node.id}
                          className="bg-white dark:bg-gray-800 rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${nodeColor} flex items-center justify-center`}>
                                <NodeIcon className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium">{node.data.label}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeNode(node.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {node.type}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Existing Flows */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Flows</CardTitle>
              <CardDescription>
                Manage your deployed conversation flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No flows created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flows.map((flow: ConversationFlow) => (
                    <div key={flow.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{flow.name}</h4>
                        <p className="text-sm text-muted-foreground">{flow.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={flow.isActive ? "default" : "secondary"}>
                            {flow.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">v{flow.version}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deployFlowMutation.mutate(flow.id)}
                          disabled={deployFlowMutation.isPending}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Deploy
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}