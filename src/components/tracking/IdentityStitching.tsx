import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Sparkles, Network, RefreshCw, GitMerge, ShieldQuestion } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface IdentityProfile {
  id: string;
  display_label: string | null;
  confidence_score: number;
  signal_count: number;
  merged_into_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

interface MatchDecision {
  id: string;
  source_profile_id: string | null;
  target_profile_id: string | null;
  method: string;
  decision: string;
  confidence: number;
  reason: string | null;
  ai_model: string | null;
  created_at: string;
}

interface Stats {
  totalProfiles: number;
  mergedProfiles: number;
  aiDecisions: number;
  avgConfidence: number;
}

export function IdentityStitching() {
  const { activeWorkspace } = useAuth();
  const [profiles, setProfiles] = useState<IdentityProfile[]>([]);
  const [decisions, setDecisions] = useState<MatchDecision[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProfiles: 0, mergedProfiles: 0, aiDecisions: 0, avgConfidence: 0 });
  const [loading, setLoading] = useState(true);

  const wsId = activeWorkspace?.id;

  const load = async () => {
    if (!wsId) return;
    setLoading(true);

    const [profsRes, decsRes, allProfsRes] = await Promise.all([
      supabase
        .from("identity_profiles")
        .select("*")
        .eq("workspace_id", wsId)
        .is("merged_into_id", null)
        .order("last_seen_at", { ascending: false })
        .limit(20),
      supabase
        .from("identity_match_decisions")
        .select("*")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("identity_profiles")
        .select("id, merged_into_id, confidence_score", { count: "exact" })
        .eq("workspace_id", wsId),
    ]);

    setProfiles((profsRes.data as IdentityProfile[]) || []);
    setDecisions((decsRes.data as MatchDecision[]) || []);

    const all = (allProfsRes.data as Array<{ merged_into_id: string | null; confidence_score: number }>) || [];
    const merged = all.filter((p) => p.merged_into_id !== null).length;
    const aiDecs = (decsRes.data as MatchDecision[] || []).filter((d) => d.method === "ai").length;
    const avgConf = all.length > 0 ? all.reduce((s, p) => s + (p.confidence_score || 0), 0) / all.length : 0;

    setStats({
      totalProfiles: all.length,
      mergedProfiles: merged,
      aiDecisions: aiDecs,
      avgConfidence: avgConf,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [wsId]);

  if (!wsId) {
    return (
      <Alert>
        <AlertTitle>No workspace selected</AlertTitle>
        <AlertDescription>Pick a workspace to view identity profiles.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Profiles</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Skeleton className="h-7 w-16" /> : (stats.totalProfiles - stats.mergedProfiles).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><GitMerge className="h-3.5 w-3.5" /> Merged</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Skeleton className="h-7 w-16" /> : stats.mergedProfiles.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI decisions</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Skeleton className="h-7 w-16" /> : stats.aiDecisions.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><ShieldQuestion className="h-3.5 w-3.5" /> Avg confidence</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Skeleton className="h-7 w-16" /> : `${(stats.avgConfidence * 100).toFixed(0)}%`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Cookieless Identity Stitching</CardTitle>
                <CardDescription>
                  Rules-first matching by hashed email/phone/cookie. Ambiguous cases resolved by Gemini Flash Lite.
                  Devices, sessions, and networks unified into a single profile.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profiles">
            <TabsList>
              <TabsTrigger value="profiles">Recent Profiles</TabsTrigger>
              <TabsTrigger value="decisions">Match Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="profiles" className="space-y-2 mt-4">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No profiles yet. They'll appear as soon as your tracking sends user data.
                </p>
              ) : (
                profiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {(p.display_label || p.id).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-mono">{p.id.slice(0, 8)}…</code>
                          {p.display_label && <span className="font-medium">{p.display_label}</span>}
                          <Badge variant={p.confidence_score >= 0.85 ? "default" : p.confidence_score >= 0.6 ? "secondary" : "outline"} className="text-[10px]">
                            {(p.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.signal_count} signals · last seen {new Date(p.last_seen_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="decisions" className="space-y-2 mt-4">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : decisions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No match decisions yet.
                </p>
              ) : (
                decisions.map((d) => (
                  <div key={d.id} className="p-3 rounded-md border text-sm space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={d.method === "ai" ? "default" : d.method === "manual" ? "secondary" : "outline"}
                        className="text-[10px] gap-1"
                      >
                        {d.method === "ai" && <Sparkles className="h-3 w-3" />}
                        {d.method.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{d.decision}</Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {(d.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                      {d.ai_model && <span className="text-xs text-muted-foreground">{d.ai_model}</span>}
                    </div>
                    {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()}
                      {d.target_profile_id && (
                        <> · target <code className="font-mono">{d.target_profile_id.slice(0, 8)}…</code></>
                      )}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
