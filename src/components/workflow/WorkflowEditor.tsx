import { ReactFlowProvider } from '@xyflow/react';
import { NodePalette } from './NodePalette';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { useWorkflowStore } from '@/stores/workflowStore';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

interface WorkflowEditorProps {
  workflowId?: string;
  workflowName?: string;
  onSave?: (data: any) => void;
}

export function WorkflowEditor({ workflowId, workflowName, onSave }: WorkflowEditorProps) {
  const { selectedNode } = useWorkflowStore();
  
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Node Palette */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <NodePalette onDragStart={handleDragStart} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Center Panel - Canvas */}
          <ResizablePanel defaultSize={selectedNode ? 55 : 80}>
            <WorkflowCanvas workflowId={workflowId} onSave={onSave} />
          </ResizablePanel>
          
          {/* Right Panel - Node Config (conditional) */}
          {selectedNode && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <NodeConfigPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </ReactFlowProvider>
  );
}
