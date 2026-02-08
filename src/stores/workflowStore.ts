import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';

export interface NodeData extends Record<string, unknown> {
  label: string;
  type: string;
  category: string;
  icon?: string;
  config?: Record<string, unknown>;
  inputs?: string[];
  outputs?: string[];
  isExecuting?: boolean;
  executionResult?: {
    status: 'success' | 'error' | 'pending';
    data?: unknown;
    error?: string;
  };
  credentialStatus?: {
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  };
}

export type WorkflowNode = Node<NodeData>;
export type WorkflowEdge = Edge;

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
  isExecuting: boolean;
  executionLogs: Array<{
    nodeId: string;
    timestamp: Date;
    message: string;
    level: 'info' | 'error' | 'success';
  }>;
  
  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (node: WorkflowNode | null) => void;
  
  // Execution
  setExecuting: (executing: boolean) => void;
  addExecutionLog: (log: { nodeId: string; message: string; level: 'info' | 'error' | 'success' }) => void;
  clearExecutionLogs: () => void;
  
  // Workflow management
  clearWorkflow: () => void;
  loadWorkflow: (data: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  isExecuting: false,
  executionLogs: [],
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(
        { 
          ...connection, 
          animated: true,
          style: { stroke: 'hsl(var(--primary))' }
        }, 
        get().edges
      ),
    });
  },
  
  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },
  
  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },
  
  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
    });
  },
  
  selectNode: (node) => set({ selectedNode: node }),
  
  setExecuting: (executing) => set({ isExecuting: executing }),
  
  addExecutionLog: (log) => {
    set({
      executionLogs: [
        ...get().executionLogs,
        { ...log, timestamp: new Date() },
      ],
    });
  },
  
  clearExecutionLogs: () => set({ executionLogs: [] }),
  
  clearWorkflow: () => set({ nodes: [], edges: [], selectedNode: null, executionLogs: [] }),
  
  loadWorkflow: (data) => set({ nodes: data.nodes, edges: data.edges }),
}));
