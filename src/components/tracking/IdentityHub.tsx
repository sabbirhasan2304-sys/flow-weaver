import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fingerprint, Cookie, Link2, Shield, Bot, Globe, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function IdentityHub() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['identity-config', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('tracking_identity_config')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  const [salt, setSalt] = useState('');
  const [hashAlgo, setHashAlgo] = useState('sha256');
  const [cookieTtl, setCookieTtl] = useState(365);
  const [crossDomains, setCrossDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [gclidRecovery, setGclidRecovery] = useState(true);
  const [fbclidRecovery, setFbclidRecovery] = useState(true);
  const [ttclidRecovery, setTtclidRecovery] = useState(true);
  const [botThreshold, setBotThreshold] = useState(70);
  const [botAction, setBotAction] = useState('tag');
  const [seoAllowlist, setSeoAllowlist] = useState<string[]>(['Googlebot', 'Bingbot', 'DuckDuckBot']);
  const [adBlockBypass, setAdBlockBypass] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    if (config) {
      setSalt(config.user_id_salt || '');
      setHashAlgo(config.hashing_algorithm || 'sha256');
      setCookieTtl(config.cookie_ttl_days || 365);
      setCrossDomains(config.cross_domains || []);
      const cr = config.click_id_recovery as any;
      setGclidRecovery(cr?.gclid ?? true);
      setFbclidRecovery(cr?.fbclid ?? true);
      setTtclidRecovery(cr?.ttclid ?? true);
      setBotThreshold(Number(config.bot_threshold) || 70);
      setBotAction(config.bot_action || 'tag');
      setSeoAllowlist(config.seo_crawler_allowlist || ['Googlebot', 'Bingbot', 'DuckDuckBot']);
      setAdBlockBypass(config.ad_blocker_bypass || false);
      setCustomDomain(config.custom_domain || '');
    }
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const payload = {
        user_id: profile.id,
        user_id_salt: salt,
        hashing_algorithm: hashAlgo,
        cookie_ttl_days: cookieTtl,
        cross_domains: crossDomains,
        click_id_recovery: { gclid: gclidRecovery, fbclid: fbclidRecovery, ttclid: ttclidRecovery },
        bot_threshold: botThreshold / 100,
        bot_action: botAction,
        seo_crawler_allowlist: seoAllowlist,
        ad_blocker_bypass: adBlockBypass,
        custom_domain: customDomain || null,
      };
      if (config?.id) {
        const { error } = await supabase.from('tracking_identity_config').update(payload).eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tracking_identity_config').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Identity config saved!');
      queryClient.invalidateQueries({ queryKey: ['identity-config'] });
    },
    onError: () => toast.error('Failed to save'),
  });

  const addDomain = () => {
    if (newDomain.trim() && !crossDomains.includes(newDomain.trim())) {
      setCrossDomains([...crossDomains, newDomain.trim()]);
      setNewDomain('');
    }
  };

  return (
    <div className="space-y-6">
      {/* User ID Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /> User ID Generator</CardTitle>
          <CardDescription>Configure first-party hashed user identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Salt (secret key for hashing)</Label>
            <Input value={salt} onChange={(e) => setSalt(e.target.value)} placeholder="your-secret-salt-value" type="password" />
            <p className="text-xs text-muted-foreground mt-1">Combined with IP + User Agent to generate deterministic user IDs</p>
          </div>
          <div>
            <Label>Hashing Algorithm</Label>
            <Select value={hashAlgo} onValueChange={setHashAlgo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sha256">SHA-256 (recommended)</SelectItem>
                <SelectItem value="sha384">SHA-384</SelectItem>
                <SelectItem value="sha512">SHA-512</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cross-Domain Stitching */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> Cross-Domain Stitching</CardTitle>
          <CardDescription>Link user identities across multiple domains</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="shop.example.com" className="flex-1" />
            <Button size="sm" onClick={addDomain}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {crossDomains.map((d) => (
              <Badge key={d} variant="outline" className="gap-1">
                {d}
                <button onClick={() => setCrossDomains(crossDomains.filter(x => x !== d))}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            {crossDomains.length === 0 && <p className="text-xs text-muted-foreground">No domains configured</p>}
          </div>
        </CardContent>
      </Card>

      {/* Cookie Lifetime */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Cookie className="h-5 w-5 text-primary" /> Cookie Lifetime</CardTitle>
          <CardDescription>Server-set first-party cookies for extended tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Cookie TTL</Label>
              <span className="text-sm font-medium text-foreground">{cookieTtl} days</span>
            </div>
            <Slider value={[cookieTtl]} onValueChange={(v) => setCookieTtl(v[0])} min={1} max={730} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 day</span>
              <span>1 year</span>
              <span>2 years</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Click ID Recovery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Click ID Recovery</CardTitle>
          <CardDescription>Recover advertising click IDs from URL parameters or first-party storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'gclid (Google Ads)', checked: gclidRecovery, onChange: setGclidRecovery },
            { label: 'fbclid (Meta/Facebook)', checked: fbclidRecovery, onChange: setFbclidRecovery },
            { label: 'ttclid (TikTok)', checked: ttclidRecovery, onChange: setTtclidRecovery },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <p className="text-sm text-foreground">{item.label}</p>
              <Switch checked={item.checked} onCheckedChange={item.onChange} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bot Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Bot Detection</CardTitle>
          <CardDescription>ML-based bot classifier with configurable actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Bot Score Threshold</Label>
              <span className="text-sm font-medium text-foreground">{botThreshold}%</span>
            </div>
            <Slider value={[botThreshold]} onValueChange={(v) => setBotThreshold(v[0])} min={10} max={100} step={5} />
            <p className="text-xs text-muted-foreground mt-1">Traffic scoring above this threshold is treated as bot traffic</p>
          </div>
          <div>
            <Label>Bot Action</Label>
            <Select value={botAction} onValueChange={setBotAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block (drop events)</SelectItem>
                <SelectItem value="tag">Tag (mark as bot, still send)</SelectItem>
                <SelectItem value="pass">Pass (allow all)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>SEO Crawler Allowlist</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {seoAllowlist.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1">
                  {c}
                  <button onClick={() => setSeoAllowlist(seoAllowlist.filter(x => x !== c))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ad-Blocker Bypass */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Ad-Blocker Bypass</CardTitle>
          <CardDescription>Serve tracking scripts from your first-party domain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Enable First-Party Proxy</p>
              <p className="text-xs text-muted-foreground">Proxy GTM/GA4 scripts via your custom domain</p>
            </div>
            <Switch checked={adBlockBypass} onCheckedChange={setAdBlockBypass} />
          </div>
          {adBlockBypass && (
            <div>
              <Label>Custom Proxy Domain</Label>
              <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="track.yourdomain.com" />
              <p className="text-xs text-muted-foreground mt-1">Point a CNAME to our edge servers</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={() => saveConfig.mutate()}>Save All Identity Settings</Button>
    </div>
  );
}
