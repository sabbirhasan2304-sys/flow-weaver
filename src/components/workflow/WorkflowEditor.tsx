import { ReactFlowProvider } from '@xyflow/react';
import { NodePalette } from './NodePalette';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { AIAssistant } from './AIAssistant';
import { AIWorkflowBuilder } from './AIWorkflowBuilder';
import { ExecutionPanel } from './ExecutionPanel';
import { WorkflowImportExport } from './WorkflowImportExport';
import { ApiTestPanel } from './ApiTestPanel';
import { VersionHistory } from './VersionHistory';
import { ScheduleDialog } from './ScheduleDialog';
import { WebhookUrlCard } from './WebhookUrlCard';
import { NodeDashboard } from './NodeDashboard';
import { useWorkflowStore } from '@/stores/workflowStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

interface WorkflowEditorProps {
  workflowId?: string;
  workflowName?: string;
  initialData?: { nodes?: any[]; edges?: any[] };
  onSave?: (data: any) => void;
}

export function WorkflowEditor({ workflowId, workflowName, initialData, onSave }: WorkflowEditorProps) {
  const { selectedNode, nodes } = useWorkflowStore();
  
  // Check if workflow has a webhook trigger node
  const hasWebhookTrigger = nodes.some(n => n.data?.type === 'webhook');

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <ReactFlowProvider>
      <div className="h-full w-full relative bg-canvas-background">
        {/* Top toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-card/90 backdrop-blur-xl rounded-xl border border-border/50 px-2 py-1.5 shadow-xl shadow-black/10">
          <AIWorkflowBuilder />
          <WorkflowImportExport workflowName={workflowName} />
          {workflowId && <ExecutionPanel workflowId={workflowId} />}
          {workflowId && <VersionHistory workflowId={workflowId} />}
          {workflowId && <ScheduleDialog workflowId={workflowId} />}
          <ApiTestPanel />
          <div className="h-6 w-px bg-border/40 mx-0.5" />
          <ThemeToggle />
        </div>

        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Node Palette */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <NodePalette onDragStart={handleDragStart} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Center Panel - Canvas */}
          <ResizablePanel defaultSize={selectedNode ? 55 : 80}>
            <WorkflowCanvas workflowId={workflowId} initialData={initialData} onSave={onSave} />
            
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

        {/* Webhook URL Card */}
        {workflowId && hasWebhookTrigger && (
          <div className="absolute bottom-4 right-4 z-10 w-[360px]">
            <WebhookUrlCard workflowId={workflowId} />
          </div>
        )}

        {/* AI Assistant */}
        <AIAssistant />
      </div>
    </ReactFlowProvider>
  );
}
