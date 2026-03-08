import { memo, useState } from 'react';
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
  CheckCircle2, XCircle, Loader2, AlertTriangle, Key,
  ChevronDown, ChevronUp, RotateCcw, SkipForward
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
  const [showIOPreview, setShowIOPreview] = useState(false);
  const definition = getNodeDefinition(data.type);
  const categoryColor = CATEGORY_COLORS[data.category] || '#6366f1';
  const IconComponent = iconMap[data.icon || 'Puzzle'] || Puzzle;
  
  const isError = data.executionResult?.status === 'error';
  const isSuccess = data.executionResult?.status === 'success';
  const isPending = data.executionResult?.status === 'pending';
  
  const getStatusIcon = () => {
    if (!data.executionResult) return null;
    
    switch (data.executionResult.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <XCircle className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <div className="space-y-1">
                  <p className="font-semibold text-destructive text-xs">Execution Error</p>
                  <p className="text-xs">{data.executionResult.error || 'Unknown error'}</p>
                  {data.errorHandling?.continueOnFail && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <SkipForward className="h-3 w-3" /> Continue on fail enabled
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
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

  // Error handling badges
  const getErrorHandlingBadges = () => {
    if (!data.errorHandling) return null;
    const badges = [];
    if (data.errorHandling.retryOnFail) {
      badges.push(
        <TooltipProvider key="retry">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-warning/10 border border-warning/20">
                <RotateCcw className="h-2.5 w-2.5 text-warning" />
                <span className="text-[9px] text-warning font-medium">{data.errorHandling.maxRetries || 3}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Retry up to {data.errorHandling.maxRetries || 3} times on failure
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (data.errorHandling.continueOnFail) {
      badges.push(
        <TooltipProvider key="continue">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-primary/10 border border-primary/20">
                <SkipForward className="h-2.5 w-2.5 text-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Continue workflow on failure
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badges.length > 0 ? <div className="flex gap-1 mt-1">{badges}</div> : null;
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card shadow-md transition-all duration-200 min-w-[180px]',
        'hover:shadow-lg hover:border-primary/30',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl',
        data.isExecuting && 'node-executing',
        // n8n-style: red border + glow on error
        isError && 'ring-2 ring-destructive ring-offset-1 ring-offset-background border-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        isSuccess && 'border-success/50',
        isPending && 'border-warning/50',
        data.credentialStatus?.status === 'error' && !isError && 'ring-1 ring-destructive/50'
      )}
      style={{
        borderColor: isError ? undefined : (selected ? categoryColor : undefined),
        borderLeftWidth: '4px',
        borderLeftColor: isError ? 'hsl(var(--destructive))' : categoryColor,
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
          className={cn("!bg-primary", isError && "!bg-destructive")}
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
          className={cn("!bg-primary", isError && "!bg-destructive")}
        />
      )}
      
      {/* Node content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              isError && "bg-destructive/20"
            )}
            style={{ backgroundColor: isError ? undefined : `${categoryColor}20` }}
          >
            <IconComponent 
              className={cn("h-4 w-4", isError && "text-destructive")}
              style={{ color: isError ? undefined : categoryColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={cn("text-sm font-medium truncate", isError && "text-destructive")}>
                {data.label}
              </span>
              {getStatusIcon()}
            </div>
            <span className="text-xs text-muted-foreground truncate block">
              {data.category}
            </span>
          </div>
        </div>
        
        {/* Error message banner - like n8n */}
        {isError && data.executionResult?.error && (
          <div className="mt-2 p-1.5 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-[10px] text-destructive font-medium truncate">
              ⚠ {data.executionResult.error}
            </p>
          </div>
        )}

        {/* Error handling badges */}
        {getErrorHandlingBadges()}
        
        {/* Configuration preview */}
        {data.config && Object.keys(data.config).length > 0 && !isError && (
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

        {/* I/O Data Preview Toggle - like n8n */}
        {data.executionResult?.data && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground w-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowIOPreview(!showIOPreview);
              }}
            >
              {showIOPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span>{isSuccess ? 'Output' : 'Data'} Preview</span>
              <span className="ml-auto text-[9px] bg-muted px-1 rounded">
                {typeof data.executionResult.data === 'object' 
                  ? `${Object.keys(data.executionResult.data as object).length} fields`
                  : typeof data.executionResult.data}
              </span>
            </button>
            {showIOPreview && (
              <pre className="mt-1 p-1.5 rounded bg-muted text-[9px] font-mono overflow-auto max-h-[80px] whitespace-pre-wrap break-all">
                {JSON.stringify(data.executionResult.data, null, 1)}
              </pre>
            )}
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
          className={cn("!bg-primary", isError && "!bg-destructive")}
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
          className={cn("!bg-primary", isError && "!bg-destructive")}
        />
      )}

      {/* Execution count badge */}
      {data.executionResult && (
        <div className={cn(
          "absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
          isSuccess && "bg-success text-success-foreground",
          isError && "bg-destructive text-destructive-foreground",
          isPending && "bg-warning text-warning-foreground",
        )}>
          {isSuccess ? '✓' : isError ? '✗' : '...'}
        </div>
      )}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
