
import { useState } from "react";
import { MoreHorizontal, Play, AlertCircle, CheckCircle, Clock, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowNode as WorkflowNodeType, NodeStatus, NodeType } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  onNodeClick: (nodeId: string) => void;
  onNodeDragStart: (nodeId: string, e: React.DragEvent) => void;
  onNodeDragEnd: (e: React.DragEvent) => void;
}

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case "task":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "container":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "decision":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3L21 17H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "trigger":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
          <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
        </svg>
      );
    case "sensor":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "resource":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2" />
          <path d="M7 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return <div className="h-4 w-4" />;
  }
};

const getStatusIcon = (status: NodeStatus) => {
  switch (status) {
    case "running":
      return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "skipped":
      return <Pause className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
};

const getNodeColor = (type: NodeType, status: NodeStatus) => {
  if (status === "failed") return "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700";
  if (status === "running") return "bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700";
  if (status === "success") return "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700";
  if (status === "pending") return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700";
  
  switch (type) {
    case "task":
      return "bg-indigo-100 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700";
    case "container":
      return "bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700";
    case "decision":
      return "bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700";
    case "trigger":
      return "bg-cyan-100 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700";
    case "sensor":
      return "bg-teal-100 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700";
    case "resource":
      return "bg-emerald-100 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700";
    default:
      return "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700";
  }
};

const WorkflowNode = ({ node, onNodeClick, onNodeDragStart, onNodeDragEnd }: WorkflowNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "workflow-node absolute rounded-md border-2 shadow-sm p-3 w-48 cursor-pointer",
        getNodeColor(node.type, node.status)
      )}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        zIndex: 10
      }}
      onClick={(e) => {
        e.stopPropagation();
        onNodeClick(node.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={(e) => onNodeDragStart(node.id, e)}
      onDragEnd={onNodeDragEnd}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-foreground">{getNodeIcon(node.type)}</div>
          <h3 className="font-medium text-sm truncate">{node.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(node.status)}
          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-background/80">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Node Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Run</DropdownMenuItem>
                <DropdownMenuItem>View Logs</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>
      </div>
      {node.description && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{node.description}</p>
      )}
      {isHovered && node.status !== "idle" && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-background rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full",
              node.status === "running" ? "bg-blue-500 animate-pulse" : 
              node.status === "success" ? "bg-green-500" :
              node.status === "failed" ? "bg-red-500" :
              node.status === "pending" ? "bg-yellow-500" : "bg-gray-500"
            )}
            style={{ width: node.status === "success" ? "100%" : "60%" }}
          />
        </div>
      )}
    </div>
  );
};

export default WorkflowNode;
