import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Bell, Plus, AlertTriangle, CheckCircle2, TrendingUp, Cookie, Server, Zap, Clock, Activity, Shield, ArrowUpRight, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTrackingRealtime } from '@/hooks/useTrackingRealtime';
import { AnomalyDetection } from './AnomalyDetection';
import { AlertRulesEngine } from './AlertRulesEngine';
import { AdRecoveryMetrics } from './AdRecoveryMetrics';
import { CookieHealthMonitor } from './CookieHealthMonitor';

export function MonitoringDashboard() {
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();
  useTrackingRealtime(!!profile?.id);
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
        .select('id, status, created_at, source, destination, retry_count')
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

  const totalEvents = events.length;
  const deliveredCount = events.filter((e: any) => e.status === 'delivered').length;
  const failedCount = events.filter((e: any) => e.status === 'failed').length;
  const pendingCount = events.filter((e: any) => e.status === 'pending').length;
  const retriedCount = events.filter((e: any) => e.retry_count > 0).length;
  const successRate = totalEvents > 0 ? ((deliveredCount / totalEvents) * 100).toFixed(1) : '0.0';
  const errorRate = totalEvents > 0 ? ((failedCount / totalEvents) * 100).toFixed(1) : '0.0';
  const retryRecoveryRate = retriedCount > 0 ? ((events.filter((e: any) => e.retry_count > 0 && e.status === 'delivered').length / retriedCount) * 100).toFixed(0) : '0';

  // Uptime calculation (simplified: based on events in last 24h)
  const uptimePercent = useMemo(() => {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recent = events.filter((e: any) => new Date(e.created_at) >= h24);
    if (recent.length === 0) return '—';
    const delivered = recent.filter((e: any) => e.status === 'delivered').length;
    return ((delivered / recent.length) * 100).toFixed(2);
  }, [events]);

  const healthData = useMemo(() => {
    const now = new Date();
    const hours: { hour: string; success: number; failed: number; pending: number }[] = [];
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
        pending: hourEvents.filter((e: any) => e.status === 'pending').length,
      });
    }
    return hours;
  }, [events]);

  // Destination health matrix
  const destHealth = useMemo(() => {
    const map: Record<string, { total: number; delivered: number; failed: number }> = {};
    events.forEach((e: any) => {
      const d = e.destination || 'default';
      if (!map[d]) map[d] = { total: 0, delivered: 0, failed: 0 };
      map[d].total++;
      if (e.status === 'delivered') map[d].delivered++;
      if (e.status === 'failed') map[d].failed++;
    });
    return Object.entries(map).map(([name, s]) => ({
      name,
      ...s,
      rate: s.total > 0 ? ((s.delivered / s.total) * 100).toFixed(1) : '0',
      status: s.total > 0 && (s.delivered / s.total) >= 0.95 ? 'healthy' : s.total > 0 && (s.delivered / s.total) >= 0.8 ? 'degraded' : s.total > 0 ? 'down' : 'unknown',
    }));
  }, [events]);

  const sourceDistribution = useMemo(() => {
    const sources: Record<string, number> = {};
    events.forEach((e: any) => { sources[e.source || 'unknown'] = (sources[e.source || 'unknown'] || 0) + 1; });
    const colors = ['hsl(var(--primary))', '#f97316', '#94a3b8', '#22c55e', '#8b5cf6'];
    return Object.entries(sources).slice(0, 5).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [events]);

  const createAlert = async () => {
    if (!profile?.id || !alertName.trim()) return;
    const { error } = await supabase.from('tracking_alerts').insert({
      user_id: profile.id, name: alertName,
      condition: { metric: alertMetric, operator: 'gt', threshold: parseFloat(alertThreshold) } as any,
      notify_email: alertEmail || profile.email,
    });
    if (error) toast.error('Failed to create alert');
    else { toast.success('Alert created!'); setAlertDialogOpen(false); setAlertName(''); refetch(); }
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">👑 Admin Mode — Viewing all users' monitoring data</p>
        </div>
      )}

      {/* Uptime & Health Bar */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <Radio className="h-2 w-2 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">Tracking Infrastructure</h3>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Operational</Badge>
                </div>
                <p className="text-sm text-muted-foreground">24h Uptime: {uptimePercent === '—' ? 'No data' : `${uptimePercent}%`}</p>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase">Success</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{errorRate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase">Error</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{retryRecoveryRate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase">Recovery</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Delivered', value: deliveredCount.toLocaleString(), icon: CheckCircle2, color: 'text-green-600 bg-green-500/10' },
          { label: 'Failed', value: failedCount.toLocaleString(), icon: AlertTriangle, color: 'text-red-600 bg-red-500/10' },
          { label: 'Pending', value: pendingCount.toLocaleString(), icon: Clock, color: 'text-blue-600 bg-blue-500/10' },
          { label: 'Total (24h)', value: totalEvents.toLocaleString(), icon: Activity, color: 'text-primary bg-primary/10' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`h-9 w-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Destination Health Matrix */}
      {destHealth.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Destination Health Matrix
            </CardTitle>
            <CardDescription>Real-time delivery status per destination</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {destHealth.map((dest) => {
                const rate = parseFloat(dest.rate);
                const statusColor = dest.status === 'healthy' ? 'border-green-200 bg-green-500/5' : dest.status === 'degraded' ? 'border-yellow-200 bg-yellow-500/5' : 'border-red-200 bg-red-500/5';
                const statusLabel = dest.status === 'healthy' ? 'Healthy' : dest.status === 'degraded' ? 'Degraded' : 'Issues';
                const statusBadge = dest.status === 'healthy' ? 'bg-green-500/10 text-green-600 border-green-200' : dest.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-200' : 'bg-red-500/10 text-red-600 border-red-200';
                return (
                  <div key={dest.name} className={`p-3 rounded-lg border ${statusColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground truncate">{dest.name}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusBadge}`}>{statusLabel}</Badge>
                    </div>
                    <Progress value={rate} className="h-1.5 mb-2" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>✓ {dest.delivered} delivered</span>
                      <span>✗ {dest.failed} failed</span>
                      <span>{dest.rate}% rate</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Health Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Delivery Health (24h)</CardTitle>
          <CardDescription>Hourly breakdown of event processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {totalEvents === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No event data yet</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" name="Delivered" stackId="1" />
                  <Area type="monotone" dataKey="pending" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" name="Pending" stackId="1" />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="rgba(239,68,68,0.1)" name="Failed" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Anomaly Detection */}
      <AnomalyDetection events={events} />

      {/* Ad Recovery + Cookie Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdRecoveryMetrics events={events} />
        <CookieHealthMonitor events={events} />
      </div>

      {/* Source Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Cookie className="h-4 w-4 text-primary" /> Event Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {sourceDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No source data yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-[120px] w-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                    {sourceDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 flex-1">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Rules Engine */}
      <AlertRulesEngine />

      {/* Legacy Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Quick Alert</DialogTitle></DialogHeader>
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
                  <SelectItem value="delivery_rate">Delivery Rate (%)</SelectItem>
                  <SelectItem value="retry_rate">Retry Rate (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Threshold</Label><Input type="number" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="your@email.com" /></div>
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