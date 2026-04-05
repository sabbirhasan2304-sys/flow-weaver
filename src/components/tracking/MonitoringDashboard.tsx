import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Bell, Plus, AlertTriangle, CheckCircle2, TrendingUp, Shield, Cookie, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const mockHealthData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  success: Math.floor(Math.random() * 100),
  failed: Math.floor(Math.random() * 8),
}));

const cookieData = [
  { name: 'First-party (server)', value: 62, color: 'hsl(var(--primary))' },
  { name: 'First-party (client)', value: 25, color: '#f97316' },
  { name: 'No cookies', value: 13, color: '#94a3b8' },
];

const botData = [
  { source: 'Googlebot', count: 3200, type: 'SEO' },
  { source: 'Bingbot', count: 1100, type: 'SEO' },
  { source: 'DataDog', count: 800, type: 'Monitor' },
  { source: 'Unknown Bot', count: 450, type: 'Suspicious' },
  { source: 'Human', count: 45000, type: 'Real' },
];

export function MonitoringDashboard() {
  const { profile } = useAuth();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertMetric, setAlertMetric] = useState('error_rate');
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [alertEmail, setAlertEmail] = useState('');

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ['tracking-alerts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from('tracking_alerts').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const createAlert = async () => {
    if (!profile?.id || !alertName.trim()) return;
    const { error } = await supabase.from('tracking_alerts').insert({
      user_id: profile.id,
      name: alertName,
      condition: { metric: alertMetric, operator: 'gt', threshold: parseFloat(alertThreshold) } as any,
      notify_email: alertEmail || profile.email,
    });
    if (error) toast.error('Failed to create alert');
    else {
      toast.success('Alert created!');
      setAlertDialogOpen(false);
      setAlertName('');
      refetch();
    }
  };

  const adRecoveryRate = 12.4;
  const recoveredRevenue = 4250;

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">98.7%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">23</p>
              <p className="text-xs text-muted-foreground">Failed Events (24h)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">1,847</p>
              <p className="text-xs text-muted-foreground">Events Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Health Chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Delivery Health (24h)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHealthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="rgba(239,68,68,0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* New: Ad Recovery, Cookie Health, Bot Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ad Recovery Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Ad Recovery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-1">
              <p className="text-3xl font-bold text-foreground">{adRecoveryRate}%</p>
              <p className="text-xs text-muted-foreground">Events recovered from ad-blocked users</p>
              <div className="mt-3 p-2 rounded-lg bg-green-500/10">
                <p className="text-sm font-medium text-green-600">+${recoveredRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-green-600/80">Estimated recovered revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Health Monitor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Cookie className="h-4 w-4 text-primary" /> Cookie Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cookieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                    {cookieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-1">
              {cookieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bot Traffic Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Bot Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {botData.map((b) => (
                <div key={b.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground font-medium">{b.source}</span>
                    <Badge variant="outline" className={
                      b.type === 'Real' ? 'bg-green-500/10 text-green-600 text-[10px]' :
                      b.type === 'Suspicious' ? 'bg-red-500/10 text-red-600 text-[10px]' :
                      'bg-blue-500/10 text-blue-600 text-[10px]'
                    }>{b.type}</Badge>
                  </div>
                  <span className="text-muted-foreground">{b.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">Bot ratio</span>
              <span className="font-medium text-foreground">
                {((botData.filter(b => b.type !== 'Real').reduce((s, b) => s + b.count, 0) / botData.reduce((s, b) => s + b.count, 0)) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Alert Rules</CardTitle>
            <Button size="sm" onClick={() => setAlertDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No alert rules yet. Create one to get notified about anomalies.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">{(alert.condition as any)?.metric} &gt; {(alert.condition as any)?.threshold}%</p>
                    </div>
                  </div>
                  <Badge variant={alert.is_active ? 'default' : 'secondary'}>{alert.is_active ? 'Active' : 'Paused'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Alert Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Alert Name</Label><Input value={alertName} onChange={(e) => setAlertName(e.target.value)} placeholder="e.g., High Error Rate" /></div>
            <div>
              <Label>Metric</Label>
              <Select value={alertMetric} onValueChange={setAlertMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="error_rate">Error Rate (%)</SelectItem>
                  <SelectItem value="event_drop">Event Drop (%)</SelectItem>
                  <SelectItem value="latency">Latency (ms)</SelectItem>
                  <SelectItem value="bot_rate">Bot Rate (%)</SelectItem>
                  <SelectItem value="ad_block_rate">Ad Block Rate (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Threshold</Label><Input type="number" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} /></div>
            <div><Label>Notification Email</Label><Input value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="your@email.com" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
            <Button onClick={createAlert}>Create Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
