import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Wand2, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowStore, WorkflowNode, WorkflowEdge } from '@/stores/workflowStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EXAMPLE_PROMPTS = [
  'When a new order is placed in Stripe, send a confirmation email and notify the team in Slack',
  'Monitor GitHub for new pull requests and post updates to Discord',
  'Schedule a daily report that fetches data from Supabase and emails it to the team',
  'When someone fills out a form, save to database and send a welcome email',
  'Process incoming webhooks, validate the data, and store in PostgreSQL',
  'When a customer signs up, add them to Mailchimp and send a Slack notification',
];

export function AIWorkflowBuilder() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { setNodes, setEdges, nodes } = useWorkflowStore();

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe your workflow');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-workflow', {
        body: { description },
      });

      if (error) {
        console.error('Generation error:', error);
        throw new Error(error.message || 'Failed to generate workflow');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const generatedNodes: WorkflowNode[] = data.workflow.nodes;
      const generatedEdges: WorkflowEdge[] = data.workflow.edges;

      // If there are existing nodes, offset new nodes to avoid overlap
      if (nodes.length > 0) {
        const maxX = Math.max(...nodes.map(n => n.position.x), 0);
        const offsetX = maxX + 300;
        
        generatedNodes.forEach(node => {
          node.position.x += offsetX;
        });
      }

      // Merge with existing or replace
      if (nodes.length > 0) {
        setNodes([...nodes, ...generatedNodes]);
        setEdges([...useWorkflowStore.getState().edges, ...generatedEdges]);
        toast.success('Workflow nodes added to canvas!');
      } else {
        setNodes(generatedNodes);
        setEdges(generatedEdges);
        toast.success('Workflow generated successfully!');
      }

      setOpen(false);
      setDescription('');
    } catch (error) {
      console.error('Error generating workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 hover:border-primary/40"
        >
          <Wand2 className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">AI Builder</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            AI Workflow Builder
          </DialogTitle>
          <DialogDescription>
            Describe what you want your workflow to do, and AI will create it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Example: When a new order comes in from Stripe, send a confirmation email to the customer and post a notification to our team's Slack channel..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isGenerating}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              <span>Try these examples:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(prompt)}
                  disabled={isGenerating}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    "hover:bg-primary/10 hover:border-primary/40 hover:text-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    description === prompt && "bg-primary/10 border-primary/40 text-primary"
                  )}
                >
                  {prompt.slice(0, 50)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Workflow
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
