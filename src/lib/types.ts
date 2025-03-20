
export type NodeStatus = 
  | 'idle' 
  | 'running' 
  | 'success' 
  | 'failed' 
  | 'pending' 
  | 'skipped';

export type NodeType = 
  | 'task' 
  | 'container' 
  | 'decision' 
  | 'trigger' 
  | 'sensor' 
  | 'resource';

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  position: {
    x: number;
    y: number;
  };
  config: Record<string, any>;
  dependencies: string[];
  retries?: number;
  timeout?: number;
  description?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  schedule?: {
    cron?: string;
    interval?: string;
    startDate?: string;
    endDate?: string;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  status: 'active' | 'inactive' | 'running' | 'failed';
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  version: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  nodeRuns: {
    nodeId: string;
    startTime: string;
    endTime?: string;
    status: NodeStatus;
    logs?: string[];
    metrics?: Record<string, number>;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'developer' | 'viewer';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
