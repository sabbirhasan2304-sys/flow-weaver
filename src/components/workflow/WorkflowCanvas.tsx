import { useCallback, useRef, DragEvent, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore, WorkflowNode as WorkflowNodeType, NodeData } from '@/stores/workflowStore';
import { WorkflowNode } from './WorkflowNode';
import { getNodeDefinition, nodeDefinitions } from '@/data/nodeDefinitions';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Save, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

interface WorkflowCanvasProps {
  workflowId?: string;
  onSave?: (data: { nodes: WorkflowNodeType[]; edges: any[] }) => void;
}

export function WorkflowCanvas({ workflowId, onSave }: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    selectedNode,
    deleteNode,
    isExecuting,
    setExecuting,
  } = useWorkflowStore();
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const definition = getNodeDefinition(type);
      if (!definition) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNodeType = {
        id: `${type}-${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          label: definition.displayName,
          type: definition.type,
          category: definition.category,
          icon: definition.icon,
          config: {},
        },
      };

      addNode(newNode);
      toast.success(`Added ${definition.displayName} node`);
    },
    [screenToFlowPosition, addNode]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: WorkflowNodeType) => {
      selectNode(node);
    },
    [selectNode]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ nodes, edges });
      toast.success('Workflow saved');
    }
  }, [nodes, edges, onSave]);

  const handleRun = useCallback(() => {
    if (isExecuting) {
      setExecuting(false);
      toast.info('Workflow execution stopped');
    } else {
      setExecuting(true);
      toast.success('Running workflow...');
      
      // Simulate execution
      setTimeout(() => {
        setExecuting(false);
        toast.success('Workflow completed successfully');
      }, 3000);
    }
  }, [isExecuting, setExecuting]);

  const handleDelete = useCallback(() => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      toast.success('Node deleted');
    }
  }, [selectedNode, deleteNode]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-canvas-background"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          className="!bg-background"
        />
        <Controls className="!bg-card !border-border" />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as NodeData;
            return data.category === 'Triggers' ? '#10b981' : '#3b82f6';
          }}
          className="!bg-card !border-border"
        />
        
        {/* Toolbar */}
        <Panel position="top-right" className="flex gap-2">
          <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRun}
            >
              {isExecuting ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => zoomIn()}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => zoomOut()}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fitView()}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            {selectedNode && (
              <>
                <div className="w-px h-6 bg-border" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </Panel>
        
        {/* Execution status */}
        {isExecuting && (
          <Panel position="bottom-center">
            <div className="bg-card rounded-lg border border-border px-4 py-2 shadow-lg flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">Running workflow...</span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
