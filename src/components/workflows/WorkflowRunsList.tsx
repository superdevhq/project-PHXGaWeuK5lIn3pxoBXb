
import { useState, useEffect } from "react";
import { fetchWorkflowRuns, createWorkflowRun } from "@/services/workflowService";
import { WorkflowRun } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import NodeRunsList from "./NodeRunsList";

interface WorkflowRunsListProps {
  workflowId: string;
}

const WorkflowRunsList = ({ workflowId }: WorkflowRunsListProps) => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openRunId, setOpenRunId] = useState<string | null>(null);

  // Load workflow runs
  useEffect(() => {
    loadRuns();
  }, [workflowId]);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await fetchWorkflowRuns(workflowId);
      setRuns(data);
    } catch (error) {
      console.error("Error loading workflow runs:", error);
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

  const handleExecute = async () => {
    try {
      setExecuting(true);
      // Get the latest workflow version
      const latestRun = runs[0];
      const version = latestRun ? latestRun.version : "1.0.0";
      
      const newRun = await createWorkflowRun(workflowId, version);
      if (newRun) {
        setRuns(prev => [newRun, ...prev]);
        setOpenRunId(newRun.id);
      }
    } finally {
      setExecuting(false);
    }
  };

  const toggleRunDetails = (runId: string) => {
    setOpenRunId(openRunId === runId ? null : runId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Execution History</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button 
            size="sm" 
            onClick={handleExecute}
            disabled={executing}
          >
            {executing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="ml-2">Execute</span>
          </Button>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">No execution history found</p>
          <Button onClick={handleExecute} disabled={executing}>
            {executing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Execute Workflow
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <Collapsible 
              key={run.id} 
              open={openRunId === run.id}
              onOpenChange={() => toggleRunDetails(run.id)}
            >
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">
                      Run {run.id.substring(0, 8)}...
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <RunStatusBadge status={run.status} />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {openRunId === run.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Started:</p>
                      <p>{new Date(run.startTime).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        ({formatDistanceToNow(new Date(run.startTime))} ago)
                      </p>
                    </div>
                    {run.endTime && (
                      <div>
                        <p className="text-muted-foreground">Completed:</p>
                        <p>{new Date(run.endTime).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(new Date(run.endTime))} ago)
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CollapsibleContent>
                  <CardContent className="border-t p-4">
                    <h3 className="text-sm font-medium mb-3">Node Executions</h3>
                    <NodeRunsList nodeRuns={run.nodeRuns || []} />
                  </CardContent>
                </CollapsibleContent>
                <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                  Version: {run.version}
                </CardFooter>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};

const RunStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'success':
      return <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Success</div>;
    case 'failed':
      return <div className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Failed</div>;
    case 'running':
      return (
        <div className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Running
        </div>
      );
    case 'cancelled':
      return <div className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Cancelled</div>;
    default:
      return <div className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">{status}</div>;
  }
};

export default WorkflowRunsList;
