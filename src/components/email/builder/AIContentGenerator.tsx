import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sparkles, Wand2, RefreshCw, Check, Copy, ChevronDown, ChevronUp,
  Type, MousePointerClick, Heading1, Loader2,
} from 'lucide-react';

const TONES = [
  { value: 'professional', label: '💼 Professional', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'friendly', label: '😊 Friendly', color: 'bg-green-500/10 text-green-600' },
  { value: 'urgent', label: '⚡ Urgent', color: 'bg-red-500/10 text-red-600' },
  { value: 'playful', label: '🎉 Playful', color: 'bg-purple-500/10 text-purple-600' },
  { value: 'minimal', label: '✨ Minimal', color: 'bg-zinc-500/10 text-zinc-600' },
  { value: 'luxurious', label: '💎 Luxurious', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'educational', label: '📚 Educational', color: 'bg-teal-500/10 text-teal-600' },
];

interface AIContentGeneratorProps {
  onInsertSubject: (subject: string) => void;
  onInsertBodyText: (text: string) => void;
  onInsertCTA: (text: string) => void;
  currentSubject?: string;
  currentBodyText?: string;
}

type GeneratorTab = 'subject' | 'body' | 'cta';

export function AIContentGenerator({
  onInsertSubject,
  onInsertBodyText,
  onInsertCTA,
  currentSubject,
  currentBodyText,
}: AIContentGeneratorProps) {
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState<GeneratorTab>('subject');
  const [tone, setTone] = useState('professional');
  const [prompt, setPrompt] = useState('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you want to generate');
      return;
    }

    setLoading(true);
    setSuggestions([]);
    setGeneratedContent('');

    try {
      const typeMap: Record<GeneratorTab, string> = {
        subject: 'subject_lines',
        body: 'email_body',
        cta: 'cta',
      };

      const { data, error } = await supabase.functions.invoke('generate-email-content', {
        body: {
          type: typeMap[tab],
          prompt,
          tone,
          industry: industry || undefined,
          audience: audience || undefined,
          currentContent: tab === 'body' ? currentBodyText : undefined,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else if (data?.content) {
        setGeneratedContent(data.content);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      toast.error(err.message || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const rewrite = async () => {
    if (!currentBodyText) {
      toast.error('No body text to rewrite');
      return;
    }

    setLoading(true);
    setGeneratedContent('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-email-content', {
        body: {
          type: 'rewrite',
          prompt: 'Rewrite this content',
          tone,
          currentContent: currentBodyText,
        },
      });

      if (error) throw error;
      if (data?.content) setGeneratedContent(data.content);
      else if (data?.error) toast.error(data.error);
    } catch (err: any) {
      toast.error(err.message || 'Failed to rewrite');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: GeneratorTab; label: string; icon: typeof Heading1 }[] = [
    { key: 'subject', label: 'Subject Lines', icon: Heading1 },
    { key: 'body', label: 'Body Content', icon: Type },
    { key: 'cta', label: 'CTA Text', icon: MousePointerClick },
  ];

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Content Generator</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Beta</Badge>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Tab selector */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSuggestions([]); setGeneratedContent(''); }}
                  className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-md transition-colors ${
                    tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tone selector */}
          <div>
            <Label className="text-xs">Tone</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                    tone === t.value
                      ? `${t.color} ring-1 ring-current font-semibold`
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <Label className="text-xs">
              {tab === 'subject' ? 'What is the email about?' : tab === 'body' ? 'Describe the email content' : 'What action should the user take?'}
            </Label>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={
                tab === 'subject'
                  ? 'e.g., Summer sale 50% off all products...'
                  : tab === 'body'
                  ? 'e.g., Welcome email for new subscribers, introduce features...'
                  : 'e.g., Sign up for free trial, purchase product...'
              }
              rows={2}
              className="mt-1 text-xs"
            />
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Industry (optional)</Label>
              <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., SaaS, Ecommerce" className="h-7 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Audience (optional)</Label>
              <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g., Developers, Marketers" className="h-7 text-xs mt-0.5" />
            </div>
          </div>

          {/* Generate button */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 text-xs" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
              Generate
            </Button>
            {tab === 'body' && currentBodyText && (
              <Button size="sm" variant="outline" className="text-xs" onClick={rewrite} disabled={loading}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Rewrite Current
              </Button>
            )}
          </div>

          {/* Results: Suggestions list */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Click to insert:</Label>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (tab === 'subject') onInsertSubject(s);
                    else if (tab === 'cta') onInsertCTA(s);
                    toast.success('Inserted!');
                  }}
                  className="w-full text-left text-xs px-3 py-2 rounded-md border border-border hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center gap-2 group"
                >
                  <Check className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span className="flex-1">{s}</span>
                  <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
              <Button size="sm" variant="ghost" className="w-full text-xs" onClick={generate} disabled={loading}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            </div>
          )}

          {/* Results: Generated content */}
          {generatedContent && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Generated content:</Label>
              <div className="bg-muted/30 rounded-md p-3 text-xs whitespace-pre-wrap border border-border max-h-48 overflow-auto">
                {generatedContent}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertBodyText(generatedContent); toast.success('Content inserted!'); }}>
                  <Check className="h-3 w-3 mr-1" />
                  Insert into Email
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={generate} disabled={loading}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
