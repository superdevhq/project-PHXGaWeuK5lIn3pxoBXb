
import { useState } from "react";
import { Workflow, WorkflowNode } from "@/lib/types";
import Header from "@/components/Header";
import SidebarNav from "@/components/Sidebar";
import WorkflowCanvas from "@/components/workflows/WorkflowCanvas";
import MonitoringPanel from "@/components/monitoring/MonitoringPanel";
import { Button } from "@/components/ui/button";
import { Clock, Play, Plus } from "lucide-react";

// Sample workflow data
const sampleWorkflow: Workflow = {
  id: "wf-1",
  name: "Data Processing Pipeline",
  description: "Extract, transform, and load data from multiple sources",
  version: "1.0.0",
  nodes: [
    {
      id: "node-1",
      name: "Data Extraction",
      type: "trigger",
      status: "success",
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
      status: "success",
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
      status: "running",
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
      status: "pending",
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
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-15T00:00:00Z",
  lastRunAt: "2023-01-15T00:00:00Z",
  status: "running"
};

const Index = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const selectedNode = selectedNodeId 
    ? sampleWorkflow.nodes.find(node => node.id === selectedNodeId) || null
    : null;

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleCanvasClick = () => {
    setSelectedNodeId(null);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">{sampleWorkflow.name}</h1>
                <p className="text-sm text-muted-foreground">{sampleWorkflow.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last run: 15 Jan 2023, 00:00</span>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Node</span>
                </Button>
                <Button size="sm" className="gap-1">
                  <Play className="h-4 w-4" />
                  <span>Run Workflow</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {sampleWorkflow.tags?.map((tag) => (
                <div key={tag} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                  {tag}
                </div>
              ))}
              <div className="bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded text-xs">
                v{sampleWorkflow.version}
              </div>
              <div className="bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Running
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex">
            <WorkflowCanvas 
              workflow={sampleWorkflow} 
              onNodeClick={handleNodeClick}
              onCanvasClick={handleCanvasClick}
            />
            {selectedNode && (
              <MonitoringPanel 
                selectedNode={selectedNode} 
                onClose={() => setSelectedNodeId(null)} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
