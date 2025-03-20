
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

interface WorkflowCanvasProps {
  workflow: Workflow;
  onNodeClick: (nodeId: string) => void;
  onCanvasClick: () => void;
}

// Define custom node types
const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

// Define custom edge types
const edgeTypes = {
  customEdge: CustomEdge,
};

const WorkflowCanvas = ({ workflow, onNodeClick, onCanvasClick }: WorkflowCanvasProps) => {
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
      // Here you would update your workflow data with the new position
    },
    []
  );

  // Add a new node
  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: "customNode",
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      },
      data: {
        id: `node-${nodes.length + 1}`,
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
  }, [nodes.length, onNodeClick, setNodes]);

  // Save workflow
  const saveWorkflow = useCallback(() => {
    const updatedWorkflow = {
      ...workflow,
      nodes: nodes.map((node) => ({
        ...node.data,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        condition: edge.data?.condition,
      })),
    };
    console.log("Saving workflow:", updatedWorkflow);
    // Here you would save the workflow to your backend
  }, [workflow, nodes, edges]);

  // Run workflow
  const runWorkflow = useCallback(() => {
    console.log("Running workflow:", workflow.id);
    // Here you would trigger the workflow execution
  }, [workflow.id]);

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
          <Button size="sm" onClick={runWorkflow} variant="default" className="gap-1">
            <Play className="h-4 w-4" />
            <span>Run</span>
          </Button>
          <Button size="sm" onClick={saveWorkflow} variant="outline" className="gap-1">
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
