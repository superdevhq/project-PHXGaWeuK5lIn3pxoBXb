
// Workflow types
export type WorkflowNode = {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  position: { x: number; y: number };
  config: Record<string, any>;
  dependencies: string[];
  description?: string;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  condition?: string;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  schedule?: { cron: string };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  status: 'active' | 'inactive' | 'running' | 'failed';
};

export type NodeRun = {
  nodeId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed';
  output?: any;
  error?: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  version: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  nodeRuns: NodeRun[];
};
