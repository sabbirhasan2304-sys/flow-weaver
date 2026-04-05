import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, DollarSign, TrendingUp } from 'lucide-react';

interface AdRecoveryMetricsProps {
  events: any[];
  avgOrderValue?: number;
}

export function AdRecoveryMetrics({ events, avgOrderValue = 65 }: AdRecoveryMetricsProps) {
  const stats = useMemo(() => {
    const total = events.length;
    // Events from server-side sources are "recovered" (bypassed ad blockers)
    const serverSide = events.filter((e: any) =>
      e.source === 'server' || e.source === 'sgtm' || e.source === 'api' || e.source === 'webhook'
    ).length;
    const clientSide = total - serverSide;
    const recoveryRate = total > 0 ? ((serverSide / total) * 100) : 0;
    // Estimate: ~15-25% of client-side events would have been blocked
    const estimatedBlocked = Math.round(clientSide * 0.2);
    const recovered = serverSide;
    const revenueRecovered = recovered * avgOrderValue * 0.03; // ~3% are conversions

    // Daily breakdown for chart (last 7 days)
    const days: { day: string; recovered: number; blocked_est: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dayEvents = events.filter((e: any) => {
        const t = new Date(e.created_at);
        return t >= dayStart && t < dayEnd;
      });
      const dayServer = dayEvents.filter((e: any) =>
        e.source === 'server' || e.source === 'sgtm' || e.source === 'api' || e.source === 'webhook'
      ).length;
      const dayClient = dayEvents.length - dayServer;

      days.push({
        day: dayStart.toLocaleDateString('en', { weekday: 'short' }),
        recovered: dayServer,
        blocked_est: Math.round(dayClient * 0.2),
      });
    }

    return { total, serverSide, recoveryRate, estimatedBlocked, recovered, revenueRecovered, days };
  }, [events, avgOrderValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Ad Recovery Metrics
        </CardTitle>
        <CardDescription>Events recovered via server-side tracking, bypassing ad blockers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-xl font-bold text-green-600">{stats.recovered.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Events Recovered</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-xl font-bold text-primary">{stats.recoveryRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Recovery Rate</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-xl font-bold text-yellow-600">${stats.revenueRecovered.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground">Est. Revenue Saved</p>
          </div>
        </div>

        <div className="h-[160px]">
          {stats.days.every(d => d.recovered === 0 && d.blocked_est === 0) ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No recovery data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Bar dataKey="recovered" fill="hsl(var(--primary))" name="Recovered" radius={[2, 2, 0, 0]} />
                <Bar dataKey="blocked_est" fill="#f97316" name="Est. Blocked" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
