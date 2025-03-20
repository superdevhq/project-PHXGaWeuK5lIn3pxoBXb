
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWorkflowRuns } from "@/services/workflowService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NodeRunsList } from "./NodeRunsList";
import { ProcessedDataTable } from "./ProcessedDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function WorkflowRunDetails({ workflowId, runId }: { workflowId: string; runId: string }) {
  const [activeTab, setActiveTab] = useState("nodes");

  // Fetch workflow runs
  const { data: runs, isLoading, error } = useQuery({
    queryKey: ["workflow-runs", workflowId],
    queryFn: () => fetchWorkflowRuns(workflowId),
  });

  // Find the specific run
  const run = runs?.find((r) => r.id === runId);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy HH:mm:ss");
    } catch (e) {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "running":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Workflow Run Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading workflow run: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (!run) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Workflow Run Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-amber-500">Workflow run not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Workflow Run Details</CardTitle>
        <div className="flex flex-col space-y-1 text-sm text-muted-foreground md:flex-row md:space-x-4 md:space-y-0">
          <div>
            <span className="font-semibold">ID:</span> {run.id}
          </div>
          <div>
            <span className="font-semibold">Version:</span> {run.version}
          </div>
          <div>
            <span className="font-semibold">Started:</span> {formatDate(run.startTime)}
          </div>
          {run.endTime && (
            <div>
              <span className="font-semibold">Ended:</span> {formatDate(run.endTime)}
            </div>
          )}
          <div>
            <span className="font-semibold">Status:</span>{" "}
            <span className={getStatusColor(run.status)}>{run.status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="nodes">Node Runs</TabsTrigger>
            <TabsTrigger value="data">Processed Data</TabsTrigger>
          </TabsList>
          <TabsContent value="nodes">
            <NodeRunsList nodeRuns={run.nodeRuns} />
          </TabsContent>
          <TabsContent value="data">
            <ProcessedDataTable workflowRunId={run.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
