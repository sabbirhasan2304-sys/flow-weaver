import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
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
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'error':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <XCircle className="h-4 w-4 text-red-400" />
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
        return <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />;
      default:
        return null;
    }
  };
  
  const getCredentialStatusIcon = () => {
    if (!data.credentialStatus) return null;
    const configs: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
      testing: {
        bg: 'bg-amber-500/20', border: 'border-amber-500/50',
        icon: <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />,
      },
      success: {
        bg: 'bg-emerald-500/20', border: 'border-emerald-500/50',
        icon: <Key className="h-3 w-3 text-emerald-400" />,
      },
      error: {
        bg: 'bg-red-500/20', border: 'border-red-500/50 animate-pulse',
        icon: <AlertTriangle className="h-3 w-3 text-red-400" />,
      },
    };
    const cfg = configs[data.credentialStatus.status];
    if (!cfg) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full border", cfg.bg, cfg.border)}>
              {cfg.icon}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {data.credentialStatus.message || data.credentialStatus.status}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getErrorHandlingBadges = () => {
    if (!data.errorHandling) return null;
    const badges = [];
    if (data.errorHandling.retryOnFail) {
      badges.push(
        <TooltipProvider key="retry">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                <RotateCcw className="h-2.5 w-2.5 text-amber-400" />
                <span className="text-[9px] text-amber-400 font-semibold">{data.errorHandling.maxRetries || 3}×</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Retry up to {data.errorHandling.maxRetries || 3} times
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
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <SkipForward className="h-2.5 w-2.5 text-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Continue on failure
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badges.length > 0 ? <div className="flex gap-1 mt-2">{badges}</div> : null;
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border shadow-lg transition-all duration-300 min-w-[200px] max-w-[260px]',
        'bg-card/90 backdrop-blur-md',
        'hover:shadow-xl hover:-translate-y-0.5',
        selected && 'ring-2 ring-primary/70 ring-offset-2 ring-offset-background shadow-2xl shadow-primary/10',
        data.isExecuting && 'node-executing',
        isError && 'ring-2 ring-red-500/70 ring-offset-1 ring-offset-background border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
        isSuccess && 'border-emerald-500/40 shadow-emerald-500/5',
        isPending && 'border-amber-500/40',
        !isError && !selected && 'border-border/60 hover:border-primary/40'
      )}
    >
      {/* Gradient accent top bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-80"
        style={{ background: isError ? 'linear-gradient(90deg, #ef4444, #dc2626)' : `linear-gradient(90deg, ${categoryColor}, ${categoryColor}99)` }}
      />
      
      {getCredentialStatusIcon()}
      
      {/* Input handles */}
      {definition?.inputs.map((input, index) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={input.name}
          className={cn("!w-3 !h-3 !border-2 !border-background !rounded-full transition-all", isError ? "!bg-red-500" : "!bg-primary")}
          style={{ top: `${((index + 1) / (definition.inputs.length + 1)) * 100}%` }}
        />
      ))}
      {(!definition?.inputs || definition.inputs.length === 0) && data.category !== NODE_CATEGORIES.TRIGGERS && (
        <Handle type="target" position={Position.Left} className={cn("!w-3 !h-3 !border-2 !border-background !rounded-full", isError ? "!bg-red-500" : "!bg-primary")} />
      )}
      
      {/* Node content */}
      <div className="p-3.5 pt-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg shrink-0 transition-colors shadow-sm",
              isError && "bg-red-500/15"
            )}
            style={{ 
              backgroundColor: isError ? undefined : `${categoryColor}15`,
              boxShadow: isError ? undefined : `0 2px 8px ${categoryColor}15`
            }}
          >
            <IconComponent 
              className={cn("h-5 w-5", isError && "text-red-400")}
              style={{ color: isError ? undefined : categoryColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-sm font-semibold truncate leading-tight",
                isError && "text-red-400"
              )}>
                {data.label}
              </span>
              {getStatusIcon()}
            </div>
            <span className="text-[11px] text-muted-foreground/80 truncate block mt-0.5 font-medium">
              {data.category}
            </span>
          </div>
        </div>
        
        {/* Error message banner */}
        {isError && data.executionResult?.error && (
          <div className="mt-2.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-[10px] text-red-400 font-medium leading-tight line-clamp-2">
              ⚠ {data.executionResult.error}
            </p>
          </div>
        )}

        {getErrorHandlingBadges()}
        
        {/* Config preview */}
        {data.config && Object.keys(data.config).length > 0 && !isError && (
          <div className="mt-2.5 pt-2.5 border-t border-border/40">
            <div className="text-[11px] text-muted-foreground space-y-1">
              {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="truncate opacity-70">{key}</span>
                  <span className="truncate font-mono text-foreground/80 text-[10px]">
                    {typeof value === 'string' ? value.slice(0, 15) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* I/O Data Preview */}
        {data.executionResult?.data && (
          <div className="mt-2.5 pt-2.5 border-t border-border/40">
            <button
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground w-full transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowIOPreview(!showIOPreview); }}
            >
              {showIOPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="font-medium">{isSuccess ? 'Output' : 'Data'} Preview</span>
              <span className="ml-auto text-[9px] bg-muted/80 px-1.5 py-0.5 rounded-full font-mono">
                {typeof data.executionResult.data === 'object' 
                  ? `${Object.keys(data.executionResult.data as object).length} fields`
                  : typeof data.executionResult.data}
              </span>
            </button>
            {showIOPreview && (
              <pre className="mt-1.5 p-2 rounded-lg bg-muted/50 text-[9px] font-mono overflow-auto max-h-[80px] whitespace-pre-wrap break-all border border-border/30">
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
          className={cn("!w-3 !h-3 !border-2 !border-background !rounded-full transition-all", isError ? "!bg-red-500" : "!bg-primary")}
          style={{ top: `${((index + 1) / (definition.outputs.length + 1)) * 100}%` }}
        />
      ))}
      {(!definition?.outputs || definition.outputs.length === 0) && (
        <Handle type="source" position={Position.Right} className={cn("!w-3 !h-3 !border-2 !border-background !rounded-full", isError ? "!bg-red-500" : "!bg-primary")} />
      )}

      {/* Status badge at bottom */}
      {data.executionResult && (
        <div className={cn(
          "absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md border",
          isSuccess && "bg-emerald-500/90 text-white border-emerald-400/30",
          isError && "bg-red-500/90 text-white border-red-400/30",
          isPending && "bg-amber-500/90 text-white border-amber-400/30",
        )}>
          {isSuccess ? '✓ Done' : isError ? '✗ Error' : '● Running'}
        </div>
      )}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
