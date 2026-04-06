import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig
} from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  TrendingUp, Zap, CheckCircle2, XCircle, Clock, Mail,
  Activity, ArrowRight, BarChart3
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const chartConfig: ChartConfig = {
  successful: { label: 'Successful', color: 'hsl(142.1 76.2% 36.3%)' },
  failed: { label: 'Failed', color: 'hsl(346.8 77.2% 49.8%)' },
  sent: { label: 'Sent', color: 'hsl(var(--primary))' },
};

export function UserDashboardStats() {
  const { profile, activeWorkspace } = useAuth();

  // Fetch execution stats for user's workflows over 7 days
  const { data: execStats } = useQuery({
    queryKey: ['user-exec-stats', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;

      // Get user's workflow IDs
      const { data: workflows } = await supabase
        .from('workflows')
        .select('id')
        .eq('workspace_id', activeWorkspace.id);

      if (!workflows || workflows.length === 0) return { daily: [], totals: { total: 0, successful: 0, failed: 0, running: 0 }, recentExecs: [] };

      const wfIds = workflows.map(w => w.id);

      // Get daily stats for 7 days
      const daily = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { data: dayExecs } = await supabase
          .from('executions')
          .select('status')
          .in('workflow_id', wfIds)
          .gte('started_at', dayStart)
          .lte('started_at', dayEnd);

        daily.push({
          date: format(date, 'EEE'),
          successful: dayExecs?.filter(e => e.status === 'completed').length || 0,
          failed: dayExecs?.filter(e => e.status === 'failed').length || 0,
        });
      }

      // Get totals
      const { data: allExecs } = await supabase
        .from('executions')
        .select('status')
        .in('workflow_id', wfIds);

      const totals = {
        total: allExecs?.length || 0,
        successful: allExecs?.filter(e => e.status === 'completed').length || 0,
        failed: allExecs?.filter(e => e.status === 'failed').length || 0,
        running: allExecs?.filter(e => e.status === 'running').length || 0,
      };

      // Recent executions
      const { data: recent } = await supabase
        .from('executions')
        .select('id, status, started_at, workflow_id')
        .in('workflow_id', wfIds)
        .order('started_at', { ascending: false })
        .limit(5);

      // Map workflow names
      const { data: wfNames } = await supabase
        .from('workflows')
        .select('id, name')
        .in('id', wfIds);
      const nameMap = new Map(wfNames?.map(w => [w.id, w.name]) || []);

      const recentExecs = (recent || []).map(e => ({
        ...e,
        workflow_name: nameMap.get(e.workflow_id) || 'Unknown',
      }));

      return { daily, totals, recentExecs };
    },
    enabled: !!activeWorkspace,
  });

  // Fetch email campaign stats for user
  const { data: emailStats } = useQuery({
    queryKey: ['user-email-stats', profile?.id],
    queryFn: async () => {
      if (!profile) return null;

      const [
        { count: totalContacts },
        { count: totalCampaigns },
        { data: campaigns },
      ] = await Promise.all([
        supabase.from('email_contacts').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id),
        supabase.from('email_campaigns').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id),
        supabase.from('email_campaigns').select('total_sent, total_opens, total_clicks').eq('profile_id', profile.id),
      ]);

      const totalSent = campaigns?.reduce((a, c) => a + (c.total_sent || 0), 0) || 0;
      const totalOpens = campaigns?.reduce((a, c) => a + (c.total_opens || 0), 0) || 0;
      const totalClicks = campaigns?.reduce((a, c) => a + (c.total_clicks || 0), 0) || 0;

      return {
        contacts: totalContacts || 0,
        campaigns: totalCampaigns || 0,
        sent: totalSent,
        opens: totalOpens,
        clicks: totalClicks,
        openRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0',
        clickRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0',
      };
    },
    enabled: !!profile,
  });

  const hasExecData = (execStats?.totals?.total || 0) > 0;
  const hasEmailData = (emailStats?.sent || 0) > 0 || (emailStats?.contacts || 0) > 0;

  if (!hasExecData && !hasEmailData) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* Execution Stats */}
      {hasExecData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Mini execution chart */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Execution Trends
                  </CardTitle>
                  <CardDescription className="text-xs">Last 7 days</CardDescription>
                </div>
                <Link to="/executions" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[160px]">
                <AreaChart data={execStats?.daily || []}>
                  <defs>
                    <linearGradient id="userFillSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="userFillFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(346.8 77.2% 49.8%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(346.8 77.2% 49.8%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="successful" stroke="hsl(142.1 76.2% 36.3%)" fill="url(#userFillSuccess)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" stroke="hsl(346.8 77.2% 49.8%)" fill="url(#userFillFailed)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Execution summary */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Execution Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                  <p className="text-xl font-bold text-foreground">{execStats?.totals?.total || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{execStats?.totals?.successful || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Successful</p>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-center">
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{execStats?.totals?.failed || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Failed</p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{execStats?.totals?.running || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Running</p>
                </div>
              </div>

              {/* Recent executions */}
              {(execStats?.recentExecs?.length || 0) > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Recent</p>
                  {execStats?.recentExecs?.slice(0, 3).map((exec: any) => (
                    <div key={exec.id} className="flex items-center gap-2 text-xs">
                      {exec.status === 'completed' ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      ) : exec.status === 'failed' ? (
                        <XCircle className="h-3 w-3 text-rose-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      )}
                      <span className="truncate flex-1">{exec.workflow_name}</span>
                      <span className="text-muted-foreground">{format(new Date(exec.started_at), 'HH:mm')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Stats Bar */}
      {hasEmailData && (
        <Card className="border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contacts</p>
                    <p className="text-sm font-bold">{emailStats?.contacts?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                  <p className="text-sm font-bold">{emailStats?.campaigns}</p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Emails Sent</p>
                  <p className="text-sm font-bold">{emailStats?.sent?.toLocaleString()}</p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Open Rate</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{emailStats?.openRate}%</p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Click Rate</p>
                  <p className="text-sm font-bold text-primary">{emailStats?.clickRate}%</p>
                </div>
              </div>
              <Link to="/email-marketing" className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0">
                Email <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
