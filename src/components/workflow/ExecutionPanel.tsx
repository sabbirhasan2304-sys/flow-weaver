import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Activity,
  FileJson,
  Terminal,
  Radio,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ExecutionLog {
  nodeId: string;
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'success';
  data?: unknown;
}

interface ExecutionResult {
  success: boolean;
  executionId?: string;
  output?: unknown;
  error?: string;
  logs: ExecutionLog[];
}

interface ExecutionPanelProps {
  workflowId: string;
}

export function ExecutionPanel({ workflowId }: ExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [inputData, setInputData] = useState('{}');
  const [streamingLogs, setStreamingLogs] = useState<ExecutionLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [autoScroll, setAutoScroll] = useState(true);
  const [executionDuration, setExecutionDuration] = useState(0);
  const { nodes, updateNode } = useWorkflowStore();
  const channelRef = useRef<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingLogs, autoScroll]);

  // Timer for execution duration
  useEffect(() => {
    if (isExecuting) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setExecutionDuration(Date.now() - startTimeRef.current);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isExecuting]);

  // Cleanup realtime subscription
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const getNodeProgress = useCallback(() => {
    const totalNodes = nodes.length;
    if (totalNodes === 0) return 0;
    const completedNodes = new Set(
      streamingLogs
        .filter(l => l.level === 'success' || l.level === 'error')
        .map(l => l.nodeId)
    ).size;
    return Math.round((completedNodes / totalNodes) * 100);
  }, [nodes.length, streamingLogs]);

  const subscribeToExecution = (executionId: string) => {
    setIsStreaming(true);
    setStreamingLogs([]);
    setActiveTab('logs');

    const channel = supabase
      .channel(`execution-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${executionId}`,
        },
        (payload) => {
          const newLogs = (payload.new as any).logs as ExecutionLog[] || [];
          setStreamingLogs(newLogs);

          // Update node visual states
          newLogs.forEach((log) => {
            const status = log.level === 'success' ? 'success' : 
                          log.level === 'error' ? 'error' : 'pending';
            updateNode(log.nodeId, {
              isExecuting: log.level === 'info',
              executionResult: { 
                status, 
                data: log.data, 
                inputData: log.level === 'info' ? log.data : undefined,
                error: log.level === 'error' ? log.message : undefined 
              },
            });
          });

          const newStatus = (payload.new as any).status;
          if (newStatus === 'success' || newStatus === 'error') {
            setIsStreaming(false);
            // Clear executing state on all nodes
            nodes.forEach(node => {
              updateNode(node.id, { isExecuting: false });
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const executeWorkflow = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setResult(null);
    setStreamingLogs([]);
    setExecutionDuration(0);

    // Clear previous execution states
    nodes.forEach(node => {
      updateNode(node.id, { isExecuting: false, executionResult: undefined });
    });

    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(inputData);
      } catch {
        toast.error('Invalid JSON input');
        setIsExecuting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('execute-workflow', {
        body: {
          workflowId,
          inputData: parsedInput,
          testMode: true,
        },
      });

      if (error) throw error;

      // Subscribe to realtime updates
      if (data.executionId) {
        subscribeToExecution(data.executionId);
      }

      setResult(data);

      // Update node states from initial response
      if (data.logs) {
        data.logs.forEach((log: ExecutionLog) => {
          const status = log.level === 'success' ? 'success' : 
                        log.level === 'error' ? 'error' : 'pending';
          updateNode(log.nodeId, {
            isExecuting: false,
            executionResult: { status, data: log.data, error: log.level === 'error' ? log.message : undefined },
          });
        });
      }

      if (data.success) {
        toast.success('Workflow executed successfully');
      } else {
        toast.error(`Execution failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      toast.error(`Execution failed: ${error.message}`);
      setResult({
        success: false,
        error: error.message,
        logs: [],
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const displayLogs = streamingLogs.length > 0 ? streamingLogs : (result?.logs || []);
  const progress = getNodeProgress();
  const formattedDuration = (executionDuration / 1000).toFixed(1);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          {isExecuting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Test Run
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[520px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border space-y-3">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Execution Panel
              {isStreaming && (
                <Badge variant="default" className="bg-emerald-500/90 text-white animate-pulse gap-1 text-xs">
                  <Radio className="h-3 w-3" />
                  Live
                </Badge>
              )}
            </span>
            <Button
              size="sm"
              onClick={executeWorkflow}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </>
              )}
            </Button>
          </SheetTitle>

          {/* Progress bar during execution */}
          {(isExecuting || isStreaming) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress}% complete</span>
                <span>{formattedDuration}s</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {/* Post-execution summary */}
          {result && !isExecuting && !isStreaming && (
            <div className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-sm',
              result.success 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            )}>
              <span className="flex items-center gap-2">
                {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {result.success ? 'Completed successfully' : `Failed: ${result.error}`}
              </span>
              <span className="text-xs opacity-70">{formattedDuration}s</span>
            </div>
          )}
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="logs" className="relative">
              Logs
              {displayLogs.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({displayLogs.length})</span>
              )}
              {isStreaming && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="flex-1 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Data (JSON)</label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full h-[200px] p-3 rounded-md border border-input bg-background font-mono text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder='{"key": "value"}'
              />
            </div>
          </TabsContent>

          <TabsContent value="output" className="flex-1 p-4">
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Badge variant="default" className="bg-emerald-500/90 text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  {result.executionId && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {result.executionId.slice(0, 8)}
                    </span>
                  )}
                </div>

                {result.error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{result.error}</p>
                  </div>
                )}

                {result.output && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Output Data</label>
                    <pre className="p-3 rounded-md bg-muted font-mono text-xs overflow-auto max-h-[400px] border border-border">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Run the workflow to see output</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="flex-1 flex flex-col min-h-0">
            {displayLogs.length > 0 ? (
              <>
                {/* Auto-scroll toggle */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">
                    {displayLogs.length} log entries
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-6 text-xs gap-1", autoScroll && "text-primary")}
                    onClick={() => setAutoScroll(!autoScroll)}
                  >
                    <ChevronDown className={cn("h-3 w-3", autoScroll && "animate-bounce")} />
                    Auto-scroll
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1.5">
                    {displayLogs.map((log, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-2.5 rounded-md border text-sm transition-all duration-300',
                          log.level === 'success' && 'bg-emerald-500/5 border-emerald-500/20',
                          log.level === 'error' && 'bg-destructive/5 border-destructive/20',
                          log.level === 'info' && 'bg-muted/50 border-border',
                          isStreaming && index === displayLogs.length - 1 && 'ring-2 ring-primary/40 shadow-sm'
                        )}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="flex items-center gap-1.5 font-medium text-xs">
                            {getLevelIcon(log.level)}
                            {log.nodeId}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-5">{log.message}</p>
                        {log.data && (
                          <details className="mt-1.5 pl-5">
                            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                              View data
                            </summary>
                            <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-auto max-h-[150px] border border-border font-mono">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No logs yet</p>
                <p className="text-xs mt-1 opacity-70">Run the workflow to see real-time logs</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
