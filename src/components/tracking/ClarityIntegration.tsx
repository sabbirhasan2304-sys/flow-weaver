import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Eye, MousePointerClick, ScrollText, Flame, Copy, Check, Plus, Trash2,
  Code, Shield, Users, Video, Zap, ExternalLink, AlertTriangle,
  ChevronDown, ChevronRight, Loader2, Sparkles
} from 'lucide-react';

interface ClarityConfig {
  project_id: string;
  custom_tags: { key: string; value: string }[];
  custom_events: string[];
  identify_config: { enabled: boolean; custom_id_field: string };
  masking_rules: { selector: string; action: 'mask' | 'unmask' }[];
  is_active: boolean;
}

const defaultConfig: ClarityConfig = {
  project_id: '',
  custom_tags: [],
  custom_events: [],
  identify_config: { enabled: false, custom_id_field: '' },
  masking_rules: [],
  is_active: true,
};

export function ClarityIntegration() {
  const { user } = useAuth();
  const [config, setConfig] = useState<ClarityConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    setup: true, features: false, identify: false, tags: false, privacy: false, snippet: false,
  });
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [newEvent, setNewEvent] = useState('');
  const [newMaskSelector, setNewMaskSelector] = useState('');
  const [newMaskAction, setNewMaskAction] = useState<'mask' | 'unmask'>('mask');

  useEffect(() => {
    if (user) loadConfig();
  }, [user]);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('tracking_clarity_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (data) {
        setConfig({
          project_id: data.project_id,
          custom_tags: (data.custom_tags as any) || [],
          custom_events: (data.custom_events as any) || [],
          identify_config: (data.identify_config as any) || defaultConfig.identify_config,
          masking_rules: (data.masking_rules as any) || [],
          is_active: data.is_active,
        });
        // If already connected, collapse setup and expand features
        if (data.project_id) {
          setExpandedSections(s => ({ ...s, setup: false, features: true }));
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const saveConfig = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tracking_clarity_config')
        .upsert({
          user_id: user.id,
          project_id: config.project_id,
          custom_tags: config.custom_tags as any,
          custom_events: config.custom_events as any,
          identify_config: config.identify_config as any,
          masking_rules: config.masking_rules as any,
          is_active: config.is_active,
        }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Configuration saved');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied');
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSection = (key: string) => {
    setExpandedSections(s => ({ ...s, [key]: !s[key] }));
  };

  const generateSnippet = () => {
    if (!config.project_id) return '// Enter your Clarity Project ID first';
    let snippet = `<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "${config.project_id}");
</script>`;
    if (config.identify_config.enabled && config.identify_config.custom_id_field) {
      snippet += `\n\n<script>\n  window.clarity("identify", /* ${config.identify_config.custom_id_field} */);\n</script>`;
    }
    if (config.custom_tags.length > 0) {
      snippet += `\n\n<script>`;
      config.custom_tags.forEach(t => { snippet += `\n  window.clarity("set", "${t.key}", "${t.value}");`; });
      snippet += `\n</script>`;
    }
    if (config.custom_events.length > 0) {
      snippet += `\n\n<script>`;
      config.custom_events.forEach(e => { snippet += `\n  // window.clarity("event", "${e}");`; });
      snippet += `\n</script>`;
    }
    return snippet;
  };

  const addTag = () => { if (!newTagKey.trim()) return; setConfig(c => ({ ...c, custom_tags: [...c.custom_tags, { key: newTagKey.trim(), value: newTagValue.trim() }] })); setNewTagKey(''); setNewTagValue(''); };
  const removeTag = (i: number) => setConfig(c => ({ ...c, custom_tags: c.custom_tags.filter((_, idx) => idx !== i) }));
  const addEvent = () => { if (!newEvent.trim()) return; setConfig(c => ({ ...c, custom_events: [...c.custom_events, newEvent.trim()] })); setNewEvent(''); };
  const removeEvent = (i: number) => setConfig(c => ({ ...c, custom_events: c.custom_events.filter((_, idx) => idx !== i) }));
  const addMaskRule = () => { if (!newMaskSelector.trim()) return; setConfig(c => ({ ...c, masking_rules: [...c.masking_rules, { selector: newMaskSelector.trim(), action: newMaskAction }] })); setNewMaskSelector(''); };
  const removeMaskRule = (i: number) => setConfig(c => ({ ...c, masking_rules: c.masking_rules.filter((_, idx) => idx !== i) }));

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>;

  const isConnected = !!config.project_id;
  const clarityUrl = isConnected ? `https://clarity.microsoft.com/projects/view/${config.project_id}` : null;

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header Card */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Microsoft Clarity</h2>
              <Badge variant="outline" className="text-xs font-normal">Free Forever</Badge>
              {isConnected && <Badge className="bg-success/15 text-success border-0 text-xs">Connected</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">Heatmaps, session recordings & behavioral insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={config.is_active} onCheckedChange={v => setConfig(c => ({ ...c, is_active: v }))} />
          {clarityUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={clarityUrl} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Clarity</a>
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Setup */}
      <CollapsibleSection
        title="Setup & Connection"
        icon={<Eye className="h-4 w-4" />}
        expanded={expandedSections.setup}
        onToggle={() => toggleSection('setup')}
        badge={isConnected ? 'Connected' : 'Required'}
        badgeVariant={isConnected ? 'success' : 'warning'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Clarity Project ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. abc123xyz"
                value={config.project_id}
                onChange={e => setConfig(c => ({ ...c, project_id: e.target.value }))}
                className="font-mono"
              />
              <Button onClick={saveConfig} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get this from <a href="https://clarity.microsoft.com" target="_blank" rel="noopener" className="text-primary hover:underline">clarity.microsoft.com</a> → Settings → Overview
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Create Account', desc: 'Free at clarity.microsoft.com' },
              { step: '2', title: 'Add Project', desc: 'Enter your website URL' },
              { step: '3', title: 'Copy ID', desc: 'Paste your Project ID above' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">{s.step}</div>
                <div>
                  <p className="text-xs font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Feature Overview */}
      <CollapsibleSection
        title="What You Get"
        icon={<Zap className="h-4 w-4" />}
        expanded={expandedSections.features}
        onToggle={() => toggleSection('features')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FeatureItem icon={<MousePointerClick className="h-4 w-4 text-blue-400" />} title="Click Heatmaps" desc="See exactly where users click on every page" link={clarityUrl ? `${clarityUrl}/heatmaps` : undefined} />
          <FeatureItem icon={<ScrollText className="h-4 w-4 text-cyan-400" />} title="Scroll Heatmaps" desc="Discover how far users scroll — find the fold" link={clarityUrl ? `${clarityUrl}/heatmaps` : undefined} />
          <FeatureItem icon={<Video className="h-4 w-4 text-purple-400" />} title="Session Recordings" desc="Replay real user sessions (100K/day free)" link={clarityUrl ? `${clarityUrl}/recordings` : undefined} />
          <FeatureItem icon={<Flame className="h-4 w-4 text-destructive" />} title="Rage Click Detection" desc="Auto-detect frustrated users clicking repeatedly" />
          <FeatureItem icon={<MousePointerClick className="h-4 w-4 text-warning" />} title="Dead Click Detection" desc="Find clicks on non-interactive elements" />
          <FeatureItem icon={<AlertTriangle className="h-4 w-4 text-orange-400" />} title="Quick-Back Detection" desc="Spot users who navigate away immediately" />
        </div>

        {/* Embedded dashboard */}
        {isConnected && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Live Dashboard</p>
              <Button variant="ghost" size="sm" asChild>
                <a href={`${clarityUrl}/dashboard`} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3 mr-1" /> Full View</a>
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <iframe
                src={`${clarityUrl}/dashboard`}
                className="w-full border-0"
                style={{ height: '500px' }}
                title="Clarity Dashboard"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              💡 Sign into Clarity first if the dashboard doesn't load. <a href="https://clarity.microsoft.com" target="_blank" rel="noopener" className="text-primary hover:underline">Sign in →</a>
            </p>
          </div>
        )}
      </CollapsibleSection>

      {/* User Identification */}
      <CollapsibleSection
        title="User Identification"
        icon={<Users className="h-4 w-4" />}
        expanded={expandedSections.identify}
        onToggle={() => toggleSection('identify')}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={config.identify_config.enabled}
              onCheckedChange={v => setConfig(c => ({ ...c, identify_config: { ...c.identify_config, enabled: v } }))}
            />
            <div>
              <Label className="text-sm">Link sessions to user accounts</Label>
              <p className="text-xs text-muted-foreground">Track individual user journeys across sessions</p>
            </div>
          </div>
          {config.identify_config.enabled && (
            <>
              <Input
                placeholder="Custom ID field (e.g. userId, email)"
                value={config.identify_config.custom_id_field}
                onChange={e => setConfig(c => ({ ...c, identify_config: { ...c.identify_config, custom_id_field: e.target.value } }))}
              />
              <CodeBlock
                code={`window.clarity("identify", "${config.identify_config.custom_id_field || 'user-id'}");`}
                onCopy={() => copyText(`window.clarity("identify", "${config.identify_config.custom_id_field || 'user-id'}");`, 'identify')}
                copied={copied === 'identify'}
              />
            </>
          )}
          <Button onClick={saveConfig} disabled={saving} size="sm" variant="outline">{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </CollapsibleSection>

      {/* Custom Tags & Events */}
      <CollapsibleSection
        title="Custom Tags & Events"
        icon={<Zap className="h-4 w-4" />}
        expanded={expandedSections.tags}
        onToggle={() => toggleSection('tags')}
        badge={`${config.custom_tags.length + config.custom_events.length} configured`}
      >
        <div className="space-y-4">
          {/* Tags */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tags</Label>
            <p className="text-xs text-muted-foreground mb-2">Filter and segment sessions by custom properties</p>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Key" value={newTagKey} onChange={e => setNewTagKey(e.target.value)} className="flex-1 text-sm" />
              <Input placeholder="Value" value={newTagValue} onChange={e => setNewTagValue(e.target.value)} className="flex-1 text-sm" />
              <Button size="icon" variant="outline" onClick={addTag}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {config.custom_tags.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-2.5 rounded bg-muted/40 mb-1">
                <code className="text-xs text-primary">{t.key}</code>
                <span className="text-muted-foreground">=</span>
                <span className="text-xs">{t.value}</span>
                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => removeTag(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Events */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Events</Label>
            <p className="text-xs text-muted-foreground mb-2">Track custom user actions</p>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Event name (e.g. checkout_started)" value={newEvent} onChange={e => setNewEvent(e.target.value)} className="flex-1 text-sm" />
              <Button size="icon" variant="outline" onClick={addEvent}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {config.custom_events.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-2.5 rounded bg-muted/40 mb-1">
                <Zap className="h-3 w-3 text-primary" />
                <code className="text-xs">{e}</code>
                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => removeEvent(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>

          <Button onClick={saveConfig} disabled={saving} size="sm" variant="outline">{saving ? 'Saving...' : 'Save All'}</Button>
        </div>
      </CollapsibleSection>

      {/* Privacy Masking */}
      <CollapsibleSection
        title="Privacy & Masking"
        icon={<Shield className="h-4 w-4" />}
        expanded={expandedSections.privacy}
        onToggle={() => toggleSection('privacy')}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Clarity masks inputs, numbers, and emails by default. Add custom rules below.</p>
          <div className="flex gap-2">
            <Input placeholder="CSS selector (e.g. .payment-form)" value={newMaskSelector} onChange={e => setNewMaskSelector(e.target.value)} className="flex-1 text-sm" />
            <select value={newMaskAction} onChange={e => setNewMaskAction(e.target.value as any)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
              <option value="mask">Mask</option>
              <option value="unmask">Unmask</option>
            </select>
            <Button size="icon" variant="outline" onClick={addMaskRule}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          {config.masking_rules.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2.5 rounded bg-muted/40">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <code className="text-xs">{r.selector}</code>
              <Badge variant={r.action === 'mask' ? 'destructive' : 'secondary'} className="text-xs">{r.action}</Badge>
              <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => removeMaskRule(i)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button onClick={saveConfig} disabled={saving} size="sm" variant="outline">{saving ? 'Saving...' : 'Save Rules'}</Button>
        </div>
      </CollapsibleSection>

      {/* Generated Snippet */}
      <CollapsibleSection
        title="Installation Snippet"
        icon={<Code className="h-4 w-4" />}
        expanded={expandedSections.snippet}
        onToggle={() => toggleSection('snippet')}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Add this to your website's <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> tag
          </p>
          <div className="relative">
            <Textarea readOnly value={generateSnippet()} className="font-mono text-xs min-h-[160px] bg-muted/50 border-border/50" />
            <Button
              variant="secondary" size="sm"
              className="absolute top-2 right-2 text-xs"
              onClick={() => copyText(generateSnippet(), 'snippet')}
            >
              {copied === 'snippet' ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs font-medium mb-1">Cookie Consent</p>
            <p className="text-xs text-muted-foreground mb-2">Call after user accepts cookies:</p>
            <CodeBlock
              code={`window.clarity("consent");`}
              onCopy={() => copyText('window.clarity("consent");', 'consent')}
              copied={copied === 'consent'}
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

/* ── Sub-components ── */

function CollapsibleSection({ title, icon, expanded, onToggle, children, badge, badgeVariant }: {
  title: string; icon: React.ReactNode; expanded: boolean; onToggle: () => void; children: React.ReactNode;
  badge?: string; badgeVariant?: 'success' | 'warning';
}) {
  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors">
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium flex-1">{title}</span>
        {badge && (
          <Badge variant="outline" className={`text-xs ${badgeVariant === 'success' ? 'border-success/30 text-success' : badgeVariant === 'warning' ? 'border-warning/30 text-warning' : ''}`}>
            {badge}
          </Badge>
        )}
      </button>
      {expanded && (
        <CardContent className="pt-0 pb-5 px-5 border-t border-border/30">
          <div className="pt-4">{children}</div>
        </CardContent>
      )}
    </Card>
  );
}

function FeatureItem({ icon, title, desc, link }: { icon: React.ReactNode; title: string; desc: string; link?: string }) {
  const content = (
    <div className={`flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-muted/20 ${link ? 'hover:bg-muted/40 transition-colors cursor-pointer' : ''}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {link && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />}
    </div>
  );
  return link ? <a href={link} target="_blank" rel="noopener">{content}</a> : content;
}

function CodeBlock({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative">
      <pre className="bg-muted/50 border border-border/40 rounded-md px-3 py-2.5 text-xs font-mono overflow-x-auto">{code}</pre>
      <Button variant="ghost" size="icon" className="absolute top-1.5 right-1.5 h-6 w-6" onClick={onCopy}>
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}
