
import { useState } from "react";
import { Workflow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MoreVertical, 
  Play, 
  Edit, 
  Trash2, 
  Copy, 
  Search,
  Plus,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { deleteWorkflow, createWorkflowRun } from "@/services/workflowService";

interface WorkflowListProps {
  workflows: Workflow[];
  onWorkflowSelect: (workflow: Workflow) => void;
  onWorkflowDelete: (id: string) => void;
  onCreateWorkflow: () => void;
  selectedWorkflowId?: string;
  isCreating: boolean;
}

const WorkflowList = ({
  workflows,
  onWorkflowSelect,
  onWorkflowDelete,
  onCreateWorkflow,
  selectedWorkflowId,
  isCreating
}: WorkflowListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [runningWorkflows, setRunningWorkflows] = useState<string[]>([]);

  // Filter workflows based on search term
  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRunWorkflow = async (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (workflow.status === "running" || runningWorkflows.includes(workflow.id)) {
      toast.info("Workflow is already running");
      return;
    }
    
    try {
      setRunningWorkflows(prev => [...prev, workflow.id]);
      
      const run = await createWorkflowRun(workflow.id, workflow.version);
      
      if (run) {
        // Update the workflow in the list
        onWorkflowSelect({
          ...workflow,
          status: "running",
          lastRunAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error running workflow:", error);
    } finally {
      setRunningWorkflows(prev => prev.filter(id => id !== workflow.id));
    }
  };

  const handleDeleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this workflow?")) {
      const success = await deleteWorkflow(id);
      
      if (success) {
        onWorkflowDelete(id);
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          size="sm" 
          onClick={onCreateWorkflow}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No workflows found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {filteredWorkflows.map((workflow) => (
            <Card 
              key={workflow.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedWorkflowId === workflow.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onWorkflowSelect(workflow)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {workflow.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleRunWorkflow(workflow, e)}>
                        <Play className="h-4 w-4 mr-2" />
                        Run
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {workflow.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    {workflow.lastRunAt 
                      ? `Last run: ${new Date(workflow.lastRunAt).toLocaleString()}` 
                      : "Never run"}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center">
                    <Badge 
                      variant={
                        workflow.status === "running" ? "default" :
                        workflow.status === "active" ? "success" :
                        workflow.status === "failed" ? "destructive" :
                        "outline"
                      }
                      className="text-xs"
                    >
                      {workflow.status === "running" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white mr-1 animate-pulse"></span>
                      )}
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="ml-2 text-xs">
                      v{workflow.version}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => handleRunWorkflow(workflow, e)}
                    disabled={workflow.status === "running" || runningWorkflows.includes(workflow.id)}
                  >
                    {runningWorkflows.includes(workflow.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowList;
