import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Zap, RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

type Workspace = { id: string; name: string };
type Rules = {
  id?: string;
  workspace_id: string;
  enabled: boolean;
  heartbeat_timeout_seconds: number;
  min_intent_score: number;
  eligible_event_types: string[];
  forward_to_destinations: boolean;
};
type SessionRow = {
  id: string;
  session_token: string;
  intent_type: string | null;
  intent_score: number;
  status: string;
  page_url: string | null;
  last_heartbeat_at: string;
  created_at: string;
};
type RecoveredRow = {
  id: string;
  event_name: string;
  intent_score: number;
  recovery_reason: string;
  status: string;
  destinations_forwarded: string[];
  forwarded_at: string | null;
  created_at: string;
};

const DEFAULT_EVENTS = ["Purchase", "InitiateCheckout", "AddPaymentInfo", "Lead", "CompleteRegistration"];

export function PredictiveRecovery() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [rules, setRules] = useState<Rules | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [recovered, setRecovered] = useState<RecoveredRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Load workspaces
  useEffect(() => {
    (async () => {
      const profileId = (await supabase.rpc("get_profile_id")).data;
      if (!profileId) return;
      const { data } = await supabase
        .from("workspace_members")
        .select("workspace_id, workspaces(id, name)")
        .eq("profile_id", profileId);
      const list = (data ?? [])
        .map((r: any) => r.workspaces)
        .filter(Boolean) as Workspace[];
      setWorkspaces(list);
      if (list.length && !workspaceId) setWorkspaceId(list[0].id);
    })();
  }, []);

  const loadAll = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [r, s, e] = await Promise.all([
        supabase.from("recovery_rules").select("*").eq("workspace_id", workspaceId).maybeSingle(),
        supabase
          .from("predictive_sessions")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("last_heartbeat_at", { ascending: false })
          .limit(50),
        supabase
          .from("recovered_events")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setRules(
        r.data ?? {
          workspace_id: workspaceId,
          enabled: true,
          heartbeat_timeout_seconds: 90,
          min_intent_score: 0.6,
          eligible_event_types: DEFAULT_EVENTS,
          forward_to_destinations: true,
        },
      );
      setSessions((s.data ?? []) as SessionRow[]);
      setRecovered((e.data ?? []) as RecoveredRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [workspaceId]);

  const saveRules = async () => {
    if (!rules || !workspaceId) return;
    const payload = { ...rules, workspace_id: workspaceId };
    const { error } = await supabase.from("recovery_rules").upsert(payload, { onConflict: "workspace_id" });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Recovery rules saved" });
      loadAll();
    }
  };

  const runRecoveryNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-recovery-queue", { body: { trigger: "manual" } });
      if (error) throw error;
      toast({
        title: "Recovery batch complete",
        description: `Scanned ${data?.scanned ?? 0}, recovered ${data?.recovered ?? 0}`,
      });
      loadAll();
    } catch (e: any) {
      toast({ title: "Recovery failed", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const stats = {
    activeSessions: sessions.filter((s) => s.status === "active").length,
    recoveredCount: recovered.length,
    forwardedCount: recovered.filter((r) => r.status === "forwarded").length,
    avgIntent:
      sessions.length > 0
        ? (sessions.reduce((sum, s) => sum + Number(s.intent_score), 0) / sessions.length).toFixed(2)
        : "0.00",
  };

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "recovered" || s === "forwarded") return "default";
    if (s === "active" || s === "pending") return "secondary";
    if (s === "failed") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Predictive Event Recovery
          </h2>
          <p className="text-sm text-muted-foreground">
            Rescues conversions when the browser crashes, ad-blockers strip pixels, or networks fail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {workspaces.length > 1 && (
            <select
              className="bg-background border border-border rounded px-2 py-1 text-sm"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={runRecoveryNow} disabled={running || !workspaceId}>
            <Zap className={`h-4 w-4 mr-1 ${running ? "animate-pulse" : ""}`} /> Run Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Heart className="h-4 w-4 text-rose-400" />} label="Active sessions" value={stats.activeSessions} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} label="Avg intent" value={stats.avgIntent} />
        <StatCard icon={<ShieldCheck className="h-4 w-4 text-primary" />} label="Recovered" value={stats.recoveredCount} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Forwarded" value={stats.forwardedCount} />
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="recovered">Recovered Events</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="snippet">Install</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">In-flight sessions</CardTitle>
              <CardDescription>Newest 50 heartbeats from this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px]">
                {sessions.length === 0 ? (
                  <EmptyState icon={<Heart className="h-6 w-6" />} text="No sessions yet — install the snippet on your site to start receiving heartbeats." />
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/40 bg-card/40">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                            <span className="font-medium">{s.intent_type ?? "—"}</span>
                            <span className="text-muted-foreground text-xs">score {Number(s.intent_score).toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{s.page_url ?? "(no url)"}</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.last_heartbeat_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovered">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recovered conversions</CardTitle>
              <CardDescription>Server-side rescues forwarded to your destinations.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px]">
                {recovered.length === 0 ? (
                  <EmptyState icon={<ShieldCheck className="h-6 w-6" />} text="No recoveries yet. They appear when stalled high-intent sessions are rescued." />
                ) : (
                  <div className="space-y-2">
                    {recovered.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/40 bg-card/40">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                            <span className="font-medium">{r.event_name}</span>
                            <span className="text-muted-foreground text-xs">intent {Number(r.intent_score).toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            reason: {r.recovery_reason}
                            {r.destinations_forwarded?.length > 0 && <> · → {r.destinations_forwarded.join(", ")}</>}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recovery configuration</CardTitle>
              <CardDescription>Tune sensitivity per workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Recovery enabled</Label>
                      <p className="text-xs text-muted-foreground">Master switch for this workspace.</p>
                    </div>
                    <Switch checked={rules.enabled} onCheckedChange={(v) => setRules({ ...rules, enabled: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Forward to destinations</Label>
                      <p className="text-xs text-muted-foreground">Push recovered events into Meta CAPI / GA4 etc.</p>
                    </div>
                    <Switch
                      checked={rules.forward_to_destinations}
                      onCheckedChange={(v) => setRules({ ...rules, forward_to_destinations: v })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="timeout">Heartbeat timeout (sec)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        min={30}
                        max={1800}
                        value={rules.heartbeat_timeout_seconds}
                        onChange={(e) => setRules({ ...rules, heartbeat_timeout_seconds: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Mark a session "stalled" after this many seconds of silence.</p>
                    </div>
                    <div>
                      <Label htmlFor="intent">Minimum intent score</Label>
                      <Input
                        id="intent"
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={rules.min_intent_score}
                        onChange={(e) => setRules({ ...rules, min_intent_score: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Only recover sessions with intent at or above this.</p>
                    </div>
                  </div>
                  <div>
                    <Label>Eligible event types</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DEFAULT_EVENTS.map((ev) => {
                        const active = rules.eligible_event_types.includes(ev);
                        return (
                          <Badge
                            key={ev}
                            variant={active ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const next = active
                                ? rules.eligible_event_types.filter((e) => e !== ev)
                                : [...rules.eligible_event_types, ev];
                              setRules({ ...rules, eligible_event_types: next });
                            }}
                          >
                            {ev}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveRules}>Save rules</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snippet">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Heartbeat install snippet</CardTitle>
              <CardDescription>
                Drop this on your site (after your existing tracking script). It sends a lightweight ping every 20s with the latest captured intent so we can rescue the conversion if the browser crashes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted/30 p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
{`<script>
(function(){
  var WS = "${workspaceId || "YOUR_WORKSPACE_ID"}";
  var SESSION = (sessionStorage.getItem("nx_sid") || (Math.random().toString(36).slice(2)+Date.now()));
  sessionStorage.setItem("nx_sid", SESSION);
  window.NXIntent = window.NXIntent || { type: null, payload: {}, user: {} };
  function ping(){
    try {
      navigator.sendBeacon &&
      navigator.sendBeacon(
        "https://euocvkvdixpxfznrduzi.supabase.co/functions/v1/session-heartbeat",
        new Blob([JSON.stringify({
          workspace_id: WS,
          session_token: SESSION,
          page_url: location.href,
          intent_type: window.NXIntent.type,
          captured_payload: window.NXIntent.payload,
          hashed_user_data: window.NXIntent.user
        })], { type: "application/json" })
      );
    } catch(e){}
  }
  setInterval(ping, 20000);
  document.addEventListener("visibilitychange", ping);
  window.addEventListener("pagehide", ping);
  ping();
})();
</script>`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Set <code>window.NXIntent</code> at key checkout steps, e.g.
                <br />
                <code>window.NXIntent = {`{ type: "InitiateCheckout", payload: { value: 49.99, currency: "BDT" }, user: { em: "<sha256-email>" } }`}</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
      {icon}
      <p className="text-sm text-center max-w-sm">{text}</p>
      <AlertTriangle className="h-3 w-3 opacity-0" />
    </div>
  );
}
