import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bell, Plus, AlertTriangle, CheckCircle2, TrendingUp, Shield, Cookie, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTrackingRealtime } from '@/hooks/useTrackingRealtime';

export function MonitoringDashboard() {
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertMetric, setAlertMetric] = useState('error_rate');
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [alertEmail, setAlertEmail] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['tracking-events-monitoring', profile?.id, isAdmin],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_events')
        .select('id, status, created_at, source, destination')
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000,
  });

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ['tracking-alerts', profile?.id, isAdmin],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from('tracking_alerts').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Compute real stats from events
  const totalEvents = events.length;
  const deliveredCount = events.filter((e: any) => e.status === 'delivered').length;
  const failedCount = events.filter((e: any) => e.status === 'failed').length;
  const successRate = totalEvents > 0 ? ((deliveredCount / totalEvents) * 100).toFixed(1) : '0.0';

  // Build hourly chart from real data (last 24h)
  const healthData = useMemo(() => {
    const now = new Date();
    const hours: { hour: string; success: number; failed: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      const hourEvents = events.filter((e: any) => {
        const t = new Date(e.created_at);
        return t >= hourStart && t < hourEnd;
      });
      hours.push({
        hour: `${hourStart.getHours()}:00`,
        success: hourEvents.filter((e: any) => e.status === 'delivered').length,
        failed: hourEvents.filter((e: any) => e.status === 'failed').length,
      });
    }
    return hours;
  }, [events]);

  // Source distribution for cookie health (based on real sources)
  const sourceDistribution = useMemo(() => {
    const sources: Record<string, number> = {};
    events.forEach((e: any) => {
      const src = e.source || 'unknown';
      sources[src] = (sources[src] || 0) + 1;
    });
    const colors = ['hsl(var(--primary))', '#f97316', '#94a3b8', '#22c55e', '#8b5cf6'];
    return Object.entries(sources).slice(0, 5).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [events]);

  // Destination distribution for bot-like analysis
  const destinationStats = useMemo(() => {
    const dests: Record<string, number> = {};
    events.forEach((e: any) => {
      const dest = e.destination || 'No destination';
      dests[dest] = (dests[dest] || 0) + 1;
    });
    return Object.entries(dests)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [events]);

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

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">👑 Admin Mode — Viewing all users' monitoring data</p>
        </div>
      )}

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{successRate}%</p>
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
              <p className="text-2xl font-bold text-foreground">{failedCount}</p>
              <p className="text-xs text-muted-foreground">Failed Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalEvents.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Health Chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Delivery Health (24h)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {totalEvents === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No event data yet. Events will appear here once tracking is active.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" name="Delivered" />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="rgba(239,68,68,0.1)" name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Source & Destination Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Cookie className="h-4 w-4 text-primary" /> Event Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No source data yet</p>
            ) : (
              <>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                        {sourceDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-1">
                  {sourceDistribution.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Destination Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Destination Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {destinationStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No destination data yet</p>
            ) : (
              <div className="space-y-2">
                {destinationStats.map((b) => (
                  <div key={b.source} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{b.source}</span>
                    <span className="text-muted-foreground">{b.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
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
