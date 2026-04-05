import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Globe, Loader2, CheckCircle2, AlertTriangle, Search as SearchIcon } from 'lucide-react';
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

interface AuditResult {
  issues: { type: string; severity: string; description: string; fix: string }[];
  score: number;
  estimated_revenue_impact: string;
  summary: string;
}

export function AISetupAssistant({ open, onOpenChange }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [mode, setMode] = useState<'setup' | 'audit'>('setup');

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setAuditResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tracking-setup', {
        body: { url: url.trim(), mode },
      });
      if (error) throw error;
      if (mode === 'audit') {
        setAuditResult(data);
      } else {
        setResult(data);
      }
    } catch {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const severityColor: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-600',
    warning: 'bg-yellow-500/10 text-yellow-600',
    info: 'bg-blue-500/10 text-blue-600',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Setup Assistant
          </DialogTitle>
          <DialogDescription>Analyze your website for optimal tracking configuration or audit existing setup.</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setResult(null); setAuditResult(null); }}>
          <TabsList className="w-full">
            <TabsTrigger value="setup" className="flex-1 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Setup</TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 gap-1.5"><SearchIcon className="h-3.5 w-3.5" /> Audit</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourwebsite.com" className="pl-9" />
            </div>
            <Button onClick={analyze} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'audit' ? 'Audit' : 'Analyze'}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">{mode === 'audit' ? 'Auditing your tracking setup...' : 'Analyzing your website...'}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <p className="text-sm text-foreground">{result.summary}</p>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommended Sources</p>
                <div className="flex flex-wrap gap-1">
                  {result.sources.map((s) => <Badge key={s} variant="outline" className="bg-green-500/10 text-green-600">{s}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommended Transforms</p>
                <div className="flex flex-wrap gap-1">
                  {result.transforms.map((t) => <Badge key={t} variant="outline" className="bg-blue-500/10 text-blue-600">{t}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommended Destinations</p>
                <div className="flex flex-wrap gap-1">
                  {result.destinations.map((d) => <Badge key={d} variant="outline" className="bg-purple-500/10 text-purple-600">{d}</Badge>)}
                </div>
              </div>
              <Button className="w-full" onClick={() => { onOpenChange(false); toast.success('Recommendations noted! Head to Workflows to build.'); }}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Apply Recommendations
              </Button>
            </div>
          )}

          {auditResult && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Tracking Health Score</p>
                  <p className="text-3xl font-bold text-foreground">{auditResult.score}/100</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Est. Revenue Impact</p>
                  <p className="text-lg font-bold text-red-600">{auditResult.estimated_revenue_impact}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{auditResult.summary}</p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Issues Found ({auditResult.issues.length})</p>
                {auditResult.issues.map((issue, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={severityColor[issue.severity] || ''} variant="outline">{issue.severity}</Badge>
                      <span className="text-sm font-medium text-foreground">{issue.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                    <p className="text-xs text-primary">Fix: {issue.fix}</p>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={() => { onOpenChange(false); toast.success('Audit results saved!'); }}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Got It
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
