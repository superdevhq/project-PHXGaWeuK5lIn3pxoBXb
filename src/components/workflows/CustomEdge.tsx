
import { memo } from "react";
import { EdgeProps, getBezierPath } from "reactflow";
import { cn } from "@/lib/utils";
import { NodeStatus } from "@/lib/types";

interface CustomEdgeData {
  condition?: string;
  status?: NodeStatus;
}

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps<CustomEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = () => {
    switch (data?.status) {
      case "running":
        return "stroke-blue-500";
      case "success":
        return "stroke-green-500";
      case "failed":
        return "stroke-red-500";
      default:
        return "stroke-gray-400 dark:stroke-gray-600";
    }
  };

  return (
    <>
      <path
        id={id}
        className={cn(
          "react-flow__edge-path",
          getEdgeColor(),
          data?.status === "running" && "animate-pulse"
        )}
        d={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: 2 }}
      />
      
      {data?.condition && (
        <foreignObject
          width={100}
          height={24}
          x={labelX - 50}
          y={labelY - 12}
          className="overflow-visible"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex items-center justify-center bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full border shadow-sm">
            {data.condition}
          </div>
        </foreignObject>
      )}
    </>
  );
};

export default memo(CustomEdge);
