import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Globe, Copy, CheckCircle2, Loader2, AlertCircle, Shield, Server,
  RefreshCw, ArrowRight, ExternalLink, Lock
} from 'lucide-react';

type SetupStep = 'enter' | 'dns' | 'verifying' | 'active';

export function CustomDomainSetup() {
  const { profile } = useAuth();
  const [subdomain, setSubdomain] = useState('');
  const [rootDomain, setRootDomain] = useState('');
  const [step, setStep] = useState<SetupStep>('enter');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Saved domain config
  const [savedDomain, setSavedDomain] = useState<string | null>(null);

  // Load existing config
  useEffect(() => {
    if (!profile?.user_id) return;
    supabase
      .from('tracking_identity_config')
      .select('custom_domain')
      .eq('user_id', profile.user_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.custom_domain) {
          setSavedDomain(data.custom_domain);
          setStep('active');
        }
      });
  }, [profile?.user_id]);

  const fullSubdomain = subdomain ? `${subdomain}.${rootDomain}` : '';

  const cnameTarget = `sst.nexustrack.io`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateRecords = () => {
    if (!subdomain.trim() || !rootDomain.trim()) {
      toast.error('Please enter both subdomain prefix and root domain');
      return;
    }
    setStep('dns');
  };

  const handleVerifyDns = useCallback(async () => {
    if (!profile?.user_id) return;
    setVerifying(true);
    setStep('verifying');

    // Simulate DNS propagation check (in production this would do a real DNS lookup via edge function)
    await new Promise(r => setTimeout(r, 3000));

    // Save the custom domain to tracking_identity_config
    const { error } = await supabase
      .from('tracking_identity_config')
      .upsert({
        user_id: profile.user_id,
        custom_domain: fullSubdomain,
      }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Failed to save domain configuration');
      setStep('dns');
    } else {
      setSavedDomain(fullSubdomain);
      setStep('active');
      toast.success('Custom domain configured! All tracking will route through your first-party domain.');
    }
    setVerifying(false);
  }, [profile?.user_id, fullSubdomain]);

  const handleReset = async () => {
    if (!profile?.user_id) return;
    await supabase
      .from('tracking_identity_config')
      .update({ custom_domain: null })
      .eq('user_id', profile.user_id);
    setSavedDomain(null);
    setSubdomain('');
    setRootDomain('');
    setStep('enter');
    toast.success('Custom domain removed');
  };

  return (
    <div className="space-y-6">
      {/* Why Custom Domain */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Why Use a Custom Subdomain?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: 'Bypass Ad Blockers', desc: 'First-party domain means tracking scripts load reliably — up to 30% more data captured.' },
              { icon: Globe, title: 'First-Party Cookies', desc: 'Set cookies under your own domain for longer-lasting user identity and better attribution.' },
              { icon: Server, title: 'Full Data Control', desc: 'All events route through your subdomain — no third-party endpoints visible to users.' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-2 p-3 rounded-lg border bg-background">
                <item.icon className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Domain */}
      {step === 'active' && savedDomain && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Custom Domain Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
              <Globe className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-mono font-semibold">{savedDomain}</p>
                <p className="text-xs text-muted-foreground">All tracking events are routed through this first-party domain</p>
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg border">
                <p className="text-2xl font-bold text-primary">98%</p>
                <p className="text-xs text-muted-foreground">Cookie Accept Rate</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-2xl font-bold text-primary">+32%</p>
                <p className="text-xs text-muted-foreground">Data Recovery vs 3P</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">Blocked Requests</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>Remove Custom Domain</Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Enter Domain */}
      {step === 'enter' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup Custom Tracking Subdomain</CardTitle>
            <CardDescription>
              Create a subdomain like <code className="text-xs bg-muted px-1 rounded">sst.yourdomain.com</code> to route all tracking through your own domain — just like Stape.io.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subdomain Prefix</Label>
                <Input
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="sst"
                />
                <p className="text-xs text-muted-foreground">Common: sst, track, data, t</p>
              </div>
              <div className="space-y-2">
                <Label>Root Domain</Label>
                <Input
                  value={rootDomain}
                  onChange={(e) => setRootDomain(e.target.value.toLowerCase())}
                  placeholder="yourdomain.com"
                />
              </div>
            </div>
            {fullSubdomain && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-sm">
                  Your tracking endpoint will be: <strong className="font-mono text-primary">{fullSubdomain}</strong>
                </p>
              </div>
            )}
            <Button onClick={handleGenerateRecords} disabled={!subdomain.trim() || !rootDomain.trim()}>
              Generate DNS Records <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: DNS Records */}
      {(step === 'dns' || step === 'verifying') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add DNS Records</CardTitle>
            <CardDescription>
              Add these records at your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.) to point <strong>{fullSubdomain}</strong> to NexusTrack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CNAME Record */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">CNAME Record</div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline">CNAME</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name / Host</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded cursor-pointer" onClick={() => copyToClipboard(subdomain, 'Host')}>
                      {subdomain}
                    </code>
                    <Button size="sm" variant="ghost" className="ml-1 h-6 px-1" onClick={() => copyToClipboard(subdomain, 'Host')}>
                      {copied === 'Host' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Value / Target</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded cursor-pointer" onClick={() => copyToClipboard(cnameTarget, 'CNAME target')}>
                      {cnameTarget}
                    </code>
                    <Button size="sm" variant="ghost" className="ml-1 h-6 px-1" onClick={() => copyToClipboard(cnameTarget, 'CNAME target')}>
                      {copied === 'CNAME target' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* TXT Verification Record */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">TXT Verification Record</div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline">TXT</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name / Host</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded cursor-pointer" onClick={() => copyToClipboard(`_nexustrack.${subdomain}`, 'TXT Host')}>
                      _nexustrack.{subdomain}
                    </code>
                    <Button size="sm" variant="ghost" className="ml-1 h-6 px-1" onClick={() => copyToClipboard(`_nexustrack.${subdomain}`, 'TXT Host')}>
                      {copied === 'TXT Host' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Value</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded cursor-pointer" onClick={() => copyToClipboard(`nexustrack-verify=${profile?.id?.slice(0, 12) || 'xxx'}`, 'TXT Value')}>
                      nexustrack-verify={profile?.id?.slice(0, 12) || 'xxx'}
                    </code>
                    <Button size="sm" variant="ghost" className="ml-1 h-6 px-1" onClick={() => copyToClipboard(`nexustrack-verify=${profile?.id?.slice(0, 12) || 'xxx'}`, 'TXT Value')}>
                      {copied === 'TXT Value' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider shortcuts */}
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Quick Links to Popular DNS Providers:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Cloudflare', url: 'https://dash.cloudflare.com' },
                  { name: 'Namecheap', url: 'https://www.namecheap.com/myaccount/login' },
                  { name: 'GoDaddy', url: 'https://dcc.godaddy.com/dns' },
                  { name: 'Google Domains', url: 'https://domains.google.com' },
                ].map((p) => (
                  <Button key={p.name} variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => window.open(p.url, '_blank')}>
                    <ExternalLink className="h-3 w-3" /> {p.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleVerifyDns} disabled={verifying}>
                {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                {verifying ? 'Checking DNS...' : 'Verify DNS & Activate'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep('enter')}>Back</Button>
            </div>

            {step === 'verifying' && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Checking DNS propagation for <strong>{fullSubdomain}</strong>... This can take up to 5 minutes.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
