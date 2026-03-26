import { useCallback, useRef, DragEvent, useState, memo, useEffect } from 'react';
import { setCanvasSaveRef } from '@/pages/WorkflowPage';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  Panel,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore, WorkflowNode as WorkflowNodeType, NodeData } from '@/stores/workflowStore';
import { WorkflowNode } from './WorkflowNode';
import { StickyNote } from './StickyNote';
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
import { cn } from '@/lib/utils';

const nodeTypes = {
  workflowNode: WorkflowNode,
  stickyNote: StickyNote,
};

interface WorkflowCanvasProps {
  workflowId?: string;
  initialData?: { nodes?: any[]; edges?: any[] };
  onSave?: (data: { nodes: WorkflowNodeType[]; edges: any[] }) => void;
}

export function WorkflowCanvas({ workflowId, initialData, onSave }: WorkflowCanvasProps) {
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
    loadWorkflow,
    lastLoadedAt,
  } = useWorkflowStore();
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load initial workflow data when component mounts
  useEffect(() => {
    if (initialData && !hasLoaded) {
      const nodesToLoad = initialData.nodes || [];
      const edgesToLoad = initialData.edges || [];
      
      // Transform nodes to ensure they have the correct format
      const formattedNodes: WorkflowNodeType[] = nodesToLoad.map((node: any) => ({
        id: node.id,
        type: node.type || 'workflowNode',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.data?.label || 'Node',
          type: node.data?.type || 'unknown',
          category: node.data?.category || '',
          icon: node.data?.icon,
          config: node.data?.config || {},
          service: node.data?.service,
        },
      }));
      
      // Format edges with proper styling
      const formattedEdges = edgesToLoad.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { stroke: 'hsl(var(--primary))' },
      }));
      
      if (formattedNodes.length > 0 || formattedEdges.length > 0) {
        loadWorkflow({ nodes: formattedNodes, edges: formattedEdges });
        setHasLoaded(true);
        
        // Fit view after loading with a small delay to ensure React Flow is ready
        setTimeout(() => {
          fitView({ padding: 0.2 });
        }, 100);
      }
    }
  }, [initialData, hasLoaded, loadWorkflow, fitView]);

  useEffect(() => {
    if (!lastLoadedAt) return;

    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 250 });
    }, 80);

    return () => clearTimeout(timer);
  }, [lastLoadedAt, fitView]);

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
    }
  }, [nodes, edges, onSave]);

  // Expose save to header button
  useEffect(() => {
    setCanvasSaveRef(handleSave);
    return () => setCanvasSaveRef(null);
  }, [handleSave]);

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
        snapGrid={[20, 20]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{ 
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2, stroke: 'hsl(var(--primary) / 0.4)' },
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-canvas-background"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          className="!bg-canvas-background"
          color="hsl(var(--canvas-dot))"
        />
        <Controls 
          className="!bg-card !border-border !shadow-lg"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as NodeData;
            return data.category === 'Triggers' ? 'hsl(var(--success))' : 'hsl(var(--info))';
          }}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card !border-border !rounded-lg !shadow-lg"
          pannable
          zoomable
        />
        
        {/* Toolbar */}
        <Panel position="top-right" className="flex gap-2">
          <div className="flex items-center gap-0.5 bg-card/90 backdrop-blur-xl rounded-xl border border-border/50 p-1 shadow-xl shadow-black/10">
            <Button
              variant={isExecuting ? "default" : "ghost"}
              size="icon"
              className={cn("h-8 w-8 rounded-lg", isExecuting && "bg-emerald-500 hover:bg-emerald-600 text-white")}
              onClick={handleRun}
            >
              {isExecuting ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="w-px h-5 bg-border/30" />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border/30" />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={!canUndo}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={!canRedo}>
              <Redo className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border/30" />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => zoomIn()}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => zoomOut()}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => fitView()}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            {selectedNode && (
              <>
                <div className="w-px h-5 bg-border/30" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
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
            <div className="bg-card/90 backdrop-blur-xl rounded-xl border border-border/50 px-5 py-2.5 shadow-xl flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-sm font-medium">Running workflow...</span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
