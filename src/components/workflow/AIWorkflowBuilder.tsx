import { useState, useCallback } from 'react';
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
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowStore, WorkflowNode, WorkflowEdge } from '@/stores/workflowStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  'Stripe order → email confirmation + Slack notification',
  'GitHub PR → Discord update',
  'Daily Supabase report → email team',
  'Form submission → database + welcome email',
  'Webhook → validate data → PostgreSQL',
];

export function AIWorkflowBuilder() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { setNodes, setEdges, nodes, edges } = useWorkflowStore();

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      toast.error('Please describe your workflow');
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('generate-workflow', {
        body: { description },
      });

      if (error) throw new Error(error.message || 'Generation failed');
      if (data.error) throw new Error(data.error);

      const generatedNodes: WorkflowNode[] = data.workflow.nodes;
      const generatedEdges: WorkflowEdge[] = data.workflow.edges;

      // Offset new nodes if there are existing ones
      if (nodes.length > 0) {
        const maxX = Math.max(...nodes.map(n => n.position.x), 0);
        const offsetX = maxX + 300;
        generatedNodes.forEach(node => {
          node.position.x += offsetX;
        });
        setNodes([...nodes, ...generatedNodes]);
        setEdges([...edges, ...generatedEdges]);
      } else {
        setNodes(generatedNodes);
        setEdges(generatedEdges);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      toast.success(`Generated ${generatedNodes.length} nodes in ${elapsed}s`);
      setOpen(false);
      setDescription('');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  }, [description, nodes, edges, setNodes, setEdges]);

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Workflow Builder
          </DialogTitle>
          <DialogDescription>
            Describe what you want to automate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Textarea
            placeholder="e.g., When someone orders on Stripe, send confirmation email and notify Slack"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example, i) => (
              <button
                key={i}
                onClick={() => setDescription(example)}
                disabled={isGenerating}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border transition-colors",
                  "hover:bg-primary/10 hover:border-primary/40",
                  "disabled:opacity-50",
                  description === example && "bg-primary/10 border-primary/40"
                )}
              >
                {example.length > 40 ? example.slice(0, 40) + '...' : example}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
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
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
