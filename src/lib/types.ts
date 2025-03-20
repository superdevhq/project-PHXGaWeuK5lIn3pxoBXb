
// Node position type
export interface Position {
  x: number;
  y: number;
}

// Node configuration type
export interface NodeConfig {
  [key: string]: any;
}

// Workflow node type
export interface WorkflowNode {
  id: string;
  name: string;
  type: "trigger" | "task" | "decision" | "action";
  status: "idle" | "running" | "success" | "failed" | "pending";
  position: Position;
  config: NodeConfig;
  dependencies: string[];
  description?: string;
}

// Workflow edge type
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

// Workflow schedule type
export interface WorkflowSchedule {
  cron: string;
  timezone?: string;
  enabled?: boolean;
}

// Workflow type
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  schedule?: WorkflowSchedule;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  status: "active" | "inactive" | "running" | "failed";
}

// Workflow run node status
export interface NodeRun {
  nodeId: string;
  startTime: string;
  endTime?: string;
  status: "running" | "success" | "failed";
  output?: any;
  error?: string;
}

// Workflow run type
export interface WorkflowRun {
  id: string;
  workflowId: string;
  version: string;
  startTime: string;
  endTime?: string;
  status: "running" | "success" | "failed" | "cancelled";
  nodeRuns: NodeRun[];
}

// User type
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}
