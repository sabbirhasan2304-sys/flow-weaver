import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Ghost, Copy, RefreshCw, ShieldCheck, Activity, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BRAND_DOMAIN } from "@/config/brand";

interface GhostConfig {
  id: string;
  workspace_id: string;
  enabled: boolean;
  script_slug: string;
  rotation_interval_minutes: number;
  obfuscation_level: string;
  secret_seed: string;
  inject_decoys: boolean;
}

interface Variant {
  id: string;
  token: string;
  fn_name: string;
  global_var: string;
  endpoint_alias: string;
  served_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export function GhostLoader() {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<GhostConfig | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const wsId = activeWorkspace?.id;

  const load = async () => {
    if (!wsId) return;
    setLoading(true);
    const { data: cfg } = await supabase
      .from("ghost_loader_configs")
      .select("*")
      .eq("workspace_id", wsId)
      .maybeSingle();
    setConfig(cfg as GhostConfig | null);

    const { data: vs } = await supabase
      .from("script_variants")
      .select("*")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false })
      .limit(10);
    setVariants((vs as Variant[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [wsId]);

  const enableGhost = async () => {
    if (!wsId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("ghost_loader_configs")
      .insert({ workspace_id: wsId })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Failed to enable", description: error.message, variant: "destructive" });
      return;
    }
    setConfig(data as GhostConfig);
    toast({ title: "Ghost Loader enabled", description: "Your polymorphic tracking script is ready." });
  };

  const updateConfig = async (patch: Partial<GhostConfig>) => {
    if (!config) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("ghost_loader_configs")
      .update(patch)
      .eq("id", config.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setConfig(data as GhostConfig);
  };

  const rotateNow = async () => {
    if (!config || !wsId) return;
    setSaving(true);
    // Deactivate all current variants — next serve will mint a new one
    const { error } = await supabase
      .from("script_variants")
      .update({ is_active: false })
      .eq("workspace_id", wsId)
      .eq("is_active", true);
    setSaving(false);
    if (error) {
      toast({ title: "Rotate failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rotated", description: "A new variant will be minted on the next request." });
    await load();
  };

  const snippet = config
    ? `<!-- BiztoriBD Ghost Loader -->\n<script async src="https://cdn.${BRAND_DOMAIN}/${config.script_slug}/${wsId}.js"></script>`
    : "";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (!wsId) {
    return (
      <Alert>
        <AlertTitle>No workspace selected</AlertTitle>
        <AlertDescription>Select a workspace to configure the Ghost Loader.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ghost className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Polymorphic Ghost Loader</CardTitle>
                <CardDescription>
                  Ad-blocker-resistant tracking script. Function names, globals, and endpoints
                  rotate per request — making static blocklists ineffective.
                </CardDescription>
              </div>
            </div>
            {config?.enabled && (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config ? (
            <Button onClick={enableGhost} disabled={saving || loading}>
              <Ghost className="h-4 w-4 mr-2" />
              Enable Ghost Loader
            </Button>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enabled</Label>
                  <p className="text-sm text-muted-foreground">Serve the polymorphic script</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(v) => updateConfig({ enabled: v })}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Script Slug</Label>
                  <Input
                    value={config.script_slug}
                    onChange={(e) => setConfig({ ...config, script_slug: e.target.value })}
                    onBlur={() => updateConfig({ script_slug: config.script_slug })}
                  />
                  <p className="text-xs text-muted-foreground">Path segment in script URL</p>
                </div>
                <div className="space-y-2">
                  <Label>Rotation Interval</Label>
                  <Select
                    value={String(config.rotation_interval_minutes)}
                    onValueChange={(v) => updateConfig({ rotation_interval_minutes: parseInt(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Every 15 min</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="1440">Every 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Obfuscation</Label>
                  <Select
                    value={config.obfuscation_level}
                    onValueChange={(v) => updateConfig({ obfuscation_level: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (readable)</SelectItem>
                      <SelectItem value="medium">Medium (recommended)</SelectItem>
                      <SelectItem value="high">High (maximum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Inject decoy globals</Label>
                    <p className="text-xs text-muted-foreground">Confuses static analyzers</p>
                  </div>
                </div>
                <Switch
                  checked={config.inject_decoys}
                  onCheckedChange={(v) => updateConfig({ inject_decoys: v })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Install Snippet</Label>
                <div className="relative">
                  <pre className="p-3 pr-12 rounded-md bg-muted text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {snippet}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copy(snippet)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={rotateNow} disabled={saving}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Rotate Now
                </Button>
                <Button variant="ghost" onClick={load} disabled={loading}>
                  <Activity className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Variants</CardTitle>
            <CardDescription>Each variant has a unique function name, global, and endpoint alias.</CardDescription>
          </CardHeader>
          <CardContent>
            {variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No variants yet — they're minted on the first script request.</p>
            ) : (
              <div className="space-y-2">
                {variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={v.is_active ? "default" : "secondary"} className="text-[10px]">
                          {v.is_active ? "active" : "rotated"}
                        </Badge>
                        <code className="text-xs font-mono">{v.fn_name}()</code>
                        <span className="text-muted-foreground">→</span>
                        <code className="text-xs font-mono text-muted-foreground">/{v.endpoint_alias}</code>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        token: {v.token.slice(0, 16)}… · served {v.served_count} times
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(v.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
