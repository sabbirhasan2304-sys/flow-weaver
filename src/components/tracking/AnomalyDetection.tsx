import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, Activity } from 'lucide-react';

interface AnomalyDetectionProps {
  events: any[];
}

interface HourlyData {
  hour: string;
  count: number;
  isAnomaly: boolean;
  anomalyType?: 'spike' | 'drop';
}

export function AnomalyDetection({ events }: AnomalyDetectionProps) {
  const { hourlyData, anomalies, baseline } = useMemo(() => {
    const now = new Date();
    const hours: HourlyData[] = [];

    // Build hourly counts for last 48 hours
    const counts: number[] = [];
    for (let i = 47; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      const count = events.filter((e: any) => {
        const t = new Date(e.created_at);
        return t >= hourStart && t < hourEnd;
      }).length;
      counts.push(count);
    }

    // Compute mean and stddev
    const mean = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
    const variance = counts.length > 0 ? counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length : 0;
    const stddev = Math.sqrt(variance);
    const threshold = 2;

    const detectedAnomalies: { hour: string; count: number; type: 'spike' | 'drop'; deviation: number }[] = [];

    for (let i = 0; i < 48; i++) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - (47 - i), 0, 0, 0);
      const label = `${hourStart.getMonth() + 1}/${hourStart.getDate()} ${hourStart.getHours()}:00`;
      const count = counts[i];
      const deviation = stddev > 0 ? (count - mean) / stddev : 0;
      const isAnomaly = Math.abs(deviation) > threshold && count > 0;
      const anomalyType = deviation > threshold ? 'spike' as const : deviation < -threshold ? 'drop' as const : undefined;

      hours.push({ hour: label, count, isAnomaly, anomalyType });

      if (isAnomaly && anomalyType) {
        detectedAnomalies.push({ hour: label, count, type: anomalyType, deviation: Math.abs(deviation) });
      }
    }

    // Only show last 24 hours in chart
    return {
      hourlyData: hours.slice(-24),
      anomalies: detectedAnomalies,
      baseline: { mean: Math.round(mean), stddev: Math.round(stddev) },
    };
  }, [events]);

  const anomalyPoints = hourlyData.filter(h => h.isAnomaly);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> AI Anomaly Detection
            </CardTitle>
            <CardDescription>
              Baseline: ~{baseline.mean} events/hour (σ={baseline.stddev}). Flags &gt;2σ deviations.
            </CardDescription>
          </div>
          {anomalies.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {anomalies.length} anomalies
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] mb-4">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Need event data to compute anomalies
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval={3} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" name="Events" />
                {anomalyPoints.map((p, i) => (
                  <ReferenceDot key={i} x={p.hour} y={p.count} r={6}
                    fill={p.anomalyType === 'spike' ? '#ef4444' : '#f97316'}
                    stroke="white" strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {anomalies.length > 0 ? (
          <div className="space-y-2">
            {anomalies.slice(-5).map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                {a.type === 'spike' ? (
                  <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-orange-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {a.type === 'spike' ? 'Unusual spike' : 'Unusual drop'} — {a.count} events at {a.hour}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.deviation.toFixed(1)}σ from baseline</p>
                </div>
                <Badge variant={a.type === 'spike' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                  {a.type}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            ✅ No anomalies detected. Event volumes are within normal range.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
