
import { WorkflowEdge as WorkflowEdgeType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WorkflowEdgeProps {
  edge: WorkflowEdgeType;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  status?: "idle" | "active" | "success" | "failed";
}

const WorkflowEdge = ({ 
  edge, 
  sourcePosition, 
  targetPosition,
  status = "idle"
}: WorkflowEdgeProps) => {
  // Calculate the path
  const sourceX = sourcePosition.x + 72; // Half of node width (144/2)
  const sourceY = sourcePosition.y + 24; // Half of node height
  const targetX = targetPosition.x;
  const targetY = targetPosition.y + 24; // Half of node height

  // Calculate control points for the curve
  const dx = Math.abs(targetX - sourceX);
  const controlPointX = sourceX + dx * 0.5;

  // Create the SVG path
  const path = `M ${sourceX} ${sourceY} C ${controlPointX} ${sourceY}, ${controlPointX} ${targetY}, ${targetX} ${targetY}`;

  // Determine the color based on status
  const getEdgeColor = () => {
    switch (status) {
      case "active":
        return "stroke-blue-500";
      case "success":
        return "stroke-green-500";
      case "failed":
        return "stroke-red-500";
      default:
        return "stroke-gray-400 dark:stroke-gray-600";
    }
  };

  // Calculate the marker position for the arrow
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const arrowX = targetX - 10 * Math.cos(angle);
  const arrowY = targetY - 10 * Math.sin(angle);
  const arrowPoints = `${arrowX},${arrowY} ${arrowX - 8 * Math.cos(angle - Math.PI/6)},${arrowY - 8 * Math.sin(angle - Math.PI/6)} ${arrowX - 8 * Math.cos(angle + Math.PI/6)},${arrowY - 8 * Math.sin(angle + Math.PI/6)}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        className={cn(
          "workflow-edge",
          getEdgeColor(),
          status === "active" && "animate-pulse",
          "stroke-2"
        )}
        markerEnd="url(#arrowhead)"
      />
      <polygon 
        points={arrowPoints} 
        className={cn(
          "fill-current",
          getEdgeColor()
        )} 
      />
      {edge.condition && (
        <foreignObject
          x={(sourceX + targetX) / 2 - 50}
          y={(sourceY + targetY) / 2 - 12}
          width="100"
          height="24"
        >
          <div className="flex items-center justify-center bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full border shadow-sm">
            {edge.condition}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export default WorkflowEdge;
