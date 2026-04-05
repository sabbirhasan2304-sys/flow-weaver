import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Recommendation {
  sources: string[];
  transforms: string[];
  destinations: string[];
  summary: string;
}

export function AISetupAssistant({ open, onOpenChange }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tracking-setup', {
        body: { url: url.trim() },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Setup Assistant
          </DialogTitle>
          <DialogDescription>
            Enter your website URL and our AI will analyze it to recommend the optimal tracking configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="pl-9"
              />
            </div>
            <Button onClick={analyze} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing your website...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <p className="text-sm text-foreground">{result.summary}</p>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommended Sources</p>
                <div className="flex flex-wrap gap-1">
                  {result.sources.map((s) => (
                    <Badge key={s} variant="outline" className="bg-green-500/10 text-green-600">{s}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommended Transforms</p>
                <div className="flex flex-wrap gap-1">
                  {result.transforms.map((t) => (
                    <Badge key={t} variant="outline" className="bg-blue-500/10 text-blue-600">{t}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommended Destinations</p>
                <div className="flex flex-wrap gap-1">
                  {result.destinations.map((d) => (
                    <Badge key={d} variant="outline" className="bg-purple-500/10 text-purple-600">{d}</Badge>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => { onOpenChange(false); toast.success('Recommendations noted! Head to Pipelines to build.'); }}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Apply Recommendations
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
