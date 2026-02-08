import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { NodeData } from '@/stores/workflowStore';
import { CATEGORY_COLORS, NODE_CATEGORIES } from '@/types/nodes';
import { getNodeDefinition } from '@/data/nodeDefinitions';
import { 
  Webhook, Clock, Play, Mail, MessageSquare, Send, 
  FileSpreadsheet, Database, Code, GitBranch, Repeat, 
  Filter, Merge, Split, Bot, Brain, Sparkles, 
  Globe, FileJson, Zap, Bell, Upload, Download,
  Cloud, Server, Lock, Shield, Coins, BarChart,
  Image, Video, Mic, Settings, Puzzle,
  CheckCircle2, XCircle, Loader2, AlertTriangle, Key
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Webhook, Clock, Play, Mail, MessageSquare, Send,
  FileSpreadsheet, Database, Code, GitBranch, Repeat,
  Filter, Merge, Split, Bot, Brain, Sparkles,
  Globe, FileJson, Zap, Bell, Upload, Download,
  Cloud, Server, Lock, Shield, Coins, BarChart,
  Image, Video, Mic, Settings, Puzzle,
};

interface WorkflowNodeProps {
  data: NodeData;
  selected?: boolean;
}

function WorkflowNodeComponent({ data, selected }: WorkflowNodeProps) {
  const definition = getNodeDefinition(data.type);
  const categoryColor = CATEGORY_COLORS[data.category] || '#6366f1';
  const IconComponent = iconMap[data.icon || 'Puzzle'] || Puzzle;
  
  const getStatusIcon = () => {
    if (!data.executionResult) return null;
    
    switch (data.executionResult.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      default:
        return null;
    }
  };
  
  const getCredentialStatusIcon = () => {
    if (!data.credentialStatus) return null;
    
    switch (data.credentialStatus.status) {
      case 'testing':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-warning/20 border border-warning">
                  <Loader2 className="h-3 w-3 text-warning animate-spin" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Testing credential...
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'success':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-success/20 border border-success">
                  <Key className="h-3 w-3 text-success" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {data.credentialStatus.message || 'Credential verified'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'error':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-destructive/20 border border-destructive animate-pulse">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[200px]">
                <span className="font-medium text-destructive">Credential Error:</span>
                <br />
                {data.credentialStatus.message || 'Invalid or expired credential'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card shadow-md transition-all duration-200 min-w-[180px]',
        'hover:shadow-lg hover:border-primary/30',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl',
        data.isExecuting && 'node-executing',
        data.credentialStatus?.status === 'error' && 'ring-1 ring-destructive/50'
      )}
      style={{
        borderColor: selected ? categoryColor : undefined,
        borderLeftWidth: '4px',
        borderLeftColor: categoryColor,
      }}
    >
      {/* Credential status badge */}
      {getCredentialStatusIcon()}
      
      {/* Input handles */}
      {definition?.inputs.map((input, index) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={input.name}
          className="!bg-primary"
          style={{
            top: `${((index + 1) / (definition.inputs.length + 1)) * 100}%`,
          }}
        />
      ))}
      
      {/* No inputs - single handle */}
      {(!definition?.inputs || definition.inputs.length === 0) && data.category !== NODE_CATEGORIES.TRIGGERS && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-primary"
        />
      )}
      
      {/* Node content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <IconComponent 
              className="h-4 w-4" 
              style={{ color: categoryColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium truncate">
                {data.label}
              </span>
              {getStatusIcon()}
            </div>
            <span className="text-xs text-muted-foreground truncate block">
              {data.category}
            </span>
          </div>
        </div>
        
        {/* Configuration preview */}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="truncate">{key}:</span>
                  <span className="truncate font-mono text-foreground">
                    {typeof value === 'string' ? value.slice(0, 15) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Output handles */}
      {definition?.outputs.map((output, index) => (
        <Handle
          key={`output-${output.name}`}
          type="source"
          position={Position.Right}
          id={output.name}
          className="!bg-primary"
          style={{
            top: `${((index + 1) / (definition.outputs.length + 1)) * 100}%`,
          }}
        />
      ))}
      
      {/* No outputs - single handle */}
      {(!definition?.outputs || definition.outputs.length === 0) && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-primary"
        />
      )}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
