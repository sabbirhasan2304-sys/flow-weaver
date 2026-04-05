import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Cookie } from 'lucide-react';

interface CookieHealthMonitorProps {
  events: any[];
}

export function CookieHealthMonitor({ events }: CookieHealthMonitorProps) {
  const cookieData = useMemo(() => {
    // Classify events by source to infer cookie type
    const serverSet = events.filter((e: any) => e.source === 'server' || e.source === 'sgtm').length;
    const firstParty = events.filter((e: any) => e.source === 'web_pixel' || e.source === 'gtm').length;
    const thirdParty = events.filter((e: any) => e.source === 'third_party' || e.source === 'ad_network').length;
    const noCookie = events.length - serverSet - firstParty - thirdParty;

    const distribution = [
      { name: 'Server-set 1P', value: serverSet || 1, color: 'hsl(var(--primary))' },
      { name: 'Client 1P', value: firstParty || 1, color: '#22c55e' },
      { name: 'Third-party', value: thirdParty || 1, color: '#f97316' },
      { name: 'No cookie', value: Math.max(noCookie, 0) || 1, color: '#94a3b8' },
    ].filter(d => d.value > 0);

    // Cookie lifetime distribution (simulated based on patterns)
    const lifetimeData = [
      { range: '<1 day', count: Math.round(thirdParty * 0.6 + noCookie * 0.3) || 0 },
      { range: '1-7 days', count: Math.round(firstParty * 0.4) || 0 },
      { range: '7-30 days', count: Math.round(firstParty * 0.3) || 0 },
      { range: '30-90 days', count: Math.round(firstParty * 0.2) || 0 },
      { range: '90-365 days', count: Math.round(serverSet * 0.4) || 0 },
      { range: '365+ days', count: Math.round(serverSet * 0.6) || 0 },
    ];

    const itpImpact = thirdParty + Math.round(firstParty * 0.3);
    const itpPercent = events.length > 0 ? ((itpImpact / events.length) * 100).toFixed(1) : '0';

    return { distribution, lifetimeData, itpPercent, itpImpact };
  }, [events]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Cookie className="h-4 w-4 text-primary" /> Cookie Health Monitor
            </CardTitle>
            <CardDescription className="text-xs">Cookie type distribution and ITP/ETP impact</CardDescription>
          </div>
          <Badge variant={parseFloat(cookieData.itpPercent) > 30 ? 'destructive' : 'secondary'} className="text-xs">
            ITP Impact: {cookieData.itpPercent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Cookie Type Distribution</p>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cookieData.distribution} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                    {cookieData.distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              {cookieData.distribution.map(d => (
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
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Cookie Lifetime Distribution</p>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cookieData.lifetimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis dataKey="range" type="category" width={70} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
