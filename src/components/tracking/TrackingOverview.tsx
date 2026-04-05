import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertTriangle, Zap, ShoppingBag, BarChart3, Globe } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { AISetupAssistant } from './AISetupAssistant';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { useTrackingRealtime } from '@/hooks/useTrackingRealtime';

export function TrackingOverview() {
  const [aiOpen, setAiOpen] = useState(false);
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();

  const { data: events = [] } = useQuery({
    queryKey: ['tracking-events-overview', profile?.id, isAdmin],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
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
        .select('id, status, created_at')
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
        .select('id, status');
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const totalEvents = allEvents.length;
  const deliveredEvents = allEvents.filter((e: any) => e.status === 'delivered').length;
  const failedEvents = allEvents.filter((e: any) => e.status === 'failed').length;
  const activePipelines = pipelines.filter((p: any) => p.status === 'active').length;
  const deliveryRate = totalEvents > 0 ? ((deliveredEvents / totalEvents) * 100).toFixed(1) : '—';

  const stats = [
    { label: 'Events Processed', value: totalEvents.toLocaleString(), icon: Activity, trend: totalEvents === 0 ? 'Start tracking' : `${deliveredEvents} delivered` },
    { label: 'Delivery Rate', value: deliveryRate === '—' ? '—' : `${deliveryRate}%`, icon: CheckCircle2, trend: totalEvents === 0 ? 'No data yet' : `${deliveredEvents}/${totalEvents} events` },
    { label: 'Active Pipelines', value: activePipelines.toString(), icon: Zap, trend: activePipelines === 0 ? 'Create your first' : `${pipelines.length} total` },
    { label: 'Failed Events', value: failedEvents.toLocaleString(), icon: AlertTriangle, trend: failedEvents === 0 ? 'All clear' : 'Check dead letter queue' },
  ];

  const statusColors: Record<string, string> = {
    delivered: 'bg-green-500/10 text-green-600 border-green-200',
    failed: 'bg-red-500/10 text-red-600 border-red-200',
    retried: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    pending: 'bg-blue-500/10 text-blue-600 border-blue-200',
  };

  const quickStarts = [
    { label: 'Connect Shopify', icon: ShoppingBag, color: 'bg-green-500/10 text-green-600' },
    { label: 'Connect Meta CAPI', icon: Globe, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Connect GA4', icon: BarChart3, color: 'bg-orange-500/10 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">👑 Admin Mode — Viewing all users' tracking data</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickStarts.map((qs) => {
              const Icon = qs.icon;
              return (
                <Button key={qs.label} variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <div className={`h-10 w-10 rounded-lg ${qs.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{qs.label}</span>
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
            <CardTitle className="text-lg">Recent Events</CardTitle>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No events yet. Create a pipeline to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.event_name}</TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[event.status] || ''}>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
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
