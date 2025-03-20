
import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeTypes,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Workflow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Play, Save } from "lucide-react";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import { updateWorkflow, createWorkflowRun } from "@/services/workflowService";
import { toast } from "sonner";

interface WorkflowCanvasProps {
  workflow: Workflow;
  onNodeClick: (nodeId: string) => void;
  onCanvasClick: () => void;
  onWorkflowUpdate?: (workflow: Workflow) => void;
}

// Define custom node types
const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

// Define custom edge types
const edgeTypes = {
  customEdge: CustomEdge,
};

const WorkflowCanvas = ({ 
  workflow, 
  onNodeClick, 
  onCanvasClick,
  onWorkflowUpdate 
}: WorkflowCanvasProps) => {
  // Convert workflow data to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    return workflow.nodes.map((node) => ({
      id: node.id,
      type: "customNode",
      position: node.position,
      data: { ...node, onNodeClick },
      draggable: true,
    }));
  }, [workflow.nodes, onNodeClick]);

  const initialEdges: Edge[] = useMemo(() => {
    return workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "customEdge",
      data: {
        condition: edge.condition,
        status: workflow.nodes.find((n) => n.id === edge.source)?.status,
      },
      animated: workflow.nodes.find((n) => n.id === edge.source)?.status === "running",
    }));
  }, [workflow.edges, workflow.nodes]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Handle node selection
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      setSelectedNode(node.id);
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  // Handle canvas click to deselect
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    onCanvasClick();
  }, [onCanvasClick]);

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      console.log(`Node ${node.id} moved to position:`, node.position);
      // Update the node position in our data model
      const updatedNodes = nodes.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            position: node.position
          };
        }
        return n;
      });
      setNodes(updatedNodes);
    },
    [nodes, setNodes]
  );

  // Add a new node
  const addNode = useCallback(() => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: "customNode",
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      },
      data: {
        id: newNodeId,
        name: "New Task",
        type: "task",
        status: "idle",
        config: {},
        dependencies: [],
        description: "New task description",
        onNodeClick,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [onNodeClick, setNodes]);

  // Save workflow
  const saveWorkflow = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Convert React Flow nodes back to workflow nodes
      const updatedWorkflowNodes = nodes.map(node => ({
        id: node.id,
        name: node.data.name,
        type: node.data.type,
        status: node.data.status,
        position: node.position,
        config: node.data.config,
        dependencies: node.data.dependencies,
        description: node.data.description,
      }));
      
      // Convert React Flow edges back to workflow edges
      const updatedWorkflowEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        condition: edge.data?.condition,
      }));
      
      // Create updated workflow object
      const updatedWorkflow = {
        ...workflow,
        nodes: updatedWorkflowNodes,
        edges: updatedWorkflowEdges,
      };
      
      // Save to database
      const result = await updateWorkflow(workflow.id, {
        nodes: updatedWorkflowNodes,
        edges: updatedWorkflowEdges,
      });
      
      if (result && onWorkflowUpdate) {
        onWorkflowUpdate(result);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast.error("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  }, [workflow, nodes, edges, onWorkflowUpdate]);

  // Run workflow
  const runWorkflow = useCallback(async () => {
    try {
      setIsRunning(true);
      
      // First save any changes
      await saveWorkflow();
      
      // Then create a workflow run
      const run = await createWorkflowRun(workflow.id, workflow.version);
      
      if (run && onWorkflowUpdate) {
        // Update the workflow status
        onWorkflowUpdate({
          ...workflow,
          status: "running",
          lastRunAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("Failed to run workflow");
    } finally {
      setIsRunning(false);
    }
  }, [workflow, saveWorkflow, onWorkflowUpdate]);

  return (
    <div className="flex-1 h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-background/80 backdrop-blur-sm border rounded-lg"
        />
        <Panel position="top-left" className="flex gap-2">
          <Button size="sm" onClick={addNode} className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Add Node</span>
          </Button>
          <Button 
            size="sm" 
            onClick={runWorkflow} 
            variant="default" 
            className="gap-1"
            disabled={isRunning || workflow.status === "running"}
          >
            <Play className="h-4 w-4" />
            <span>{isRunning ? "Running..." : "Run"}</span>
          </Button>
          <Button 
            size="sm" 
            onClick={saveWorkflow} 
            variant="outline" 
            className="gap-1"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
