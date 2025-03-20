
import { useState, useRef, useEffect } from "react";
import { Plus, ZoomIn, ZoomOut, MousePointer, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Workflow, WorkflowNode as WorkflowNodeType } from "@/lib/types";
import WorkflowNode from "./WorkflowNode";
import WorkflowEdge from "./WorkflowEdge";
import { cn } from "@/lib/utils";

interface WorkflowCanvasProps {
  workflow: Workflow;
  onNodeClick: (nodeId: string) => void;
  onCanvasClick: () => void;
}

const WorkflowCanvas = ({ workflow, onNodeClick, onCanvasClick }: WorkflowCanvasProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "pan" | "add">("select");
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle canvas dragging for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "pan") {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && tool === "pan") {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition({
        x: position.x + dx,
        y: position.y + dy,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Handle node dragging
  const handleNodeDragStart = (nodeId: string, e: React.DragEvent) => {
    e.stopPropagation();
    setDragNodeId(nodeId);
    e.dataTransfer.setData("text/plain", nodeId);
    // Use a transparent image as drag ghost
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleNodeDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragNodeId(null);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragNodeId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / scale - position.x;
        const y = (e.clientY - rect.top) / scale - position.y;
        
        // Update node position logic would go here
        console.log(`Move node ${dragNodeId} to ${x}, ${y}`);
      }
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Get node positions for edges
  const getNodePosition = (nodeId: string): { x: number; y: number } => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    return node ? node.position : { x: 0, y: 0 };
  };

  return (
    <div className="relative flex-1 overflow-hidden border rounded-lg bg-slate-50 dark:bg-slate-900/50">
      {/* Canvas controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm flex">
          <Button
            variant={tool === "select" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("select")}
            className="h-8 w-8 rounded-r-none"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "pan" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("pan")}
            className="h-8 w-8 rounded-none"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(45 12 12)" />
            </svg>
          </Button>
          <Button
            variant={tool === "add" ? "default" : "ghost"}
            size="icon"
            onClick={() => setTool("add")}
            className="h-8 w-8 rounded-l-none"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 rounded-r-none"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomReset}
            className="h-8 px-2 rounded-none"
          >
            {Math.round(scale * 100)}%
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 rounded-l-none"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomReset}
          className="h-8 w-8 bg-background/80 backdrop-blur-sm border shadow-sm"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "h-full w-full",
          tool === "pan" ? "cursor-grab" : "cursor-default",
          dragging && "cursor-grabbing"
        )}
        onClick={onCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        <div
          className="absolute h-full w-full"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: "0 0",
          }}
        >
          {/* Grid background */}
          <div className="absolute inset-0 grid grid-cols-[repeat(50,minmax(50px,1fr))] grid-rows-[repeat(50,minmax(50px,1fr))]">
            {Array.from({ length: 50 * 50 }).map((_, i) => (
              <div
                key={i}
                className="border-r border-b border-slate-200 dark:border-slate-800/50"
              />
            ))}
          </div>

          {/* SVG for edges */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="0"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
              </marker>
            </defs>
            {workflow.edges.map((edge) => (
              <WorkflowEdge
                key={edge.id}
                edge={edge}
                sourcePosition={getNodePosition(edge.source)}
                targetPosition={getNodePosition(edge.target)}
                status={
                  workflow.nodes.find((n) => n.id === edge.source)?.status === "running" 
                    ? "active" 
                    : workflow.nodes.find((n) => n.id === edge.source)?.status === "success"
                    ? "success"
                    : workflow.nodes.find((n) => n.id === edge.source)?.status === "failed"
                    ? "failed"
                    : "idle"
                }
              />
            ))}
          </svg>

          {/* Nodes */}
          {workflow.nodes.map((node) => (
            <WorkflowNode
              key={node.id}
              node={node}
              onNodeClick={onNodeClick}
              onNodeDragStart={handleNodeDragStart}
              onNodeDragEnd={handleNodeDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
