import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertTriangle, Zap, ShoppingBag, BarChart3, Globe, ArrowUpRight, ArrowDownRight, Clock, Server, Radio, TrendingUp, Wifi, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo } from 'react';
import { AISetupAssistant } from './AISetupAssistant';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { useTrackingRealtime } from '@/hooks/useTrackingRealtime';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TrackingOverviewProps {
  onNavigateToConnect?: () => void;
}

export function TrackingOverview({ onNavigateToConnect }: TrackingOverviewProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();
  useTrackingRealtime(!!profile?.id);

  const { data: events = [] } = useQuery({
    queryKey: ['tracking-events-overview', profile?.id, isAdmin],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 15000,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['tracking-events-stats', profile?.id, isAdmin],
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

  const { data: pipelines = [] } = useQuery({
    queryKey: ['tracking-pipelines-count', profile?.id, isAdmin],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_pipelines')
        .select('id, status, name');
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['tracking-destinations-overview', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_destinations')
        .select('id, name, type, is_active');
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const totalEvents = allEvents.length;
  const deliveredEvents = allEvents.filter((e: any) => e.status === 'delivered').length;
  const failedEvents = allEvents.filter((e: any) => e.status === 'failed').length;
  const pendingEvents = allEvents.filter((e: any) => e.status === 'pending').length;
  const retriedEvents = allEvents.filter((e: any) => e.retry_count > 0).length;
  const activePipelines = pipelines.filter((p: any) => p.status === 'active').length;
  const activeDestinations = destinations.filter((d: any) => d.is_active).length;
  const deliveryRate = totalEvents > 0 ? ((deliveredEvents / totalEvents) * 100).toFixed(1) : '—';

  // Hourly throughput chart
  const hourlyData = useMemo(() => {
    const now = new Date();
    const hours: { hour: string; events: number; delivered: number; failed: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      const hourEvents = allEvents.filter((e: any) => {
        const t = new Date(e.created_at);
        return t >= hourStart && t < hourEnd;
      });
      hours.push({
        hour: `${hourStart.getHours()}:00`,
        events: hourEvents.length,
        delivered: hourEvents.filter((e: any) => e.status === 'delivered').length,
        failed: hourEvents.filter((e: any) => e.status === 'failed').length,
      });
    }
    return hours;
  }, [allEvents]);

  // Source breakdown for pie chart
  const sourceBreakdown = useMemo(() => {
    const sources: Record<string, number> = {};
    allEvents.forEach((e: any) => {
      const src = e.source || 'unknown';
      sources[src] = (sources[src] || 0) + 1;
    });
    const colors = ['hsl(var(--primary))', '#f97316', '#22c55e', '#8b5cf6', '#06b6d4', '#ec4899'];
    return Object.entries(sources).slice(0, 6).map(([name, value], i) => ({
      name, value, color: colors[i % colors.length],
    }));
  }, [allEvents]);

  // Destination health
  const destinationHealth = useMemo(() => {
    const destMap: Record<string, { total: number; delivered: number; failed: number }> = {};
    allEvents.forEach((e: any) => {
      const dest = e.destination || 'default';
      if (!destMap[dest]) destMap[dest] = { total: 0, delivered: 0, failed: 0 };
      destMap[dest].total++;
      if (e.status === 'delivered') destMap[dest].delivered++;
      if (e.status === 'failed') destMap[dest].failed++;
    });
    return Object.entries(destMap).map(([name, stats]) => ({
      name,
      ...stats,
      rate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : '0',
    }));
  }, [allEvents]);

  const statusColors: Record<string, string> = {
    delivered: 'bg-green-500/10 text-green-600 border-green-200',
    failed: 'bg-red-500/10 text-red-600 border-red-200',
    retried: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    pending: 'bg-blue-500/10 text-blue-600 border-blue-200',
  };

  const quickStarts = [
    { label: 'Connect Shopify', icon: ShoppingBag, color: 'bg-green-500/10 text-green-600', desc: 'E-commerce tracking' },
    { label: 'Connect Meta CAPI', icon: Globe, color: 'bg-blue-500/10 text-blue-600', desc: 'Facebook conversions' },
    { label: 'Connect GA4', icon: BarChart3, color: 'bg-orange-500/10 text-orange-600', desc: 'Google Analytics' },
    { label: 'Connect TikTok', icon: Target, color: 'bg-pink-500/10 text-pink-600', desc: 'TikTok Events API' },
  ];

  // System health score
  const healthScore = useMemo(() => {
    if (totalEvents === 0) return 0;
    const rate = (deliveredEvents / totalEvents) * 100;
    if (rate >= 99) return 100;
    if (rate >= 95) return 85;
    if (rate >= 90) return 70;
    if (rate >= 80) return 50;
    return 30;
  }, [totalEvents, deliveredEvents]);

  const healthLabel = healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Good' : healthScore >= 50 ? 'Fair' : healthScore > 0 ? 'Needs Attention' : 'No Data';
  const healthColor = healthScore >= 85 ? 'text-green-600' : healthScore >= 70 ? 'text-blue-600' : healthScore >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">👑 Admin Mode — Viewing all users' tracking data</p>
        </div>
      )}

      {/* System Health Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center ${healthScore >= 85 ? 'bg-green-500/10' : healthScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                  <Server className={`h-6 w-6 ${healthColor}`} />
                </div>
                {totalEvents > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <Radio className="h-2.5 w-2.5 text-white animate-pulse" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">System Health</h3>
                  <Badge variant="outline" className={healthColor}>{healthLabel}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {totalEvents > 0
                    ? `${deliveredEvents.toLocaleString()} of ${totalEvents.toLocaleString()} events delivered successfully`
                    : 'Connect your website to start tracking events'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{activePipelines}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pipelines</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-foreground">{activeDestinations}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Destinations</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className={`text-2xl font-bold ${healthColor}`}>{deliveryRate === '—' ? '—' : `${deliveryRate}%`}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Delivery</p>
              </div>
            </div>
          </div>
          {totalEvents > 0 && (
            <div className="mt-3">
              <Progress value={parseFloat(deliveryRate === '—' ? '0' : deliveryRate)} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Events', value: totalEvents.toLocaleString(), icon: Activity, trend: totalEvents === 0 ? 'Start tracking' : 'Last 1000', color: 'bg-primary/10 text-primary' },
          { label: 'Delivered', value: deliveredEvents.toLocaleString(), icon: CheckCircle2, trend: `${deliveryRate}% rate`, color: 'bg-green-500/10 text-green-600' },
          { label: 'Failed', value: failedEvents.toLocaleString(), icon: AlertTriangle, trend: failedEvents === 0 ? 'All clear ✓' : 'Check DLQ', color: 'bg-red-500/10 text-red-600' },
          { label: 'Pending', value: pendingEvents.toLocaleString(), icon: Clock, trend: 'In queue', color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Auto-Retried', value: retriedEvents.toLocaleString(), icon: TrendingUp, trend: `${retriedEvents} recovered`, color: 'bg-yellow-500/10 text-yellow-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Throughput Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Event Throughput (12h)</CardTitle>
          </CardHeader>
          <CardContent>
            {totalEvents === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <Wifi className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No event data yet</p>
                </div>
              </div>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={30} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="delivered" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" name="Delivered" />
                    <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="rgba(239,68,68,0.1)" name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Event Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceBreakdown.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">No source data</div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-[120px] w-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceBreakdown} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                        {sourceBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 w-full">
                  {sourceBreakdown.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground truncate max-w-[100px]">{d.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Destination Health */}
      {destinationHealth.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Destination Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {destinationHealth.map((dest) => {
                const rate = parseFloat(dest.rate);
                const isHealthy = rate >= 95;
                return (
                  <div key={dest.name} className="p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground truncate">{dest.name}</span>
                      <Badge variant="outline" className={isHealthy ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-yellow-500/10 text-yellow-600 border-yellow-200'}>
                        {dest.rate}%
                      </Badge>
                    </div>
                    <Progress value={rate} className="h-1" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{dest.delivered} delivered</span>
                      <span>{dest.failed} failed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Integrations</CardTitle>
          <CardDescription>Connect your platforms in minutes with server-side tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickStarts.map((qs) => {
              const Icon = qs.icon;
              return (
                <Button key={qs.label} variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={onNavigateToConnect}>
                  <div className={`h-10 w-10 rounded-lg ${qs.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{qs.label}</span>
                  <span className="text-[10px] text-muted-foreground">{qs.desc}</span>
                </Button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => setAiOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              AI Setup Assistant — Analyze Your Website
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Event Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Live Event Stream</CardTitle>
              <CardDescription>Real-time events from your connected sources</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden sm:table-cell">Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Retries</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No events yet. Connect a website to start tracking.</p>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium text-sm">{event.event_name}</TableCell>
                    <TableCell className="text-sm">{event.source}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{event.destination || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[event.status] || ''}`}>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {event.retry_count > 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600">{event.retry_count}x</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AISetupAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}