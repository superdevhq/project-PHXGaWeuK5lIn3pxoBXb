
import { useState, useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { Workflow, WorkflowNode } from "@/lib/types";
import Header from "@/components/Header";
import SidebarNav from "@/components/Sidebar";
import WorkflowCanvas from "@/components/workflows/WorkflowCanvas";
import WorkflowList from "@/components/workflows/WorkflowList";
import WorkflowRunsList from "@/components/workflows/WorkflowRunsList";
import MonitoringPanel from "@/components/monitoring/MonitoringPanel";
import { Button } from "@/components/ui/button";
import { Clock, Play, Plus, Loader2, LayoutGrid, List } from "lucide-react";
import { fetchWorkflows, createWorkflow } from "@/services/workflowService";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample workflow data for creating a new workflow
const sampleWorkflow: Omit<Workflow, "id" | "createdAt" | "updatedAt"> = {
  name: "Data Processing Pipeline",
  description: "Extract, transform, and load data from multiple sources",
  version: "1.0.0",
  nodes: [
    {
      id: "node-1",
      name: "Data Extraction",
      type: "trigger",
      status: "idle",
      position: { x: 100, y: 100 },
      config: {
        source: "api",
        endpoint: "/data",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${TOKEN}"
        }
      },
      dependencies: [],
      description: "Extract data from REST API"
    },
    {
      id: "node-2",
      name: "Data Validation",
      type: "task",
      status: "idle",
      position: { x: 300, y: 100 },
      config: {
        schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            value: { type: "number" }
          },
          required: ["id", "name"]
        }
      },
      dependencies: ["node-1"],
      description: "Validate data against schema"
    },
    {
      id: "node-3",
      name: "Data Transformation",
      type: "task",
      status: "idle",
      position: { x: 500, y: 100 },
      config: {
        transformations: [
          { field: "name", operation: "uppercase" },
          { field: "value", operation: "multiply", factor: 2 }
        ]
      },
      dependencies: ["node-2"],
      description: "Transform data fields"
    },
    {
      id: "node-4",
      name: "Quality Check",
      type: "decision",
      status: "idle",
      position: { x: 700, y: 100 },
      config: {
        condition: "data.quality > 0.8"
      },
      dependencies: ["node-3"],
      description: "Check data quality score"
    },
    {
      id: "node-5",
      name: "Data Loading",
      type: "task",
      status: "idle",
      position: { x: 900, y: 50 },
      config: {
        destination: "database",
        table: "processed_data",
        mode: "append"
      },
      dependencies: ["node-4"],
      description: "Load data to database"
    },
    {
      id: "node-6",
      name: "Error Handling",
      type: "task",
      status: "idle",
      position: { x: 900, y: 150 },
      config: {
        action: "log",
        notify: true,
        retry: false
      },
      dependencies: ["node-4"],
      description: "Handle low quality data"
    },
    {
      id: "node-7",
      name: "Notification",
      type: "task",
      status: "idle",
      position: { x: 1100, y: 100 },
      config: {
        channel: "email",
        recipients: ["admin@example.com"],
        template: "pipeline-complete"
      },
      dependencies: ["node-5", "node-6"],
      description: "Send completion notification"
    }
  ],
  edges: [
    { id: "edge-1", source: "node-1", target: "node-2" },
    { id: "edge-2", source: "node-2", target: "node-3" },
    { id: "edge-3", source: "node-3", target: "node-4" },
    { id: "edge-4", source: "node-4", target: "node-5", condition: "quality > 0.8" },
    { id: "edge-5", source: "node-4", target: "node-6", condition: "quality <= 0.8" },
    { id: "edge-6", source: "node-5", target: "node-7" },
    { id: "edge-7", source: "node-6", target: "node-7" }
  ],
  schedule: {
    cron: "0 0 * * *"
  },
  tags: ["data", "etl", "production"],
  lastRunAt: undefined,
  status: "inactive"
};

