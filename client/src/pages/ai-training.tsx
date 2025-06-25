import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  Bot, 
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  Mic,
  Database
} from "lucide-react";

interface TrainingDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  processingStatus: string;
  extractedText?: string;
  createdAt: string;
}

interface TrainingJob {
  id: string;
  jobType: string;
  status: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export default function AITraining() {
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [trainingType, setTrainingType] = useState<string>("fine_tuning");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Fetch training documents
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/training/documents", selectedTenant],
    enabled: !!selectedTenant
  });

  // Fetch training jobs
  const { data: trainingJobs = [] } = useQuery({
    queryKey: ["/api/training-jobs", selectedTenant],
    enabled: !!selectedTenant
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("tenantId", selectedTenant);
      
      const response = await fetch("/api/training/upload", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded and processing started"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    }
  });

  // Start training mutation
  const startTrainingMutation = useMutation({
    mutationFn: async (trainingData: any) => {
      return await apiRequest("/api/training/start", {
        method: "POST",
        body: trainingData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training job started successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training-jobs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start training",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedTenant) {
      uploadDocumentMutation.mutate(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a tenant first",
        variant: "destructive"
      });
    }
  };

  const handleStartTraining = () => {
    if (!selectedTenant || !selectedAgent || selectedDocuments.length === 0) {
      toast({
        title: "Error",
        description: "Please select tenant, agent, and at least one document",
        variant: "destructive"
      });
      return;
    }

    startTrainingMutation.mutate({
      tenantId: selectedTenant,
      agentId: selectedAgent,
      trainingType,
      documentIds: selectedDocuments,
      trainingParameters: {
        epochs: 3,
        learningRate: 0.001,
        batchSize: 4
      },
      targetModel: "gpt-3.5-turbo"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "processing":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrainingTypeIcon = (type: string) => {
    switch (type) {
      case "fine_tuning":
        return <Brain className="w-5 h-5" />;
      case "knowledge_base":
        return <Database className="w-5 h-5" />;
      case "persona_training":
        return <Bot className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Training</h1>
          <p className="text-muted-foreground">
            Upload documents and train AI agents with advanced machine learning
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Document Upload</TabsTrigger>
          <TabsTrigger value="training">Training Jobs</TabsTrigger>
          <TabsTrigger value="history">Training History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Training Configuration</CardTitle>
                <CardDescription>
                  Set up your AI training parameters
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
                  <Label htmlFor="trainingType">Training Type</Label>
                  <Select value={trainingType} onValueChange={setTrainingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fine_tuning">Fine Tuning</SelectItem>
                      <SelectItem value="knowledge_base">Knowledge Base</SelectItem>
                      <SelectItem value="persona_training">Persona Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx,.csv,.json"
                      onChange={handleFileUpload}
                      disabled={!selectedTenant || uploadDocumentMutation.isPending}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!selectedTenant || uploadDocumentMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleStartTraining}
                  disabled={startTrainingMutation.isPending || selectedDocuments.length === 0}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
              </CardContent>
            </Card>

            {/* Document Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Training Documents</CardTitle>
                <CardDescription>
                  Select documents for training
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc: TrainingDocument) => (
                      <div
                        key={doc.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDocuments.includes(doc.id) 
                            ? "border-primary bg-primary/10" 
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => {
                          setSelectedDocuments(prev => 
                            prev.includes(doc.id)
                              ? prev.filter(id => id !== doc.id)
                              : [...prev, doc.id]
                          );
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{doc.fileName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {(doc.fileSize / 1024).toFixed(1)} KB • {doc.fileType}
                            </p>
                          </div>
                          <Badge variant={doc.processingStatus === "completed" ? "default" : "secondary"}>
                            {doc.processingStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Training Jobs</CardTitle>
              <CardDescription>
                Monitor ongoing AI training processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingJobs.filter((job: TrainingJob) => job.status === "processing").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active training jobs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainingJobs
                    .filter((job: TrainingJob) => job.status === "processing")
                    .map((job: TrainingJob) => (
                      <div key={job.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTrainingTypeIcon(job.jobType)}
                            <h4 className="font-medium">
                              {job.jobType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </h4>
                          </div>
                          {getStatusIcon(job.status)}
                        </div>
                        <Progress value={job.progress} className="mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {job.progress}% complete
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training History</CardTitle>
              <CardDescription>
                View completed and failed training jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No training history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainingJobs.map((job: TrainingJob) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTrainingTypeIcon(job.jobType)}
                          <h4 className="font-medium">
                            {job.jobType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <Badge variant={job.status === "completed" ? "default" : "destructive"}>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.startedAt && (
                          <p>Started: {new Date(job.startedAt).toLocaleString()}</p>
                        )}
                        {job.completedAt && (
                          <p>Completed: {new Date(job.completedAt).toLocaleString()}</p>
                        )}
                        {job.errorMessage && (
                          <p className="text-red-500">Error: {job.errorMessage}</p>
                        )}
                      </div>
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