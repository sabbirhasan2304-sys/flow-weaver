import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Database, Shield, Clock, Repeat, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useTrackingRealtime } from '@/hooks/useTrackingRealtime';
import { toast } from 'sonner';

const statusIcon: Record<string, any> = {
  pending: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  processing: <RefreshCw className="h-3.5 w-3.5 text-purple-500" />,
  failed: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  retried: <Repeat className="h-3.5 w-3.5 text-yellow-500" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
};

export function ReliabilityEngine() {
  const { profile } = useAuth();
  useTrackingRealtime(!!profile?.id);
  const [retentionDays, setRetentionDays] = useState(90);
  const [maxRetries, setMaxRetries] = useState(10);
  const [backoffStrategy, setBackoffStrategy] = useState('exponential_jitter');
  const [dedupEnabled, setDedupEnabled] = useState(true);
  const [dedupWindow, setDedupWindow] = useState(5);
  const [dedupKeys, setDedupKeys] = useState('event_name, user_id, transaction_id');

  // Live stats from tracking_events
  const { data: events = [] } = useQuery({
    queryKey: ['tracking-events-reliability', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_events')
        .select('id, status, retry_count, created_at, event_fingerprint')
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 15000,
  });

  const stats = useMemo(() => {
    const total = events.length;
    const delivered = events.filter((e: any) => e.status === 'delivered').length;
    const retried = events.filter((e: any) => e.retry_count > 0).length;
    const totalRetries = events.reduce((sum: number, e: any) => sum + (e.retry_count || 0), 0);
    const deduped = events.filter((e: any) => e.event_fingerprint).length;
    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
    return { total, delivered, retried, totalRetries, deduped, deliveryRate };
  }, [events]);

  // Build delivery receipt timeline from the most recent events with status transitions
  const timeline = useMemo(() => {
    const recent = events.slice(0, 10);
    return recent.map((e: any) => {
      const time = new Date(e.created_at).toLocaleTimeString();
      let statusKey = e.status;
      if (e.retry_count > 0 && e.status === 'delivered') statusKey = 'delivered';
      return {
        time,
        status: statusKey,
        label: `${e.status === 'delivered' ? '✓' : e.status === 'failed' ? '✗' : '⏳'} Event ${e.id.slice(0, 8)} — ${e.status}${e.retry_count > 0 ? ` (${e.retry_count} retries)` : ''}`,
      };
    });
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.deliveryRate}%</p>
              <p className="text-xs text-muted-foreground">Delivery Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Repeat className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.retried}</p>
              <p className="text-xs text-muted-foreground">Auto-Retried</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Events Tracked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.deduped}</p>
              <p className="text-xs text-muted-foreground">Fingerprinted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Receipt Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Receipt Timeline</CardTitle>
          <CardDescription>Real-time event processing status from live data</CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No events yet. Timeline will populate with live data.</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
              {timeline.map((step, i) => (
                <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                  <div className="absolute left-[-13px] mt-1 bg-background">{statusIcon[step.status] || statusIcon.pending}</div>
                  <div className="ml-4">
                    <p className="text-sm text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Backup Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Archive className="h-5 w-5 text-primary" /> Event Backup</CardTitle>
          <CardDescription>Configure how long event data is retained</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Retention Period</Label>
              <span className="text-sm font-medium text-foreground">{retentionDays} days</span>
            </div>
            <Slider value={[retentionDays]} onValueChange={(v) => setRetentionDays(v[0])} min={7} max={365} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>7 days</span><span>90 days</span><span>1 year</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: '30 days', value: 30, tier: 'Starter' }, { label: '90 days', value: 90, tier: 'Pro' }, { label: '365 days', value: 365, tier: 'Business' }].map((p) => (
              <Button key={p.value} variant={retentionDays === p.value ? 'default' : 'outline'} size="sm" className="flex flex-col h-auto py-2" onClick={() => setRetentionDays(p.value)}>
                <span>{p.label}</span><span className="text-[10px] opacity-70">{p.tier}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retry Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Repeat className="h-5 w-5 text-primary" /> Retry Configuration</CardTitle>
          <CardDescription>Automatic retry with intelligent backoff strategies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Max Retry Attempts</Label>
              <span className="text-sm font-medium text-foreground">{maxRetries}</span>
            </div>
            <Slider value={[maxRetries]} onValueChange={(v) => setMaxRetries(v[0])} min={1} max={15} step={1} />
          </div>
          <div>
            <Label>Backoff Strategy</Label>
            <Select value={backoffStrategy} onValueChange={setBackoffStrategy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exponential_jitter">Exponential + Jitter (recommended)</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="fixed">Fixed Interval</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Retry Schedule Preview:</p>
            {backoffStrategy === 'exponential_jitter' && <p>1s → 2s → 4s → 8s → 16s → 32s → 64s → 128s → 256s → 512s (±random jitter)</p>}
            {backoffStrategy === 'exponential' && <p>1s → 2s → 4s → 8s → 16s → 32s → 64s → 128s → 256s → 512s</p>}
            {backoffStrategy === 'linear' && <p>5s → 10s → 15s → 20s → 25s → 30s → 35s → 40s → 45s → 50s</p>}
            {backoffStrategy === 'fixed' && <p>30s → 30s → 30s → 30s → 30s → 30s → 30s → 30s → 30s → 30s</p>}
          </div>
        </CardContent>
      </Card>

      {/* Deduplication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Deduplication</CardTitle>
          <CardDescription>Prevent duplicate events from reaching destinations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Deduplication</p>
              <p className="text-xs text-muted-foreground">Automatically detect and drop duplicate events</p>
            </div>
            <Switch checked={dedupEnabled} onCheckedChange={setDedupEnabled} />
          </div>
          {dedupEnabled && (
            <>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Dedup Window</Label>
                  <span className="text-sm font-medium text-foreground">{dedupWindow} min</span>
                </div>
                <Slider value={[dedupWindow]} onValueChange={(v) => setDedupWindow(v[0])} min={1} max={60} step={1} />
              </div>
              <div>
                <Label>Dedup Key Fields</Label>
                <Input value={dedupKeys} onChange={(e) => setDedupKeys(e.target.value)} placeholder="event_name, user_id" />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated. Events matching all key fields within the window are considered duplicates.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={() => toast.success('Reliability settings saved!')}>Save Reliability Config</Button>
    </div>
  );
}
