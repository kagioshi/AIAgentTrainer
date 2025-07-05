import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Calendar, 
  Users, 
  Phone, 
  Target,
  Upload,
  Download,
  Settings,
  Activity,
  TrendingUp
} from "lucide-react";

// Form schema for creating campaigns
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  agentId: z.string().min(1, "Agent selection is required"),
  voipProvider: z.string().min(1, "VoIP provider is required"),
  maxConcurrentCalls: z.number().min(1).max(50),
  retryAttempts: z.number().min(0).max(10),
  retryDelay: z.number().min(1).max(1440), // minutes
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  workingDays: z.array(z.number()),
});

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalLeads: number;
  completedLeads: number;
  successfulCalls: number;
  progress: number;
  createdAt: string;
  agentName?: string;
  estimatedCompletion?: string;
}

interface CampaignLead {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  status: string;
  callAttempts: number;
  lastCallAt?: string;
  notes?: string;
}

export default function CampaignManagement() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLeadsDialog, setShowLeadsDialog] = useState(false);
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const mockCampaigns: Campaign[] = [
    {
      id: "1",
      name: "Q1 Lead Generation",
      status: "running",
      totalLeads: 1500,
      completedLeads: 450,
      successfulCalls: 180,
      progress: 30,
      createdAt: "2025-01-01T10:00:00Z",
      agentName: "Sales Assistant v2.1",
      estimatedCompletion: "2025-01-15T18:00:00Z"
    },
    {
      id: "2", 
      name: "Product Demo Outreach",
      status: "paused",
      totalLeads: 800,
      completedLeads: 320,
      successfulCalls: 96,
      progress: 40,
      createdAt: "2024-12-20T09:00:00Z",
      agentName: "Demo Scheduler v1.5"
    },
    {
      id: "3",
      name: "Customer Survey",
      status: "completed",
      totalLeads: 500,
      completedLeads: 500,
      successfulCalls: 385,
      progress: 100,
      createdAt: "2024-12-15T14:00:00Z",
      agentName: "Survey Agent v1.0"
    }
  ];

  const mockLeads: CampaignLead[] = [
    {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "+1-555-0123",
      email: "john.doe@example.com",
      company: "Acme Corp",
      status: "contacted",
      callAttempts: 2,
      lastCallAt: "2025-01-05T14:30:00Z",
      notes: "Interested in Q2 demo"
    },
    {
      id: "2",
      firstName: "Jane",
      lastName: "Smith",
      phoneNumber: "+1-555-0124",
      email: "jane.smith@techco.com",
      company: "TechCo",
      status: "pending",
      callAttempts: 0
    },
    {
      id: "3",
      firstName: "Bob",
      lastName: "Johnson",
      phoneNumber: "+1-555-0125",
      company: "StartupXYZ",
      status: "failed",
      callAttempts: 3,
      lastCallAt: "2025-01-04T16:45:00Z",
      notes: "Voicemail full, email bounced"
    }
  ];

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      maxConcurrentCalls: 5,
      retryAttempts: 3,
      retryDelay: 60,
      workingHoursStart: "09:00",
      workingHoursEnd: "17:00",
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    },
  });

  const handleCreateCampaign = (data: z.infer<typeof campaignSchema>) => {
    console.log("Creating campaign:", data);
    toast({
      title: "Campaign Created",
      description: "Your campaign has been created and will start processing leads.",
    });
    setShowCreateDialog(false);
    form.reset();
  };

  const handleCampaignAction = (campaignId: string, action: string) => {
    console.log(`${action} campaign ${campaignId}`);
    toast({
      title: `Campaign ${action}`,
      description: `Campaign has been ${action.toLowerCase()}.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { color: "bg-green-500", text: "Running" },
      paused: { color: "bg-yellow-500", text: "Paused" },
      completed: { color: "bg-blue-500", text: "Completed" },
      draft: { color: "bg-gray-500", text: "Draft" },
      scheduled: { color: "bg-purple-500", text: "Scheduled" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaign Management</h1>
            <p className="text-muted-foreground">
              Manage automated calling campaigns and lead processing
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>
                  Set up automated lead processing with customizable calling schedules and retry logic.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleCreateCampaign)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Q1 Lead Generation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agentId">AI Agent</Label>
                    <Select onValueChange={(value) => form.setValue("agentId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent1">Sales Assistant v2.1</SelectItem>
                        <SelectItem value="agent2">Demo Scheduler v1.5</SelectItem>
                        <SelectItem value="agent3">Survey Agent v1.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Campaign objectives and target audience..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="voipProvider">VoIP Provider</Label>
                    <Select onValueChange={(value) => form.setValue("voipProvider", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="voip.ms">VoIP.ms</SelectItem>
                        <SelectItem value="vonage">Vonage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxConcurrentCalls">Max Concurrent Calls</Label>
                    <Input
                      id="maxConcurrentCalls"
                      type="number"
                      {...form.register("maxConcurrentCalls", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      {...form.register("retryAttempts", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="workingHoursStart">Start Time</Label>
                    <Input
                      id="workingHoursStart"
                      type="time"
                      {...form.register("workingHoursStart")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workingHoursEnd">End Time</Label>
                    <Input
                      id="workingHoursEnd"
                      type="time"
                      {...form.register("workingHoursEnd")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retryDelay">Retry Delay (minutes)</Label>
                    <Input
                      id="retryDelay"
                      type="number"
                      {...form.register("retryDelay", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Campaign</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaign Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                +1 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,800</div>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">661</div>
              <p className="text-xs text-muted-foreground">
                23.6% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.6%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              Manage your automated calling campaigns and monitor progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCampaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Agent: {campaign.agentName}
                        </p>
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === "running" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCampaignAction(campaign.id, "pause")}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCampaignAction(campaign.id, "stop")}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}
                      {campaign.status === "paused" && (
                        <Button
                          size="sm"
                          onClick={() => handleCampaignAction(campaign.id, "resume")}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCampaign(campaign.id);
                          setShowLeadsDialog(true);
                        }}
                      >
                        View Leads
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Total Leads:</span>
                      <div className="font-semibold">{campaign.totalLeads.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <div className="font-semibold">{campaign.completedLeads.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Successful:</span>
                      <div className="font-semibold">{campaign.successfulCalls.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate:</span>
                      <div className="font-semibold">
                        {campaign.completedLeads > 0 
                          ? ((campaign.successfulCalls / campaign.completedLeads) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{campaign.progress}%</span>
                    </div>
                    <Progress value={campaign.progress} className="h-2" />
                    {campaign.estimatedCompletion && (
                      <p className="text-xs text-muted-foreground">
                        Est. completion: {new Date(campaign.estimatedCompletion).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Leads Dialog */}
        <Dialog open={showLeadsDialog} onOpenChange={setShowLeadsDialog}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Campaign Leads</DialogTitle>
              <DialogDescription>
                View and manage individual leads for the selected campaign
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-1" />
                    Import Leads
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export Results
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Filter by status:</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Call</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        {lead.firstName} {lead.lastName}
                      </TableCell>
                      <TableCell>{lead.phoneNumber}</TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            lead.status === "contacted" 
                              ? "default" 
                              : lead.status === "failed" 
                              ? "destructive" 
                              : "secondary"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.callAttempts}</TableCell>
                      <TableCell>
                        {lead.lastCallAt 
                          ? new Date(lead.lastCallAt).toLocaleDateString()
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {lead.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}