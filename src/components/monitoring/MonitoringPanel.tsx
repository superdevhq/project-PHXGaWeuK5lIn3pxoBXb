
import { useState } from "react";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Play, 
  RefreshCw, 
  Terminal, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowNode as WorkflowNodeType, NodeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MonitoringPanelProps {
  selectedNode: WorkflowNodeType | null;
  onClose: () => void;
}

const MonitoringPanel = ({ selectedNode, onClose }: MonitoringPanelProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case "running":
        return (
          <div className="flex items-center gap-1 text-blue-500 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full text-xs">
            <Play className="h-3 w-3" />
            <span>Running</span>
          </div>
        );
      case "success":
        return (
          <div className="flex items-center gap-1 text-green-500 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="h-3 w-3" />
            <span>Success</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1 text-red-500 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1 text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs">
            <span>Idle</span>
          </div>
        );
    }
  };

  if (!selectedNode) return null;

  return (
    <div className="border-l bg-background w-96 h-full flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Node Details</h3>
          {getStatusBadge(selectedNode.status)}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{selectedNode.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedNode.description || "No description provided"}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="text-xs bg-muted px-2 py-1 rounded-full">
            Type: {selectedNode.type}
          </div>
          {selectedNode.retries !== undefined && (
            <div className="text-xs bg-muted px-2 py-1 rounded-full">
              Retries: {selectedNode.retries}
            </div>
          )}
          {selectedNode.timeout !== undefined && (
            <div className="text-xs bg-muted px-2 py-1 rounded-full">
              Timeout: {selectedNode.timeout}s
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="mt-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="overview" className="h-full p-0 m-0">
              <div className="p-4">
                <div className="flex justify-between mb-4">
                  <h4 className="text-sm font-medium">Execution Details</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-1"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                    <span className="text-xs">Refresh</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Last Run</div>
                    <div className="text-sm">Today, 14:32:45</div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Duration</div>
                    <div className="text-sm">1m 23s</div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Dependencies</div>
                    <div className="text-sm">
                      {selectedNode.dependencies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedNode.dependencies.map((dep) => (
                            <span key={dep} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                              {dep}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "None"
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Metrics</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-background rounded p-2">
                        <div className="text-xs text-muted-foreground">Memory</div>
                        <div className="text-sm font-medium">256 MB</div>
                      </div>
                      <div className="bg-background rounded p-2">
                        <div className="text-xs text-muted-foreground">CPU</div>
                        <div className="text-sm font-medium">0.5 cores</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="h-full p-0 m-0">
              <div className="p-4">
                <div className="flex justify-between mb-4">
                  <h4 className="text-sm font-medium">Logs</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-1"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                    <span className="text-xs">Refresh</span>
                  </Button>
                </div>

                <div className="bg-slate-950 text-slate-50 rounded-lg p-3 font-mono text-xs h-[calc(100vh-300px)] overflow-auto">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Terminal className="h-4 w-4" />
                    <span>Log output</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">[14:32:40] Starting task execution</div>
                    <div className="text-slate-400">[14:32:41] Loading dependencies</div>
                    <div className="text-slate-400">[14:32:42] Connecting to database</div>
                    <div className="text-green-400">[14:32:43] Connection successful</div>
                    <div className="text-slate-400">[14:32:44] Processing data</div>
                    <div className="text-yellow-400">[14:32:45] Warning: Rate limit approaching</div>
                    <div className="text-slate-400">[14:32:46] Processed 1000 records</div>
                    <div className="text-slate-400">[14:33:01] Processed 2000 records</div>
                    <div className="text-slate-400">[14:33:15] Processed 3000 records</div>
                    <div className="text-slate-400">[14:33:30] Finalizing results</div>
                    <div className="text-slate-400">[14:33:45] Saving output</div>
                    <div className="text-green-400">[14:34:03] Task completed successfully</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="h-full p-0 m-0">
              <div className="p-4">
                <div className="flex justify-between mb-4">
                  <h4 className="text-sm font-medium">Configuration</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-1"
                  >
                    <span className="text-xs">Edit</span>
                  </Button>
                </div>

                <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs overflow-auto">
                  <pre className="text-slate-50">
{JSON.stringify(selectedNode.config, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="border-t p-4 flex justify-between">
        <Button variant="outline" size="sm">
          View History
        </Button>
        <Button size="sm">
          Run Node
        </Button>
      </div>
    </div>
  );
};

export default MonitoringPanel;
