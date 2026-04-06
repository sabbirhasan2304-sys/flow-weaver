import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Activity, Database, Users, Zap, Server, AlertTriangle,
  CheckCircle2, TrendingUp, HardDrive, Cpu, ArrowRight, Shield
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

interface CapacityItem {
  label: string;
  current: number;
  limit: number;
  unit: string;
  icon: React.ElementType;
  severity: 'ok' | 'warning' | 'critical';
  tip?: string;
}

export function SystemHealthWidget() {
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();

  const { data: stats } = useQuery({
    queryKey: ['system-health-stats', profile?.id],
    queryFn: async () => {
      const [
        { count: totalEvents },
        { count: totalUsers },
        { count: totalWorkflows },
        { count: totalDestinations },
        { count: totalCampaigns },
        { count: totalContacts },
      ] = await Promise.all([
        supabase.from('tracking_events').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('workflows').select('*', { count: 'exact', head: true }),
        supabase.from('tracking_destinations').select('*', { count: 'exact', head: true }),
        supabase.from('email_campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('email_contacts').select('*', { count: 'exact', head: true }),
      ]);
      return {
        events: totalEvents || 0,
        users: totalUsers || 0,
        workflows: totalWorkflows || 0,
        destinations: totalDestinations || 0,
        campaigns: totalCampaigns || 0,
        contacts: totalContacts || 0,
      };
    },
    enabled: !!profile?.id,
    refetchInterval: 60000,
  });

  const capacityItems: CapacityItem[] = useMemo(() => {
    if (!stats) return [];
    const items: CapacityItem[] = [
      {
        label: 'Tracking Events',
        current: stats.events,
        limit: 50000,
        unit: 'events',
        icon: Activity,
        severity: stats.events > 40000 ? 'critical' : stats.events > 25000 ? 'warning' : 'ok',
        tip: stats.events > 25000 ? 'Consider archiving old events' : undefined,
      },
      {
        label: 'Registered Users',
        current: stats.users,
        limit: 100,
        unit: 'users',
        icon: Users,
        severity: stats.users > 80 ? 'critical' : stats.users > 50 ? 'warning' : 'ok',
      },
      {
        label: 'Workflows',
        current: stats.workflows,
        limit: 500,
        unit: 'workflows',
        icon: Zap,
        severity: stats.workflows > 400 ? 'critical' : stats.workflows > 250 ? 'warning' : 'ok',
      },
      {
        label: 'Email Contacts',
        current: stats.contacts,
        limit: 10000,
        unit: 'contacts',
        icon: Users,
        severity: stats.contacts > 8000 ? 'critical' : stats.contacts > 5000 ? 'warning' : 'ok',
      },
      {
        label: 'Destinations',
        current: stats.destinations,
        limit: 50,
        unit: 'destinations',
        icon: Server,
        severity: stats.destinations > 40 ? 'warning' : 'ok',
      },
      {
        label: 'Campaigns',
        current: stats.campaigns,
        limit: 1000,
        unit: 'campaigns',
        icon: TrendingUp,
        severity: stats.campaigns > 800 ? 'warning' : 'ok',
      },
    ];
    return items;
  }, [stats]);

  const overallHealth = useMemo(() => {
    if (capacityItems.length === 0) return 'ok';
    if (capacityItems.some(i => i.severity === 'critical')) return 'critical';
    if (capacityItems.some(i => i.severity === 'warning')) return 'warning';
    return 'ok';
  }, [capacityItems]);

  const healthConfig = {
    ok: { label: 'Healthy', color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2 },
    warning: { label: 'Attention Needed', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: AlertTriangle },
    critical: { label: 'Action Required', color: 'bg-red-500/10 text-red-600 border-red-200', icon: AlertTriangle },
  };

  const improvements = useMemo(() => {
    const tips: { text: string; priority: 'high' | 'medium' | 'low'; link?: string }[] = [];

    if (!stats) return tips;

    // Always relevant
    tips.push({ text: 'Add database indexes on tracking_events for faster queries', priority: 'high' });

    if (stats.events > 10000) {
      tips.push({ text: 'Enable event archiving to keep database lean', priority: 'high' });
    }
    if (stats.destinations === 0) {
      tips.push({ text: 'Connect marketing destinations (Facebook, Google, TikTok)', priority: 'medium', link: '/tracking' });
    }
    if (stats.contacts === 0) {
      tips.push({ text: 'Import email contacts to start campaigns', priority: 'medium', link: '/email-marketing' });
    }
    if (stats.workflows < 2) {
      tips.push({ text: 'Create automation workflows to save time', priority: 'low', link: '/templates' });
    }

    tips.push({ text: 'Current tier supports ~50-100 concurrent users', priority: 'low' });

    return tips;
  }, [stats]);

  const { label: healthLabel, color: healthColor, icon: HealthIcon } = healthConfig[overallHealth];

  if (!stats) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">System Health & Usage</CardTitle>
              <CardDescription className="text-xs">Current infrastructure capacity</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={healthColor}>
            <HealthIcon className="h-3 w-3 mr-1" />
            {healthLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {capacityItems.map((item) => {
            const Icon = item.icon;
            const percent = Math.min((item.current / item.limit) * 100, 100);
            const barColor = item.severity === 'critical' ? 'bg-red-500' : item.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500';
            return (
              <div key={item.label} className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground leading-none mb-1.5">
                  {item.current.toLocaleString()}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">/ {item.limit.toLocaleString()}</span>
                </p>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Infrastructure Info */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2">
            <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">DB: <span className="font-medium text-foreground">86 MB / 500 MB</span></span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tier: <span className="font-medium text-foreground">Pico</span></span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Concurrent: <span className="font-medium text-foreground">~100</span></span>
          </div>
        </div>

        {/* Improvement Tips */}
        {isAdmin && improvements.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Recommendations</p>
            {improvements.slice(0, 4).map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  tip.priority === 'high' ? 'bg-red-500' : tip.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <span className="text-muted-foreground flex-1">{tip.text}</span>
                {tip.link && (
                  <Link to={tip.link} className="text-primary hover:underline flex-shrink-0">
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
