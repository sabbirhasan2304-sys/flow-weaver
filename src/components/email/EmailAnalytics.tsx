import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Mail, MousePointerClick, AlertTriangle, UserMinus } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  sent_at: string | null;
  total_sent: number | null;
  total_opens: number | null;
  total_clicks: number | null;
  total_bounces: number | null;
  total_unsubscribes: number | null;
  created_at: string;
}

const chartConfig = {
  opens: { label: 'Opens', color: 'hsl(var(--chart-1))' },
  clicks: { label: 'Clicks', color: 'hsl(var(--chart-2))' },
  bounces: { label: 'Bounces', color: 'hsl(var(--chart-3))' },
  unsubscribes: { label: 'Unsubscribes', color: 'hsl(var(--chart-4))' },
  sent: { label: 'Sent', color: 'hsl(var(--chart-5))' },
};

export function EmailAnalytics() {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchCampaigns();
  }, [profile, range]);

  const fetchCampaigns = async () => {
    if (!profile) return;
    setLoading(true);
    const since = subDays(new Date(), Number(range)).toISOString();
    const { data } = await supabase
      .from('email_campaigns')
      .select('id, name, status, sent_at, total_sent, total_opens, total_clicks, total_bounces, total_unsubscribes, created_at')
      .eq('profile_id', profile.id)
      .gte('created_at', since)
      .order('created_at', { ascending: true });
    setCampaigns((data as CampaignRow[]) || []);
    setLoading(false);
  };

  // Aggregate by date
  const timeSeriesData = (() => {
    const map = new Map<string, { date: string; opens: number; clicks: number; bounces: number; unsubscribes: number; sent: number }>();
    campaigns.forEach(c => {
      const d = format(parseISO(c.sent_at || c.created_at), 'MMM dd');
      const existing = map.get(d) || { date: d, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, sent: 0 };
      existing.opens += c.total_opens || 0;
      existing.clicks += c.total_clicks || 0;
      existing.bounces += c.total_bounces || 0;
      existing.unsubscribes += c.total_unsubscribes || 0;
      existing.sent += c.total_sent || 0;
      map.set(d, existing);
    });
    return Array.from(map.values());
  })();

  const totals = campaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + (c.total_sent || 0),
      opens: acc.opens + (c.total_opens || 0),
      clicks: acc.clicks + (c.total_clicks || 0),
      bounces: acc.bounces + (c.total_bounces || 0),
      unsubscribes: acc.unsubscribes + (c.total_unsubscribes || 0),
    }),
    { sent: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 }
  );

  const openRate = totals.sent ? ((totals.opens / totals.sent) * 100).toFixed(1) : '0';
  const clickRate = totals.opens ? ((totals.clicks / totals.opens) * 100).toFixed(1) : '0';
  const bounceRate = totals.sent ? ((totals.bounces / totals.sent) * 100).toFixed(1) : '0';

  const pieData = [
    { name: 'Opens', value: totals.opens, fill: 'hsl(var(--chart-1))' },
    { name: 'Clicks', value: totals.clicks, fill: 'hsl(var(--chart-2))' },
    { name: 'Bounces', value: totals.bounces, fill: 'hsl(var(--chart-3))' },
    { name: 'Unsubscribes', value: totals.unsubscribes, fill: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0);

  // Per-campaign performance
  const campaignPerf = campaigns
    .filter(c => (c.total_sent || 0) > 0)
    .slice(-10)
    .map(c => ({
      name: c.name.length > 18 ? c.name.slice(0, 18) + '…' : c.name,
      opens: c.total_opens || 0,
      clicks: c.total_clicks || 0,
      bounces: c.total_bounces || 0,
    }));

  const kpiCards = [
    { label: 'Open Rate', value: `${openRate}%`, icon: Mail, color: 'text-chart-1', sub: `${totals.opens.toLocaleString()} opens` },
    { label: 'Click Rate', value: `${clickRate}%`, icon: MousePointerClick, color: 'text-chart-2', sub: `${totals.clicks.toLocaleString()} clicks` },
    { label: 'Bounce Rate', value: `${bounceRate}%`, icon: AlertTriangle, color: 'text-chart-3', sub: `${totals.bounces.toLocaleString()} bounces` },
    { label: 'Unsubscribes', value: totals.unsubscribes.toLocaleString(), icon: UserMinus, color: 'text-chart-4', sub: `from ${totals.sent.toLocaleString()} sent` },
  ];

  return (
    <div className="space-y-6 mt-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Campaign Analytics</h2>
          <p className="text-sm text-muted-foreground">{campaigns.length} campaigns in selected period</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Area Chart - Engagement Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Over Time</CardTitle>
          <CardDescription>Opens, clicks, bounces & unsubscribes by date</CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="opens" stackId="1" stroke="var(--color-opens)" fill="var(--color-opens)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="clicks" stackId="1" stroke="var(--color-clicks)" fill="var(--color-clicks)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="bounces" stackId="1" stroke="var(--color-bounces)" fill="var(--color-bounces)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="unsubscribes" stackId="1" stroke="var(--color-unsubscribes)" fill="var(--color-unsubscribes)" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No campaign data for this period</div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart - Per Campaign */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Last 10 campaigns with sends</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignPerf.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={campaignPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="opens" fill="var(--color-opens)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>Distribution of engagement types</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No engagement data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
