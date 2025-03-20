
import { NodeRun } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NodeRunsListProps {
  nodeRuns: NodeRun[];
}

const NodeRunsList = ({ nodeRuns }: NodeRunsListProps) => {
  if (!nodeRuns || nodeRuns.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No node execution data available
      </div>
    );
  }

  // Sort node runs by start time
  const sortedRuns = [...nodeRuns].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <div className="space-y-3">
      {sortedRuns.map((nodeRun) => (
        <Card key={nodeRun.nodeId} className="overflow-hidden">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{nodeRun.nodeId}</CardTitle>
              <StatusBadge status={nodeRun.status} />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Started:</p>
                <p>{formatDistanceToNow(new Date(nodeRun.startTime))} ago</p>
              </div>
              {nodeRun.endTime && (
                <div>
                  <p className="text-muted-foreground">Completed:</p>
                  <p>{formatDistanceToNow(new Date(nodeRun.endTime))} ago</p>
                </div>
              )}
            </div>
            
            {nodeRun.output && (
              <div className="mt-2">
                <p className="text-muted-foreground mb-1">Output:</p>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(nodeRun.output, null, 2)}
                </pre>
              </div>
            )}
            
            {nodeRun.error && (
              <div className="mt-2">
                <p className="text-red-500 mb-1">Error:</p>
                <pre className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs overflow-x-auto text-red-600 dark:text-red-400">
                  {nodeRun.error}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Success
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'running':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Running
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
  }
};

export default NodeRunsList;