const Index = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("canvas");

  // Load workflows from Supabase
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        const data = await fetchWorkflows();
        console.log("Fetched workflows:", data);
        setWorkflows(data);
        
        // Set the first workflow as current if available
        if (data.length > 0) {
          setCurrentWorkflow(data[0]);
        }
      } catch (error) {
        console.error("Error loading workflows:", error);
        toast.error("Failed to load workflows");
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkflows();
  }, []);
  
  const selectedNode = currentWorkflow && selectedNodeId 
    ? currentWorkflow.nodes.find(node => node.id === selectedNodeId) || null
    : null;

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleCanvasClick = () => {
    setSelectedNodeId(null);
  };
  
  const handleWorkflowUpdate = (updatedWorkflow: Workflow) => {
    setCurrentWorkflow(updatedWorkflow);
    
    // Also update the workflow in the list
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(wf => 
        wf.id === updatedWorkflow.id ? updatedWorkflow : wf
      )
    );
  };
  
  const handleCreateWorkflow = async () => {
    try {
      setCreating(true);
      console.log("Creating workflow with data:", sampleWorkflow);
      const newWorkflow = await createWorkflow(sampleWorkflow);
      
      if (newWorkflow) {
        console.log("New workflow created:", newWorkflow);
        setWorkflows(prev => [newWorkflow, ...prev]);
        setCurrentWorkflow(newWorkflow);
        setActiveTab("canvas");
        toast.success("New workflow created");
      } else {
        toast.error("Failed to create workflow - no data returned");
      }
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error(`Failed to create workflow: ${error.message || "Unknown error"}`);
    } finally {
      setCreating(false);
    }
  };
  
  const handleWorkflowSelect = (workflow: Workflow) => {
    console.log("Selected workflow:", workflow);
    setCurrentWorkflow(workflow);
    setSelectedNodeId(null);
    setActiveTab("canvas");
  };
  
  const handleWorkflowDelete = (id: string) => {
    setWorkflows(prev => prev.filter(wf => wf.id !== id));
    
    // If the deleted workflow is the current one, select another one
    if (currentWorkflow?.id === id) {
      const nextWorkflow = workflows.find(wf => wf.id !== id);
      setCurrentWorkflow(nextWorkflow || null);
      setSelectedNodeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav />
          <main className="flex-1 overflow-hidden flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Loading workflows...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <div className="w-80 border-r overflow-y-auto">
          <WorkflowList 
            workflows={workflows}
            onWorkflowSelect={handleWorkflowSelect}
            onWorkflowDelete={handleWorkflowDelete}
            onCreateWorkflow={handleCreateWorkflow}
            selectedWorkflowId={currentWorkflow?.id}
            isCreating={creating}
          />
        </div>
        <main className="flex-1 overflow-hidden flex flex-col">
          {!currentWorkflow ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-6">
                <h2 className="text-2xl font-bold mb-2">No workflows found</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first workflow to get started with FlowForge.
                </p>
                <Button 
                  onClick={handleCreateWorkflow} 
                  disabled={creating}
                  className="gap-2"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Create Sample Workflow</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold">{currentWorkflow.name}</h1>
                    <p className="text-sm text-muted-foreground">{currentWorkflow.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentWorkflow.lastRunAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Last run: {new Date(currentWorkflow.lastRunAt).toLocaleString()}</span>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={handleCreateWorkflow}
                      disabled={creating}
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>New Workflow</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {currentWorkflow.tags?.map((tag) => (
                    <div key={tag} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                      {tag}
                    </div>
                  ))}
                  <div className="bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded text-xs">
                    v{currentWorkflow.version}
                  </div>
                  <div className={`px-2 py-0.5 rounded text-xs flex items-center gap-1
                    ${currentWorkflow.status === 'running' ? 'bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-400' : 
                     currentWorkflow.status === 'failed' ? 'bg-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400' :
                     'bg-gray-100 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400'}`}
                  >
                    {currentWorkflow.status === 'running' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    )}
                    {currentWorkflow.status === 'failed' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    )}
                    {currentWorkflow.status === 'inactive' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                    )}
                    {currentWorkflow.status.charAt(0).toUpperCase() + currentWorkflow.status.slice(1)}
                  </div>
                </div>

                <div className="mt-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="canvas" className="flex items-center gap-1">
                        <LayoutGrid className="h-4 w-4" />
                        <span>Canvas</span>
                      </TabsTrigger>
                      <TabsTrigger value="runs" className="flex items-center gap-1">
                        <List className="h-4 w-4" />
                        <span>Execution History</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {activeTab === "canvas" && (
                  <div className="h-full">
                    <div className="flex h-full">
                      <ReactFlowProvider>
                        <WorkflowCanvas 
                          workflow={currentWorkflow} 
                          onNodeClick={handleNodeClick}
                          onCanvasClick={handleCanvasClick}
                          onWorkflowUpdate={handleWorkflowUpdate}
                        />
                      </ReactFlowProvider>
                      {selectedNode && (
                        <MonitoringPanel 
                          selectedNode={selectedNode} 
                          onClose={() => setSelectedNodeId(null)} 
                        />
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "runs" && (
                  <div className="h-full p-4 overflow-y-auto">
                    <WorkflowRunsList workflowId={currentWorkflow.id} />
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
