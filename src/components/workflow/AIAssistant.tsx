import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Send, Loader2, Sparkles, Wand2, ArrowRight, Coins, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useCredits } from '@/hooks/useCredits';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflowSuggestion?: string;
}

const STARTERS = [
  { icon: '📧', text: 'Email automation' },
  { icon: '🛒', text: 'Order processing' },
  { icon: '📊', text: 'Data sync' },
  { icon: '💬', text: 'Customer support' },
];

const MessageBubble = memo(({ message, onBuild, isBuilding }: { 
  message: Message; 
  onBuild: (s: string) => void; 
  isBuilding: boolean;
}) => (
  <div className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
    <div
      className={cn(
        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}
    >
      {message.role === 'assistant' ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            }}
          >
            {message.content}
          </ReactMarkdown>
          
          {message.workflowSuggestion && (
            <div className="mt-2 pt-2 border-t border-border">
              <Button
                size="sm"
                onClick={() => onBuild(message.workflowSuggestion!)}
                disabled={isBuilding}
                className="w-full gap-2"
              >
                {isBuilding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Build workflow
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  </div>
));
MessageBubble.displayName = 'MessageBubble';

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { selectedNode, nodes, setNodes, setEdges, edges } = useWorkflowStore();
  const { credits, refetch: refetchCredits, AI_CREDIT_COSTS } = useCredits();
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: text,
          conversationHistory: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            selectedNode: selectedNode ? { id: selectedNode.id, data: selectedNode.data } : null,
            workflowNodes: nodes.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })),
          },
        },
      });

      if (error) throw error;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Sorry, could not process that.',
        timestamp: new Date(),
        workflowSuggestion: data.workflowSuggestion,
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      if (data.buildNow) {
        await buildWorkflow(data.buildNow);
      }
      
      // Refresh credits after successful message
      refetchCredits();
    } catch (err: any) {
      console.error('AI error:', err);
      
      // Check if it's an insufficient credits error
      const errorBody = err?.context?.body;
      if (err?.message?.includes('402') || errorBody?.error === 'Insufficient credits') {
        setInsufficientCredits(true);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ **Insufficient Credits**\n\nYou need to add credits to use AI features. Visit the Billing page to purchase credits.',
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again.',
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, selectedNode, nodes, isLoading, refetchCredits]);

  const buildWorkflow = useCallback(async (description: string) => {
    setIsBuilding(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-workflow', {
        body: { description },
      });

      if (error || data.error) throw new Error(data?.error || error?.message);

      const generatedNodes = data.workflow.nodes;
      const generatedEdges = data.workflow.edges;

      if (nodes.length > 0) {
        const maxX = Math.max(...nodes.map(n => n.position.x), 0);
        generatedNodes.forEach((node: any) => { node.position.x += maxX + 300; });
        setNodes([...nodes, ...generatedNodes]);
        setEdges([...edges, ...generatedEdges]);
      } else {
        setNodes(generatedNodes);
        setEdges(generatedEdges);
      }

      toast.success('Workflow created!');
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✅ **Done!** Workflow added to canvas. Click nodes to configure.',
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('Build error:', err);
      toast.error('Failed to build workflow');
    } finally {
      setIsBuilding(false);
    }
  }, [nodes, edges, setNodes, setEdges]);

  const handleStarterClick = useCallback((text: string) => {
    sendMessage(`I want to automate ${text.toLowerCase()}`);
  }, [sendMessage]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg bg-card border-primary/30 hover:border-primary"
        >
          <Bot className="h-4 w-4" />
          AI Assistant
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] p-0 flex flex-col">
        <SheetHeader className="p-3 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              FlowForge AI
            </SheetTitle>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {credits?.balance?.toFixed(1) || '0'}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Insufficient Credits Banner */}
        {insufficientCredits && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Insufficient credits
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                  Add credits to continue using AI
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => { setOpen(false); navigate('/billing'); }}
              >
                Add Credits
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-3" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Bot className="h-10 w-10 mx-auto mb-2 text-primary/60" />
                <p className="text-sm text-muted-foreground">
                  What would you like to automate?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {AI_CREDIT_COSTS.chat} credits per message
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleStarterClick(s.text)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <span>{s.icon}</span>
                    <span className="text-sm">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onBuild={buildWorkflow}
                  isBuilding={isBuilding}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your automation..."
              disabled={isLoading || isBuilding}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || isBuilding || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
