import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Scan, Eye, Globe2, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const piiPatterns = [
  { name: 'Email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, severity: 'critical' },
  { name: 'Phone', pattern: /\+?[\d\s-]{10,}/, severity: 'warning' },
  { name: 'IP Address', pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, severity: 'warning' },
  { name: 'Credit Card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, severity: 'critical' },
  { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/, severity: 'critical' },
];

const cmpProviders = [
  { value: 'onetrust', label: 'OneTrust' },
  { value: 'cookiebot', label: 'Cookiebot' },
  { value: 'usercentrics', label: 'Usercentrics' },
  { value: 'custom', label: 'Custom CMP' },
];

export function PrivacyCompliance() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['privacy-settings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('tracking_privacy_settings')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  const [consentGoogle, setConsentGoogle] = useState(false);
  const [consentMeta, setConsentMeta] = useState(false);
  const [ipTruncation, setIpTruncation] = useState(true);
  const [uaGeneralization, setUaGeneralization] = useState(false);
  const [maskedFields, setMaskedFields] = useState('');
  const [dataResidency, setDataResidency] = useState('us');
  const [cmpProvider, setCmpProvider] = useState('');
  const [scanResult, setScanResult] = useState<{ field: string; type: string; severity: string }[] | null>(null);

  useEffect(() => {
    if (settings) {
      const cm = settings.consent_mode as any;
      const ar = settings.anonymizer_rules as any;
      setConsentGoogle(cm?.google || false);
      setConsentMeta(cm?.meta || false);
      setIpTruncation(ar?.ip_truncation ?? true);
      setUaGeneralization(ar?.ua_generalization ?? false);
      setMaskedFields((ar?.masked_fields || []).join(', '));
      setDataResidency(settings.data_residency || 'us');
      setCmpProvider(settings.cmp_provider || '');
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const payload = {
        user_id: profile.id,
        consent_mode: { google: consentGoogle, meta: consentMeta },
        anonymizer_rules: {
          ip_truncation: ipTruncation,
          ua_generalization: uaGeneralization,
          masked_fields: maskedFields.split(',').map(s => s.trim()).filter(Boolean),
        },
        data_residency: dataResidency,
        cmp_provider: cmpProvider || null,
      };

      if (settings?.id) {
        const { error } = await supabase.from('tracking_privacy_settings').update(payload).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tracking_privacy_settings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Privacy settings saved!');
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const [scanning, setScanning] = useState(false);

  const runPIIScan = async () => {
    if (!profile?.id) return;
    setScanning(true);
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('payload')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      const findings: { field: string; type: string; severity: string }[] = [];
      const seen = new Set<string>();

      const walk = (obj: any, path: string) => {
        if (obj == null) return;
        if (typeof obj === 'string') {
          for (const p of piiPatterns) {
            if (p.pattern.test(obj)) {
              const key = `${path}::${p.name}`;
              if (!seen.has(key)) {
                seen.add(key);
                findings.push({ field: path, type: p.name, severity: p.severity });
              }
            }
          }
          return;
        }
        if (typeof obj === 'object') {
          for (const k of Object.keys(obj)) walk(obj[k], path ? `${path}.${k}` : k);
        }
      };

      (data ?? []).forEach((row: any) => walk(row.payload, ''));

      setScanResult(findings);
      if (findings.length === 0) {
        toast.success('No PII detected in recent events');
      } else {
        toast.warning(`PII scan found ${findings.length} unique issue${findings.length === 1 ? '' : 's'}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const severityColor: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-600',
    warning: 'bg-yellow-500/10 text-yellow-600',
    info: 'bg-blue-500/10 text-blue-600',
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scanner" className="gap-1.5"><Scan className="h-4 w-4" /> PII Scanner</TabsTrigger>
          <TabsTrigger value="consent" className="gap-1.5"><CheckCircle2 className="h-4 w-4" /> Consent Mode</TabsTrigger>
          <TabsTrigger value="anonymizer" className="gap-1.5"><Eye className="h-4 w-4" /> Anonymizer</TabsTrigger>
          <TabsTrigger value="residency" className="gap-1.5"><Globe2 className="h-4 w-4" /> Data Residency</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Scan className="h-5 w-5 text-primary" /> PII Auto-Scanner</CardTitle>
              <CardDescription>Scan event payloads for personally identifiable information before transmission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Button onClick={runPIIScan} disabled={scanning}>
                  <Scan className={`h-4 w-4 mr-1 ${scanning ? 'animate-pulse' : ''}`} /> {scanning ? 'Scanning…' : 'Run Scan'}
                </Button>
                <p className="text-xs text-muted-foreground">Scans the last 200 event payloads for email, phone, IP, credit card, and SSN patterns.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {piiPatterns.map((p) => (
                  <div key={p.name} className="p-2 rounded-lg border border-border text-center">
                    <p className="text-xs font-medium text-foreground">{p.name}</p>
                    <Badge variant="outline" className={`${severityColor[p.severity]} text-[10px] mt-1`}>{p.severity}</Badge>
                  </div>
                ))}
              </div>

              {scanResult && (
                <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm font-medium text-foreground">
                    Scan Results ({scanResult.length} {scanResult.length === 1 ? 'finding' : 'findings'})
                  </p>
                  {scanResult.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      No PII patterns detected in your recent events. ✨
                    </div>
                  ) : (
                    scanResult.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border border-border">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-foreground font-mono truncate">{r.field || '(root)'}</p>
                            <p className="text-xs text-muted-foreground">Type: {r.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={severityColor[r.severity]}>{r.severity}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consent Mode v2</CardTitle>
              <CardDescription>Configure consent signals for Google and Meta platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Google Consent Mode v2</p>
                  <p className="text-xs text-muted-foreground">Send consent signals with GA4 and Google Ads events</p>
                </div>
                <Switch checked={consentGoogle} onCheckedChange={setConsentGoogle} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Meta Consent Mode</p>
                  <p className="text-xs text-muted-foreground">Include consent data with Meta CAPI events</p>
                </div>
                <Switch checked={consentMeta} onCheckedChange={setConsentMeta} />
              </div>

              <div>
                <Label>CMP Provider</Label>
                <Select value={cmpProvider} onValueChange={setCmpProvider}>
                  <SelectTrigger><SelectValue placeholder="Select CMP" /></SelectTrigger>
                  <SelectContent>
                    {cmpProviders.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Automatically read consent signals from your consent management platform</p>
              </div>

              <Button onClick={() => saveSettings.mutate()}>Save Consent Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anonymizer">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anonymizer Configuration</CardTitle>
              <CardDescription>Configure how PII is handled before events reach destinations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">IP Truncation</p>
                  <p className="text-xs text-muted-foreground">Remove last octet of IP addresses (e.g. 192.168.1.0)</p>
                </div>
                <Switch checked={ipTruncation} onCheckedChange={setIpTruncation} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">User Agent Generalization</p>
                  <p className="text-xs text-muted-foreground">Simplify user agent strings to browser family only</p>
                </div>
                <Switch checked={uaGeneralization} onCheckedChange={setUaGeneralization} />
              </div>
              <div>
                <Label>Custom Masked Fields</Label>
                <Input value={maskedFields} onChange={(e) => setMaskedFields(e.target.value)} placeholder="email, phone, address" />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated field names to mask in all event payloads</p>
              </div>
              <Button onClick={() => saveSettings.mutate()}>Save Anonymizer Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="residency">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Residency</CardTitle>
              <CardDescription>Choose where your event data is stored and processed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'us', label: '🇺🇸 United States', desc: 'US East (Virginia)' },
                  { value: 'eu', label: '🇪🇺 European Union', desc: 'EU West (Frankfurt)' },
                  { value: 'apac', label: '🌏 Asia Pacific', desc: 'APAC (Singapore)' },
                ].map((r) => (
                  <Card
                    key={r.value}
                    className={`cursor-pointer transition-colors ${dataResidency === r.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => setDataResidency(r.value)}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="text-lg">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                      {dataResidency === r.value && <CheckCircle2 className="h-4 w-4 text-primary mx-auto mt-2" />}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md bg-muted/30 border border-border/40">
                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Your selected region determines where event payloads are stored. Changing residency takes effect on new events; historical events stay in the previous region.</span>
              </div>

              <Button onClick={() => saveSettings.mutate()}>Save Residency Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
