import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Send, Loader2, Sparkles, Wand2, ArrowRight, MessageSquare } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflowSuggestion?: string;
  buildNow?: string;
}

const QUICK_PROMPTS = [
  'I need to automate my customer onboarding',
  'Help me process incoming orders',
  'I want to sync data between tools',
  'How can I automate email responses?',
];

const BUSINESS_STARTERS = [
  { icon: '📧', text: 'Email automation', prompt: 'I want to automate email workflows for my business' },
  { icon: '🛒', text: 'E-commerce', prompt: 'I need to automate my e-commerce order processing' },
  { icon: '📊', text: 'Data sync', prompt: 'I want to sync data between different tools and databases' },
  { icon: '💬', text: 'Customer support', prompt: 'Help me automate customer support responses' },
  { icon: '📱', text: 'Social media', prompt: 'I want to automate social media posting and monitoring' },
  { icon: '🔔', text: 'Notifications', prompt: 'I need to set up automated notifications for my team' },
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { selectedNode, nodes, executionLogs, setNodes, setEdges } = useWorkflowStore();
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const lastError = executionLogs.find(log => log.level === 'error');
      
      // Send conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: messageText,
          conversationHistory,
          context: {
            selectedNode: selectedNode ? {
              id: selectedNode.id,
              data: selectedNode.data,
            } : null,
            workflowNodes: nodes.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })),
            error: lastError?.message,
          },
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process your request.',
        timestamp: new Date(),
        workflowSuggestion: data.workflowSuggestion,
        buildNow: data.buildNow,
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // If AI says to build now, trigger the build
      if (data.buildNow) {
        await handleBuildWorkflow(data.buildNow);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildWorkflow = async (description: string) => {
    setIsBuilding(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-workflow', {
        body: { description },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const generatedNodes = data.workflow.nodes;
      const generatedEdges = data.workflow.edges;

      // If there are existing nodes, offset new nodes
      if (nodes.length > 0) {
        const maxX = Math.max(...nodes.map(n => n.position.x), 0);
        const offsetX = maxX + 300;
        generatedNodes.forEach((node: any) => {
          node.position.x += offsetX;
        });
        setNodes([...nodes, ...generatedNodes]);
        setEdges([...useWorkflowStore.getState().edges, ...generatedEdges]);
      } else {
        setNodes(generatedNodes);
        setEdges(generatedEdges);
      }

      toast.success('Workflow created! Check your canvas.');
      
      // Add confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✅ **Workflow created successfully!** I\'ve added the nodes to your canvas. You can now:\n\n- Click on any node to configure it\n- Connect to your accounts in the Credentials page\n- Test the workflow using the Execute button\n\nNeed any adjustments?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
    } catch (error) {
      console.error('Build error:', error);
      toast.error('Failed to build workflow. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleBuildClick = (suggestion: string) => {
    sendMessage(`Yes, please build this workflow: ${suggestion}`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 hover:border-primary"
        >
          <Bot className="h-4 w-4" />
          AI Assistant
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5">
          <SheetTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-purple-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            FlowForge AI
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Describe your business problem, and I'll help you automate it
          </p>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-6">
              {/* Welcome message */}
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">How can I help you automate?</h4>
                <p className="text-sm text-muted-foreground">
                  Tell me about a repetitive task or business problem, and I'll suggest a workflow solution.
                </p>
              </div>

              {/* Business starters */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">Popular automations:</p>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_STARTERS.map((starter) => (
                    <button
                      key={starter.text}
                      onClick={() => sendMessage(starter.prompt)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                    >
                      <span className="text-lg">{starter.icon}</span>
                      <span className="text-sm font-medium">{starter.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick prompts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">Or try these:</p>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left text-sm"
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[90%] rounded-lg px-3 py-2 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            hr: () => <hr className="my-3 border-border" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                        
                        {/* Build button for workflow suggestions */}
                        {message.workflowSuggestion && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              onClick={() => handleBuildClick(message.workflowSuggestion!)}
                              disabled={isBuilding || isLoading}
                              className="w-full gap-2"
                            >
                              {isBuilding ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Building...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-4 w-4" />
                                  Build this workflow
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <span className="text-[10px] opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your automation need..."
              disabled={isLoading || isBuilding}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || isBuilding || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            AI can make mistakes. Review workflows before running.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
