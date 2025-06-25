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
  PhoneCall, 
  PhoneOff,
  Clock,
  PlayCircle,
  Mic,
  MicOff,
  Download,
  Calendar,
  User,
  Timer,
  Volume2
} from "lucide-react";

interface Call {
  id: string;
  tenantId: string;
  agentId: string;
  phoneNumber: string;
  direction: "inbound" | "outbound";
  status: "active" | "completed" | "failed" | "queued";
  duration: number;
  startTime?: string;
  endTime?: string;
  recordingUrl?: string;
  transcript?: string;
  metadata?: any;
}

interface CallRecording {
  id: string;
  callId: string;
  recordingUrl: string;
  duration: number;
  transcript?: string;
  createdAt: string;
}

export default function CallManagement() {
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callDirection, setCallDirection] = useState<"inbound" | "outbound">("outbound");
  
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

  // Fetch active calls
  const { data: activeCalls = [] } = useQuery({
    queryKey: ["/api/calls/active"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch call history
  const { data: callHistory = [] } = useQuery({
    queryKey: ["/api/calls", selectedTenant],
    enabled: !!selectedTenant
  });

  // Fetch call recordings
  const { data: recordings = [] } = useQuery({
    queryKey: ["/api/call-recordings", selectedTenant],
    enabled: !!selectedTenant
  });

  // Start call mutation
  const startCallMutation = useMutation({
    mutationFn: async (callData: any) => {
      return await apiRequest("/api/calls", {
        method: "POST",
        body: callData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call initiated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      setPhoneNumber("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start call",
        variant: "destructive"
      });
    }
  });

  // End call mutation
  const endCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      return await apiRequest(`/api/calls/${callId}/end`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call ended successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
    }
  });

  const handleStartCall = () => {
    if (!selectedTenant || !selectedAgent || !phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    startCallMutation.mutate({
      tenantId: selectedTenant,
      agentId: selectedAgent,
      phoneNumber,
      direction: callDirection,
      status: "queued"
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      case "queued":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <PhoneCall className="w-4 h-4" />;
      case "completed":
        return <PhoneOff className="w-4 h-4" />;
      case "failed":
        return <PhoneOff className="w-4 h-4 text-red-500" />;
      case "queued":
        return <Clock className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Management</h1>
          <p className="text-muted-foreground">
            Manage AI agent calls and monitor real-time conversations
          </p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Calls</TabsTrigger>
          <TabsTrigger value="initiate">Initiate Call</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Calls</CardTitle>
              <CardDescription>
                Monitor ongoing AI agent conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active calls</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeCalls.map((call: Call) => (
                    <div key={call.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(call.status)} animate-pulse`} />
                          <div>
                            <h4 className="font-medium">{call.phoneNumber}</h4>
                            <p className="text-sm text-muted-foreground">
                              {call.direction} • Agent: {call.agentId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Timer className="w-3 h-3 mr-1" />
                            {formatDuration(call.duration || 0)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => endCallMutation.mutate(call.id)}
                            disabled={endCallMutation.isPending}
                          >
                            <PhoneOff className="w-4 h-4 mr-1" />
                            End Call
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(call.status)}
                            <span className="capitalize">{call.status}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Time</p>
                          <p>{call.startTime ? new Date(call.startTime).toLocaleTimeString() : "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Recording</p>
                          <div className="flex items-center gap-1">
                            {call.recordingUrl ? (
                              <>
                                <Mic className="w-3 h-3 text-green-500" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <MicOff className="w-3 h-3 text-gray-500" />
                                <span>Off</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actions</p>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Volume2 className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mic className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Initiate New Call</CardTitle>
                <CardDescription>
                  Start a new AI agent conversation
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
                  <Label htmlFor="direction">Call Direction</Label>
                  <Select value={callDirection} onValueChange={(value: any) => setCallDirection(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound Call</SelectItem>
                      <SelectItem value="inbound">Inbound Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <Button 
                  onClick={handleStartCall}
                  disabled={startCallMutation.isPending}
                  className="w-full"
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Start Call
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Queue</CardTitle>
                <CardDescription>
                  Pending calls waiting for agent assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {callHistory.filter((call: Call) => call.status === "queued").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No queued calls</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callHistory
                      .filter((call: Call) => call.status === "queued")
                      .map((call: Call) => (
                        <div key={call.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{call.phoneNumber}</h4>
                              <p className="text-sm text-muted-foreground">{call.direction}</p>
                            </div>
                            <Badge variant="secondary">Queued</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                View completed and failed calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No call history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callHistory.map((call: Call) => (
                    <div key={call.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(call.status)}
                            <span className="font-medium">{call.phoneNumber}</span>
                          </div>
                          <Badge variant={call.status === "completed" ? "default" : "destructive"}>
                            {call.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {call.duration ? formatDuration(call.duration) : "0:00"}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p>Direction: {call.direction}</p>
                        </div>
                        <div>
                          <p>Start: {call.startTime ? new Date(call.startTime).toLocaleString() : "-"}</p>
                        </div>
                        <div>
                          <p>End: {call.endTime ? new Date(call.endTime).toLocaleString() : "-"}</p>
                        </div>
                        <div>
                          {call.recordingUrl && (
                            <Button size="sm" variant="outline">
                              <PlayCircle className="w-3 h-3 mr-1" />
                              Play
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Recordings</CardTitle>
              <CardDescription>
                Access recorded conversations and transcripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recordings available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recordings.map((recording: CallRecording) => (
                    <div key={recording.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">Call Recording</h4>
                          <p className="text-sm text-muted-foreground">
                            Duration: {formatDuration(recording.duration)} • 
                            {new Date(recording.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Play
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      
                      {recording.transcript && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-2">Transcript:</p>
                          <p className="text-sm text-muted-foreground">
                            {recording.transcript.substring(0, 200)}...
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}