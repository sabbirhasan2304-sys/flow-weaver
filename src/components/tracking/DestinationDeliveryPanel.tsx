import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeliveryRow {
  id: string;
  destination_platform: string;
  event_name: string;
  http_status: number | null;
  latency_ms: number | null;
  success: boolean;
  error_message: string | null;
  recovered: boolean;
  created_at: string;
}

export function DestinationDeliveryPanel({ workspaceId }: { workspaceId: string }) {
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const { data } = await supabase
      .from("destination_delivery_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data ?? []) as DeliveryRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const successCount = rows.filter((r) => r.success).length;
  const failCount = rows.length - successCount;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Destination Deliveries
          </CardTitle>
          <CardDescription>
            <span className="text-emerald-400">{successCount} OK</span>
            {" · "}
            <span className="text-rose-400">{failCount} failed</span>
            {" · last 50"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[260px]">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No deliveries yet — connect a destination (Meta CAPI, TikTok, GA4, Google Ads) and trigger an event.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/40 bg-card/40">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={r.success ? "default" : "destructive"}>{r.destination_platform}</Badge>
                      <span className="font-medium truncate">{r.event_name}</span>
                      {r.recovered && <Badge variant="outline" className="text-xs">recovered</Badge>}
                    </div>
                    {r.error_message && (
                      <div className="text-xs text-rose-400 truncate mt-0.5">{r.error_message}</div>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {r.http_status ?? "—"} · {r.latency_ms ?? "—"}ms
                    <div>{new Date(r.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
