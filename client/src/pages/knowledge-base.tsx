import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Search, Upload, Database, RefreshCw, FileText, Loader2, Activity } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function KnowledgeBase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["/api/tenants"],
  });

  // Fetch knowledge stats
  const { data: knowledgeStats } = useQuery({
    queryKey: ["/api/knowledge/stats", selectedTenant],
    enabled: !!selectedTenant,
  });

  // Fetch training documents
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/training-documents", selectedTenant],
    enabled: !!selectedTenant,
  });

  // Index documents mutation
  const indexDocumentsMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      return apiRequest(`/api/knowledge/index-documents/${tenantId}`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training documents indexed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/stats", selectedTenant] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to index training documents",
        variant: "destructive",
      });
    },
  });

  // Search knowledge base
  const searchKnowledgeBase = async () => {
    if (!selectedTenant || !searchQuery) return;

    setIsSearching(true);
    try {
      const response = await apiRequest("/api/knowledge/search", {
        method: "POST",
        body: JSON.stringify({
          tenantId: selectedTenant,
          query: searchQuery,
          topK: 5
        }),
      });
      setSearchResults(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Index new content
  const [newContent, setNewContent] = useState({ title: "", content: "" });
  const indexContentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/knowledge/index", {
        method: "POST",
        body: JSON.stringify({
          tenantId: selectedTenant,
          documentId: `manual_${Date.now()}`,
          content: newContent.content,
          metadata: { title: newContent.title, type: "manual_entry" }
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Content indexed successfully",
      });
      setNewContent({ title: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/stats", selectedTenant] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to index content",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Knowledge Base Management
        </h1>
        <p className="text-muted-foreground">
          Manage tenant-specific knowledge bases with vector search capabilities
        </p>
      </div>

      {/* Tenant Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a tenant to manage knowledge base" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant: any) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.plan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTenant && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {knowledgeStats?.totalDocuments || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {knowledgeStats?.totalChunks || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Chunk Size</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {knowledgeStats?.avgChunkSize || 0} chars
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Indexed</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {knowledgeStats?.lastIndexed 
                      ? new Date(knowledgeStats.lastIndexed).toLocaleDateString()
                      : 'Never'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Button
                onClick={() => indexDocumentsMutation.mutate(selectedTenant)}
                disabled={indexDocumentsMutation.isPending}
              >
                {indexDocumentsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Index Training Documents
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Search Knowledge Base</CardTitle>
                <CardDescription>
                  Search for relevant information using natural language queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your search query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchKnowledgeBase()}
                    />
                    <Button 
                      onClick={searchKnowledgeBase}
                      disabled={isSearching || !searchQuery}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Search Results:</h3>
                      {searchResults.map((result, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="secondary">
                                Score: {(result.score * 100).toFixed(1)}%
                              </Badge>
                              {result.metadata?.fileName && (
                                <span className="text-sm text-muted-foreground">
                                  {result.metadata.fileName}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{result.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Training Documents</CardTitle>
                <CardDescription>
                  Documents available for this tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No training documents found
                    </p>
                  ) : (
                    documents.map((doc: any) => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              Type: {doc.fileType} | Size: {(doc.fileSize / 1024).toFixed(2)}KB
                            </p>
                          </div>
                          <Badge>
                            {doc.processingStatus || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manual Content Entry</CardTitle>
                <CardDescription>
                  Add content directly to the knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter a title for this content"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter the content to be indexed..."
                      rows={6}
                      value={newContent.content}
                      onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={() => indexContentMutation.mutate()}
                    disabled={!newContent.title || !newContent.content || indexContentMutation.isPending}
                  >
                    {indexContentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Index Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}