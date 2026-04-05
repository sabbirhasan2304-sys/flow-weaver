import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Database, Shield, Clock, Repeat, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';
import { toast } from 'sonner';

const mockTimeline = [
  { time: '14:23:01', status: 'pending', label: 'Event received' },
  { time: '14:23:02', status: 'processing', label: 'PII scan passed' },
  { time: '14:23:02', status: 'processing', label: 'Consent verified' },
  { time: '14:23:03', status: 'failed', label: 'Meta CAPI — 500 error' },
  { time: '14:23:08', status: 'retried', label: 'Retry #1 (5s backoff)' },
  { time: '14:23:18', status: 'retried', label: 'Retry #2 (10s backoff)' },
  { time: '14:23:18', status: 'delivered', label: 'Meta CAPI — 200 OK' },
];

const statusIcon: Record<string, any> = {
  pending: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  processing: <RefreshCw className="h-3.5 w-3.5 text-purple-500" />,
  failed: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  retried: <Repeat className="h-3.5 w-3.5 text-yellow-500" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
};

export function ReliabilityEngine() {
  const [retentionDays, setRetentionDays] = useState(90);
  const [maxRetries, setMaxRetries] = useState(10);
  const [backoffStrategy, setBackoffStrategy] = useState('exponential_jitter');
  const [dedupEnabled, setDedupEnabled] = useState(true);
  const [dedupWindow, setDedupWindow] = useState(5);
  const [dedupKeys, setDedupKeys] = useState('event_name, user_id, transaction_id');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">99.2%</p>
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
              <p className="text-xl font-bold text-foreground">847</p>
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
              <p className="text-xl font-bold text-foreground">1.2M</p>
              <p className="text-xs text-muted-foreground">Events Backed Up</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">342</p>
              <p className="text-xs text-muted-foreground">Deduped Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Receipt Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Receipt Timeline</CardTitle>
          <CardDescription>Visual trace of event processing stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
            {mockTimeline.map((step, i) => (
              <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                <div className="absolute left-[-13px] mt-1 bg-background">{statusIcon[step.status]}</div>
                <div className="ml-4">
                  <p className="text-sm text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
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
              <span>7 days</span>
              <span>90 days</span>
              <span>1 year</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '30 days', value: 30, tier: 'Starter' },
              { label: '90 days', value: 90, tier: 'Pro' },
              { label: '365 days', value: 365, tier: 'Business' },
            ].map((p) => (
              <Button
                key={p.value}
                variant={retentionDays === p.value ? 'default' : 'outline'}
                size="sm"
                className="flex flex-col h-auto py-2"
                onClick={() => setRetentionDays(p.value)}
              >
                <span>{p.label}</span>
                <span className="text-[10px] opacity-70">{p.tier}</span>
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
