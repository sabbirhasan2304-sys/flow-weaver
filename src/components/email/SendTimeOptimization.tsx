import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Clock, Sparkles, TrendingUp, Zap, Calendar, Info, Sun, Moon, Sunset } from 'lucide-react';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const chartConfig = {
  score: { label: 'Engagement Score', color: 'hsl(var(--chart-1))' },
  opens: { label: 'Opens', color: 'hsl(var(--chart-2))' },
  clicks: { label: 'Clicks', color: 'hsl(var(--chart-3))' },
};

interface HeatmapCell {
  day: string;
  hour: number;
  score: number;
}

export function SendTimeOptimization() {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(false);
    const { data } = await supabase
      .from('email_campaigns')
      .select('id, name, sent_at, total_sent, total_opens, total_clicks, total_bounces')
      .eq('profile_id', profile.id)
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(100);
    setCampaigns(data || []);
    setLoading(false);
  };

  // Analyze engagement by hour
  const hourlyData = useMemo(() => {
    const buckets = HOURS.map(h => ({ hour: `${h}:00`, opens: 0, clicks: 0, sent: 0, score: 0 }));
    campaigns.forEach(c => {
      if (!c.sent_at) return;
      const h = new Date(c.sent_at).getUTCHours();
      buckets[h].opens += c.total_opens || 0;
      buckets[h].clicks += c.total_clicks || 0;
      buckets[h].sent += c.total_sent || 0;
    });
    buckets.forEach(b => {
      if (b.sent > 0) {
        const openRate = b.opens / b.sent;
        const clickRate = b.clicks / Math.max(b.opens, 1);
        b.score = Math.round((openRate * 60 + clickRate * 40) * 100);
      }
    });
    return buckets;
  }, [campaigns]);

  // Analyze by day of week
  const dayData = useMemo(() => {
    const buckets = DAYS.map(d => ({ day: d, score: 0, count: 0, opens: 0, sent: 0 }));
    campaigns.forEach(c => {
      if (!c.sent_at) return;
      const dayIdx = (new Date(c.sent_at).getUTCDay() + 6) % 7; // Mon=0
      buckets[dayIdx].opens += c.total_opens || 0;
      buckets[dayIdx].sent += c.total_sent || 0;
      buckets[dayIdx].count++;
    });
    buckets.forEach(b => {
      if (b.sent > 0) b.score = Math.round((b.opens / b.sent) * 100);
    });
    return buckets;
  }, [campaigns]);

  // Recommended send times
  const recommendations = useMemo(() => {
    const sorted = [...hourlyData].sort((a, b) => b.score - a.score);
    const top3 = sorted.filter(h => h.sent > 0).slice(0, 3);
    const bestDay = [...dayData].sort((a, b) => b.score - a.score).find(d => d.sent > 0);
    return { topHours: top3, bestDay };
  }, [hourlyData, dayData]);

  const getTimeIcon = (hour: string) => {
    const h = parseInt(hour);
    if (h >= 6 && h < 12) return Sun;
    if (h >= 12 && h < 18) return Sunset;
    return Moon;
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Send-Time Optimization
          </h2>
          <p className="text-sm text-muted-foreground">AI analyzes your campaign history to find the best times to send</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sto-enabled" className="text-sm">Auto-optimize</Label>
            <Switch id="sto-enabled" checked={enabled} onCheckedChange={(v) => { setEnabled(v); toast.success(v ? 'Send-time optimization enabled' : 'Disabled'); }} />
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length < 3 ? (
            <p className="text-sm text-muted-foreground">Send at least 3 campaigns to get personalized recommendations.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Best Send Hours</p>
                <div className="space-y-2">
                  {recommendations.topHours.map((h, i) => {
                    const Icon = getTimeIcon(h.hour);
                    return (
                      <div key={h.hour} className="flex items-center gap-3 bg-background rounded-lg p-2.5 border">
                        <Badge variant={i === 0 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {i + 1}
                        </Badge>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{h.hour}</span>
                        <div className="flex-1" />
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">Score: </span>
                          <span className="text-sm font-semibold text-primary">{h.score}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Best Day</p>
                {recommendations.bestDay && (
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold text-lg">{recommendations.bestDay.day}</p>
                        <p className="text-xs text-muted-foreground">
                          {recommendations.bestDay.score}% open rate · {recommendations.bestDay.count} campaigns sent
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-3 p-3 bg-background rounded-lg border">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      When auto-optimize is enabled, campaigns will be queued and sent at the optimal time for each contact based on their engagement history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Hourly engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Engagement by Hour</CardTitle>
            <CardDescription>Engagement score based on open + click rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Day of week radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Engagement by Day</CardTitle>
            <CardDescription>Open rate performance across weekdays</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <RadarChart data={dayData}>
                <PolarGrid className="stroke-border/50" />
                <PolarAngleAxis dataKey="day" fontSize={11} />
                <PolarRadiusAxis fontSize={10} />
                <Radar name="Score" dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.3} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Optimization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Dhaka">Dhaka (BST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Optimization Window</Label>
              <Select defaultValue="24h">
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4h">Within 4 hours</SelectItem>
                  <SelectItem value="8h">Within 8 hours</SelectItem>
                  <SelectItem value="24h">Within 24 hours</SelectItem>
                  <SelectItem value="48h">Within 48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
