
import { useState, useEffect } from "react";
import { WorkflowRun } from "@/lib/types";
import { fetchWorkflowRuns } from "@/services/workflowService";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface WorkflowRunsListProps {
  workflowId: string;
}

const WorkflowRunsList = ({ workflowId }: WorkflowRunsListProps) => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await fetchWorkflowRuns(workflowId);
      setRuns(data);
    } catch (error) {
      console.error("Error loading workflow runs:", error);
      toast.error("Failed to load workflow runs");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadRuns();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [workflowId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) {
      return "Running...";
    }
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${Math.floor(durationMs / 1000)}s`;
    } else if (durationMs < 3600000) {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(durationMs / 3600000);
      const minutes = Math.floor((durationMs % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-lg font-medium">Execution History</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {runs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No execution history found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <Badge 
                        variant={
                          run.status === "success" ? "success" :
                          run.status === "failed" ? "destructive" :
                          run.status === "cancelled" ? "outline" :
                          "default"
                        }
                      >
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(run.startTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {formatDuration(run.startTime, run.endTime)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">v{run.version}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default WorkflowRunsList;
