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
  const isTrigger = data.category === NODE_CATEGORIES.TRIGGERS;
  
  const getStatusIcon = () => {
    if (!data.executionResult) return null;
    switch (data.executionResult.status) {
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />;
      case 'error':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <XCircle className="h-3.5 w-3.5 text-red-400 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px] bg-popover/95 backdrop-blur-lg border-border/60">
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
        return <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />;
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
            <div className={cn("absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full border shadow-lg", cfg.bg, cfg.border)}>
              {cfg.icon}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-popover/95 backdrop-blur-lg">
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
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <RotateCcw className="h-2.5 w-2.5 text-amber-400" />
                <span className="text-[9px] text-amber-400 font-bold">{data.errorHandling.maxRetries || 3}×</span>
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
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
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

  const handleStyle = (color: string, isErrorState: boolean) => ({
    background: isErrorState ? '#ef4444' : color,
    boxShadow: `0 0 0 3px ${isErrorState ? 'rgba(239,68,68,0.15)' : `${color}25`}, 0 0 8px ${isErrorState ? 'rgba(239,68,68,0.2)' : `${color}30`}`,
  });

  return (
    <div
      className={cn(
        'workflow-node group relative rounded-2xl border-[1.5px] transition-all duration-300 min-w-[220px] max-w-[270px]',
        'bg-card/95 backdrop-blur-xl',
        'hover:shadow-2xl hover:-translate-y-1',
        selected && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background shadow-[0_0_30px_-5px] shadow-primary/20',
        data.isExecuting && 'node-executing',
        isError && 'ring-2 ring-red-500/60 ring-offset-1 ring-offset-background border-red-500/40 shadow-[0_0_25px_-5px_rgba(239,68,68,0.25)]',
        isSuccess && 'border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]',
        isPending && 'border-amber-500/30 shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]',
        !isError && !selected && 'border-border/50 hover:border-border shadow-lg shadow-black/[0.06] dark:shadow-black/20'
      )}
    >
      {/* Gradient accent top bar with glow */}
      <div 
        className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full"
        style={{ 
          background: isError 
            ? 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)' 
            : `linear-gradient(90deg, ${categoryColor}90, ${categoryColor}, ${categoryColor}90)`,
          boxShadow: isError 
            ? '0 2px 12px rgba(239,68,68,0.3)' 
            : `0 2px 12px ${categoryColor}30`,
        }}
      />
      
      {getCredentialStatusIcon()}
      
      {/* Input handles */}
      {definition?.inputs.map((input, index) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={input.name}
          className="!w-3.5 !h-3.5 !border-[2.5px] !border-card !rounded-full !transition-all !duration-200 hover:!scale-125"
          style={{ 
            top: `${((index + 1) / (definition.inputs.length + 1)) * 100}%`,
            ...handleStyle(categoryColor, isError),
          }}
        />
      ))}
      {(!definition?.inputs || definition.inputs.length === 0) && !isTrigger && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-3.5 !h-3.5 !border-[2.5px] !border-card !rounded-full !transition-all !duration-200 hover:!scale-125"
          style={handleStyle(categoryColor, isError)}
        />
      )}
      
      {/* Node content */}
      <div className="p-4 pt-5">
        <div className="flex items-start gap-3">
          {/* Icon with gradient background */}
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl shrink-0 transition-all duration-300 relative overflow-hidden",
              isError && "bg-red-500/10",
              "group-hover:scale-105"
            )}
            style={{ 
              backgroundColor: isError ? undefined : `${categoryColor}12`,
              boxShadow: isError ? '0 0 12px rgba(239,68,68,0.1)' : `0 3px 12px ${categoryColor}15`,
            }}
          >
            {/* Subtle inner gradient */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: isError 
                  ? 'radial-gradient(circle at 30% 30%, rgba(239,68,68,0.15), transparent 70%)'
                  : `radial-gradient(circle at 30% 30%, ${categoryColor}20, transparent 70%)`
              }}
            />
            <IconComponent 
              className={cn("h-5 w-5 relative z-10", isError && "text-red-400")}
              style={{ color: isError ? undefined : categoryColor }}
            />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-sm font-semibold truncate leading-tight tracking-[-0.01em]",
                isError && "text-red-400"
              )}>
                {data.label}
              </span>
              {getStatusIcon()}
            </div>
            <span 
              className="text-[10px] truncate block mt-1 font-semibold uppercase tracking-wider opacity-70"
              style={{ color: isError ? undefined : categoryColor }}
            >
              {data.category}
            </span>
          </div>
        </div>
        
        {/* Error message banner */}
        {isError && data.executionResult?.error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/8 border border-red-500/15">
            <p className="text-[10px] text-red-400/90 font-medium leading-relaxed line-clamp-2">
              ⚠ {data.executionResult.error}
            </p>
          </div>
        )}

        {getErrorHandlingBadges()}
        
        {/* Config preview */}
        {data.config && Object.keys(data.config).length > 0 && !isError && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="text-[11px] text-muted-foreground space-y-1.5">
              {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2 items-center">
                  <span className="truncate opacity-60 font-medium">{key}</span>
                  <span className="truncate font-mono text-foreground/70 text-[10px] bg-muted/40 px-1.5 py-0.5 rounded-md max-w-[100px]">
                    {typeof value === 'string' ? value.slice(0, 15) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* I/O Data Preview */}
        {data.executionResult?.data && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground w-full transition-colors group/io"
              onClick={(e) => { e.stopPropagation(); setShowIOPreview(!showIOPreview); }}
            >
              {showIOPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="font-semibold">{isSuccess ? 'Output' : 'Data'} Preview</span>
              <span className="ml-auto text-[9px] bg-muted/60 px-1.5 py-0.5 rounded-full font-mono">
                {typeof data.executionResult.data === 'object' 
                  ? `${Object.keys(data.executionResult.data as object).length} fields`
                  : typeof data.executionResult.data}
              </span>
            </button>
            {showIOPreview && (
              <pre className="mt-2 p-2.5 rounded-xl bg-muted/40 text-[9px] font-mono overflow-auto max-h-[80px] whitespace-pre-wrap break-all border border-border/20 text-foreground/70">
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
          className="!w-3.5 !h-3.5 !border-[2.5px] !border-card !rounded-full !transition-all !duration-200 hover:!scale-125"
          style={{ 
            top: `${((index + 1) / (definition.outputs.length + 1)) * 100}%`,
            ...handleStyle(categoryColor, isError),
          }}
        />
      ))}
      {(!definition?.outputs || definition.outputs.length === 0) && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-3.5 !h-3.5 !border-[2.5px] !border-card !rounded-full !transition-all !duration-200 hover:!scale-125"
          style={handleStyle(categoryColor, isError)}
        />
      )}

      {/* Status badge at bottom */}
      {data.executionResult && (
        <div className={cn(
          "absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase shadow-lg border",
          isSuccess && "bg-emerald-500 text-white border-emerald-400/30 shadow-emerald-500/25",
          isError && "bg-red-500 text-white border-red-400/30 shadow-red-500/25",
          isPending && "bg-amber-500 text-white border-amber-400/30 shadow-amber-500/25",
        )}>
          {isSuccess ? '✓ Done' : isError ? '✗ Error' : '● Running'}
        </div>
      )}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
