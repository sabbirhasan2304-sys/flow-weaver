import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Eye, MousePointerClick, ScrollText, Flame, Copy, Check, Plus, Trash2,
  Code, Shield, Users, BarChart3, Video, Zap, ExternalLink, Settings2,
  AlertTriangle, ArrowUpDown
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
      toast.success('Clarity configuration saved');
    } catch {
      toast.error('Failed to save configuration');
    }
    setSaving(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
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
      snippet += `\n\n<script>
    // Identify user for Clarity session linking
    window.clarity("identify", /* ${config.identify_config.custom_id_field} */);
</script>`;
    }

    if (config.custom_tags.length > 0) {
      snippet += `\n\n<script>`;
      config.custom_tags.forEach(tag => {
        snippet += `\n    window.clarity("set", "${tag.key}", "${tag.value}");`;
      });
      snippet += `\n</script>`;
    }

    if (config.custom_events.length > 0) {
      snippet += `\n\n<script>
    // Call these when the corresponding action happens:`;
      config.custom_events.forEach(evt => {
        snippet += `\n    // window.clarity("event", "${evt}");`;
      });
      snippet += `\n</script>`;
    }

    return snippet;
  };

  const addTag = () => {
    if (!newTagKey.trim()) return;
    setConfig(c => ({ ...c, custom_tags: [...c.custom_tags, { key: newTagKey.trim(), value: newTagValue.trim() }] }));
    setNewTagKey('');
    setNewTagValue('');
  };

  const removeTag = (idx: number) => {
    setConfig(c => ({ ...c, custom_tags: c.custom_tags.filter((_, i) => i !== idx) }));
  };

  const addEvent = () => {
    if (!newEvent.trim()) return;
    setConfig(c => ({ ...c, custom_events: [...c.custom_events, newEvent.trim()] }));
    setNewEvent('');
  };

  const removeEvent = (idx: number) => {
    setConfig(c => ({ ...c, custom_events: c.custom_events.filter((_, i) => i !== idx) }));
  };

  const addMaskRule = () => {
    if (!newMaskSelector.trim()) return;
    setConfig(c => ({ ...c, masking_rules: [...c.masking_rules, { selector: newMaskSelector.trim(), action: newMaskAction }] }));
    setNewMaskSelector('');
  };

  const removeMaskRule = (idx: number) => {
    setConfig(c => ({ ...c, masking_rules: c.masking_rules.filter((_, i) => i !== idx) }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading Clarity configuration...</div>;
  }

  const clarityUrl = config.project_id ? `https://clarity.microsoft.com/projects/view/${config.project_id}` : null;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Microsoft Clarity</CardTitle>
                <CardDescription>Free heatmaps, session recordings, and behavioral analytics</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">100% Free</Badge>
              <div className="flex items-center gap-2">
                <Label htmlFor="clarity-active" className="text-sm">Active</Label>
                <Switch
                  id="clarity-active"
                  checked={config.is_active}
                  onCheckedChange={v => setConfig(c => ({ ...c, is_active: v }))}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="setup" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Setup</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Live Dashboard</TabsTrigger>
          <TabsTrigger value="heatmaps" className="gap-1.5"><MousePointerClick className="h-3.5 w-3.5" /> Heatmaps</TabsTrigger>
          <TabsTrigger value="recordings" className="gap-1.5"><Video className="h-3.5 w-3.5" /> Recordings</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Flame className="h-3.5 w-3.5" /> Smart Events</TabsTrigger>
          <TabsTrigger value="identify" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Identify</TabsTrigger>
          <TabsTrigger value="tags" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Tags & Events</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Privacy</TabsTrigger>
          <TabsTrigger value="snippet" className="gap-1.5"><Code className="h-3.5 w-3.5" /> Snippet</TabsTrigger>
        </TabsList>

        {/* EMBEDDED DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          {config.project_id ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg">Clarity Live Dashboard</CardTitle>
                      <CardDescription>View heatmaps, recordings, and insights directly inside NexusTrack</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://clarity.microsoft.com/projects/view/${config.project_id}/dashboard`} target="_blank" rel="noopener">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in Clarity
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden bg-background">
                    <iframe
                      src={`https://clarity.microsoft.com/projects/view/${config.project_id}/dashboard`}
                      className="w-full border-0"
                      style={{ height: '700px' }}
                      title="Microsoft Clarity Dashboard"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 If the dashboard doesn't load, you may need to sign into Clarity first.
                    <a href="https://clarity.microsoft.com" target="_blank" rel="noopener" className="text-primary underline ml-1">Sign in →</a>
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <EmbedLinkCard
                  title="Heatmaps"
                  icon={<MousePointerClick className="h-5 w-5 text-primary" />}
                  url={`https://clarity.microsoft.com/projects/view/${config.project_id}/heatmaps`}
                />
                <EmbedLinkCard
                  title="Recordings"
                  icon={<Video className="h-5 w-5 text-info" />}
                  url={`https://clarity.microsoft.com/projects/view/${config.project_id}/recordings`}
                />
                <EmbedLinkCard
                  title="Insights"
                  icon={<Flame className="h-5 w-5 text-destructive" />}
                  url={`https://clarity.microsoft.com/projects/view/${config.project_id}/dashboard`}
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-1">No Project Connected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your Clarity Project ID in the Setup tab to view your dashboard here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SETUP */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connect Microsoft Clarity</CardTitle>
              <CardDescription>
                Enter your Clarity Project ID to enable tracking. Get it from{' '}
                <a href="https://clarity.microsoft.com" target="_blank" rel="noopener" className="text-primary underline">clarity.microsoft.com</a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Clarity Project ID</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. abc123xyz"
                    value={config.project_id}
                    onChange={e => setConfig(c => ({ ...c, project_id: e.target.value }))}
                  />
                  <Button onClick={saveConfig} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Find this in Clarity → Settings → Overview → Project ID
                </p>
              </div>
              {clarityUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={clarityUrl} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Open Clarity Dashboard
                  </a>
                </Button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <SetupStepCard step={1} title="Create Account" description="Sign up for free at clarity.microsoft.com" />
                <SetupStepCard step={2} title="Create Project" description="Add your website and get your Project ID" />
                <SetupStepCard step={3} title="Install Snippet" description="Copy the generated snippet and add it to your site" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HEATMAPS */}
        <TabsContent value="heatmaps" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<MousePointerClick className="h-5 w-5" />}
              title="Click Heatmaps"
              description="See where users click most on every page. Identify which buttons and links get the most engagement."
              color="text-primary"
              clarityUrl={clarityUrl ? `${clarityUrl}/heatmaps` : undefined}
            />
            <FeatureCard
              icon={<ScrollText className="h-5 w-5" />}
              title="Scroll Heatmaps"
              description="Discover how far users scroll on each page. Find the fold line where attention drops off."
              color="text-info"
              clarityUrl={clarityUrl ? `${clarityUrl}/heatmaps` : undefined}
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Area Heatmaps"
              description="Aggregate click data by page area to understand which sections drive the most interaction."
              color="text-success"
              clarityUrl={clarityUrl ? `${clarityUrl}/heatmaps` : undefined}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Heatmaps are automatically generated by Clarity once the tracking snippet is installed. View them in real-time on your Clarity dashboard.
                Clarity supports click, scroll, and area heatmaps across all pages — including mobile and tablet views.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SESSION RECORDINGS */}
        <TabsContent value="recordings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={<Video className="h-5 w-5" />}
              title="Session Recordings"
              description="Watch real user sessions to understand navigation patterns, confusion points, and conversion blockers. Up to 100,000 recordings/day."
              color="text-primary"
              clarityUrl={clarityUrl ? `${clarityUrl}/recordings` : undefined}
            />
            <FeatureCard
              icon={<ArrowUpDown className="h-5 w-5" />}
              title="Session Prioritization"
              description="Use the upgrade API to prioritize recording specific types of sessions — like checkout flows or error pages."
              color="text-warning"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prioritize Session Recording</CardTitle>
              <CardDescription>Use this code on specific pages to ensure they're always recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{`// Prioritize recording for important user flows
window.clarity("upgrade", "checkout-flow");
window.clarity("upgrade", "signup-form");
window.clarity("upgrade", "error-page");`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => copyToClipboard(`window.clarity("upgrade", "checkout-flow");`, 'upgrade')}
                >
                  {copied === 'upgrade' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMART EVENTS / INSIGHTS */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightCard
              icon={<Flame className="h-5 w-5 text-destructive" />}
              title="Rage Clicks"
              description="Users clicking rapidly on the same element — indicates frustration with unresponsive UI"
              badge="Auto-detected"
            />
            <InsightCard
              icon={<MousePointerClick className="h-5 w-5 text-warning" />}
              title="Dead Clicks"
              description="Clicks on non-interactive elements — suggests misleading visual design"
              badge="Auto-detected"
            />
            <InsightCard
              icon={<ScrollText className="h-5 w-5 text-info" />}
              title="Excessive Scrolling"
              description="Users scrolling back and forth repeatedly — indicates they can't find what they need"
              badge="Auto-detected"
            />
            <InsightCard
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
              title="Quick Backs"
              description="Users navigating to a page and immediately going back — signals poor content or wrong link"
              badge="Auto-detected"
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                All smart events are automatically detected by Microsoft Clarity — no additional configuration required.
                Filter your session recordings by these events to quickly find and fix UX issues.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IDENTIFY */}
        <TabsContent value="identify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Identification</CardTitle>
              <CardDescription>
                Link Clarity sessions with your user accounts to track individual journeys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={config.identify_config.enabled}
                  onCheckedChange={v => setConfig(c => ({
                    ...c,
                    identify_config: { ...c.identify_config, enabled: v }
                  }))}
                />
                <Label>Enable user identification</Label>
              </div>
              {config.identify_config.enabled && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Custom ID Field Name</Label>
                    <Input
                      placeholder="e.g. userId, email, accountId"
                      value={config.identify_config.custom_id_field}
                      onChange={e => setConfig(c => ({
                        ...c,
                        identify_config: { ...c.identify_config, custom_id_field: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="relative">
                    <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{`// Call after user logs in
window.clarity("identify", userEmail, sessionId, pageId, userName);

// Minimal usage:
window.clarity("identify", "${config.identify_config.custom_id_field || 'user-id'}");`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => copyToClipboard(`window.clarity("identify", "${config.identify_config.custom_id_field || 'user-id'}");`, 'identify')}
                    >
                      {copied === 'identify' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}
              <Button onClick={saveConfig} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOM TAGS & EVENTS */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Tags</CardTitle>
              <CardDescription>Add key-value tags to filter and segment your Clarity sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Key (e.g. plan)" value={newTagKey} onChange={e => setNewTagKey(e.target.value)} className="flex-1" />
                <Input placeholder="Value (e.g. pro)" value={newTagValue} onChange={e => setNewTagValue(e.target.value)} className="flex-1" />
                <Button size="icon" variant="outline" onClick={addTag}><Plus className="h-4 w-4" /></Button>
              </div>
              {config.custom_tags.map((tag, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <Badge variant="secondary">{tag.key}</Badge>
                  <span className="text-sm text-muted-foreground">=</span>
                  <span className="text-sm">{tag.value}</span>
                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeTag(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {config.custom_tags.length > 0 && (
                <div className="relative">
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{config.custom_tags.map(t => `window.clarity("set", "${t.key}", "${t.value}");`).join('\n')}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => copyToClipboard(config.custom_tags.map(t => `window.clarity("set", "${t.key}", "${t.value}");`).join('\n'), 'tags')}
                  >
                    {copied === 'tags' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Events</CardTitle>
              <CardDescription>Track specific user actions as custom Clarity events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Event name (e.g. checkout_started)" value={newEvent} onChange={e => setNewEvent(e.target.value)} className="flex-1" />
                <Button size="icon" variant="outline" onClick={addEvent}><Plus className="h-4 w-4" /></Button>
              </div>
              {config.custom_events.map((evt, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-mono">{evt}</span>
                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeEvent(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {config.custom_events.length > 0 && (
                <div className="relative">
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{config.custom_events.map(e => `window.clarity("event", "${e}");`).join('\n')}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => copyToClipboard(config.custom_events.map(e => `window.clarity("event", "${e}");`).join('\n'), 'events')}
                  >
                    {copied === 'events' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
              <Button onClick={saveConfig} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save All'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACY MASKING */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Masking</CardTitle>
              <CardDescription>
                Control which content Clarity can see. By default, all input fields, numbers, and emails are masked.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="CSS selector (e.g. .payment-form)" value={newMaskSelector} onChange={e => setNewMaskSelector(e.target.value)} className="flex-1" />
                <select
                  value={newMaskAction}
                  onChange={e => setNewMaskAction(e.target.value as 'mask' | 'unmask')}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="mask">Mask</option>
                  <option value="unmask">Unmask</option>
                </select>
                <Button size="icon" variant="outline" onClick={addMaskRule}><Plus className="h-4 w-4" /></Button>
              </div>
              {config.masking_rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <code className="text-sm">{rule.selector}</code>
                  <Badge variant={rule.action === 'mask' ? 'destructive' : 'secondary'} className="text-xs">
                    {rule.action}
                  </Badge>
                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeMaskRule(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {config.masking_rules.length > 0 && (
                <div className="relative">
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{`<!-- Add these attributes to your HTML elements -->\n` +
config.masking_rules.map(r => `<div data-clarity-${r.action}="true"> <!-- ${r.selector} -->`).join('\n')}
                  </pre>
                </div>
              )}
              <Button onClick={saveConfig} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save Rules'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FULL SNIPPET */}
        <TabsContent value="snippet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generated Tracking Snippet</CardTitle>
              <CardDescription>
                Copy this complete snippet and add it to the <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> section of your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  readOnly
                  value={generateSnippet()}
                  className="font-mono text-xs min-h-[200px] bg-muted"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateSnippet(), 'snippet')}
                >
                  {copied === 'snippet' ? <><Check className="h-3.5 w-3.5 mr-1" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium mb-2">Consent Mode Integration</h4>
              <p className="text-xs text-muted-foreground mb-3">
                If you use a cookie consent banner, call this after the user consents:
              </p>
              <div className="relative">
                <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{`// Call after user accepts cookies
window.clarity("consent");`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => copyToClipboard('window.clarity("consent");', 'consent')}
                >
                  {copied === 'consent' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SetupStepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">{step}</span>
      </div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color, clarityUrl }: {
  icon: React.ReactNode; title: string; description: string; color: string; clarityUrl?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6 space-y-3">
        <div className={color}>{icon}</div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {clarityUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={clarityUrl} target="_blank" rel="noopener">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> View in Clarity
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({ icon, title, description, badge }: {
  icon: React.ReactNode; title: string; description: string; badge: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-2">
        <div className="flex items-center justify-between">
          {icon}
          <Badge variant="outline" className="text-xs">{badge}</Badge>
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
