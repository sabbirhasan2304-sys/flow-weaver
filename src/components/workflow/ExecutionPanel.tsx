import { useState } from 'react';
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
  Terminal
} from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExecutionResult {
  success: boolean;
  executionId?: string;
  output?: unknown;
  error?: string;
  logs: Array<{
    nodeId: string;
    timestamp: string;
    message: string;
    level: 'info' | 'error' | 'success';
    data?: unknown;
  }>;
}

interface ExecutionPanelProps {
  workflowId: string;
}

export function ExecutionPanel({ workflowId }: ExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [inputData, setInputData] = useState('{}');
  const { nodes, updateNode } = useWorkflowStore();

  const executeWorkflow = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setResult(null);

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

      setResult(data);

      // Update node visual states based on execution logs
      if (data.logs) {
        data.logs.forEach((log: any) => {
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
      <SheetContent side="right" className="w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Execution Panel
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
        </SheetHeader>

        <Tabs defaultValue="input" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="flex-1 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Data (JSON)</label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full h-[200px] p-3 rounded-md border border-input bg-background font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </div>
          </TabsContent>

          <TabsContent value="output" className="flex-1 p-4">
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Badge variant="default" className="bg-success text-success-foreground">
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
                    <span className="text-xs text-muted-foreground">
                      ID: {result.executionId.slice(0, 8)}...
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
                    <pre className="p-3 rounded-md bg-muted font-mono text-xs overflow-auto max-h-[300px]">
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

          <TabsContent value="logs" className="flex-1">
            <ScrollArea className="h-[400px]">
              {result?.logs && result.logs.length > 0 ? (
                <div className="p-4 space-y-2">
                  {result.logs.map((log, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-md border text-sm',
                        log.level === 'success' && 'bg-success/10 border-success/20',
                        log.level === 'error' && 'bg-destructive/10 border-destructive/20',
                        log.level === 'info' && 'bg-muted border-border'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.nodeId}</span>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{log.message}</p>
                      {log.data && (
                        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No logs yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
