import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface QueueStat {
  queue: string;
  queue_length: number;
  total_messages: number;
  oldest_msg_age_sec: number;
}

const QUEUES = [
  { name: "tracking_events_queue", label: "Tracking Events", isDlq: false },
  { name: "tracking_events_dlq", label: "Tracking DLQ", isDlq: true },
  { name: "recovery_queue", label: "Recovery Queue", isDlq: false },
  { name: "recovery_dlq", label: "Recovery DLQ", isDlq: true },
];

export function QueueHealthWidget() {
  const [stats, setStats] = useState<Record<string, QueueStat | null>>({});
  const [loading, setLoading] = useState(false);
  const [draining, setDraining] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const result: Record<string, QueueStat | null> = {};
    for (const q of QUEUES) {
      const { data, error } = await supabase.rpc("get_queue_stats", { queue_name: q.name });
      if (error) {
        result[q.name] = null;
      } else {
        result[q.name] = (data as QueueStat[])?.[0] ?? null;
      }
    }
    setStats(result);
    setLoading(false);
  };

  const drainQueue = async () => {
    setDraining(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-tracking-queue", { body: {} });
      if (error) throw error;
      toast.success(`Worker ran: processed ${data?.processed ?? 0}, dlq ${data?.dlq ?? 0}`);
      await fetchStats();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Worker failed");
    } finally {
      setDraining(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Queue Health
          </CardTitle>
          <CardDescription>Async pipeline status — auto-refreshes every 15s</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={drainQueue} disabled={draining}>
            <RefreshCw className={`h-3 w-3 mr-1 ${draining ? "animate-spin" : ""}`} />
            Run Worker
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {QUEUES.map((q) => {
            const s = stats[q.name];
            const length = s?.queue_length ?? 0;
            const ageMin = s?.oldest_msg_age_sec ? Math.floor(s.oldest_msg_age_sec / 60) : 0;
            const isStuck = ageMin > 5;
            const isDlqAlert = q.isDlq && length > 0;

            return (
              <div
                key={q.name}
                className="rounded-lg border bg-card/50 p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{q.label}</span>
                  {isDlqAlert && <AlertTriangle className="h-3 w-3 text-destructive" />}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${isDlqAlert ? "text-destructive" : ""}`}>
                    {length}
                  </span>
                  <span className="text-xs text-muted-foreground">pending</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {s?.total_messages ? (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {s.total_messages} total
                    </Badge>
                  ) : null}
                  {ageMin > 0 ? (
                    <Badge
                      variant={isStuck ? "destructive" : "outline"}
                      className="text-[10px] h-4 px-1"
                    >
                      {ageMin}m old
                    </Badge>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
