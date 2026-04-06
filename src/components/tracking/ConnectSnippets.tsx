import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  Globe, Code, Copy, CheckCircle2, Loader2, ShoppingBag, FileCode, Plug,
  Terminal, ExternalLink, AlertCircle, Zap, RefreshCw
} from 'lucide-react';

import { TRACKING_SCRIPT_URL, API_ENDPOINT, INTERNAL_API_URL } from '@/config/brand';

const API_BASE_URL = API_ENDPOINT;

export function ConnectSnippets() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'connected' | 'not_found' | null>(null);

  const { data: apiKey } = useQuery({
    queryKey: ['api-key-for-snippet', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('api_keys')
        .select('key_prefix')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      return data?.key_prefix || 'YOUR_API_KEY';
    },
    enabled: !!profile?.id,
  });

  const trackingScriptId = profile?.id?.slice(0, 8) || 'xxxxxxxx';

  const universalSnippet = `<!-- NexusTrack Universal Tracking -->
<script>
(function(n,e,x,u,s){n.NexusTrack=n.NexusTrack||[];
s=e.createElement('script');s.async=1;
s.src='${window.location.origin}/nexus-track.js';
s.dataset.siteId='${trackingScriptId}';
s.dataset.apiUrl='${API_BASE_URL}';
s.dataset.apiKey='${apiKey || 'YOUR_API_KEY'}';
e.head.appendChild(s);
})(window,document);
</script>`;

  const shopifySnippet = `{% comment %}
  NexusTrack for Shopify — Add to theme.liquid before </body>
{% endcomment %}
<script>
(function() {
  var NX_KEY = "${apiKey || 'YOUR_API_KEY'}";
  var NX_URL = "${API_BASE_URL}";
  var NX = {
    _post: function(ep, d) {
      fetch(NX_URL + ep, {
        method: "POST",
        headers: { "x-api-key": NX_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(d)
      }).catch(function(e) { console.warn("NexusTrack:", e); });
    },
    init: function() {
      this._post("/webhook-trigger", {
        event: "page_view",
        data: {
          page_url: window.location.href,
          referrer: document.referrer,
          title: document.title
        }
      });
      {% if customer %}
      this._post("/webhook-trigger", {
        event: "identify",
        data: {
          email: "{{ customer.email }}",
          first_name: "{{ customer.first_name }}",
          last_name: "{{ customer.last_name }}",
          orders_count: {{ customer.orders_count | default: 0 }}
        }
      });
      {% endif %}
    }
  };
  window.addEventListener("load", function() { NX.init(); });
  window.NexusTrack = NX;
})();
</script>`;

  const wordpressSteps = [
    'Go to your WordPress admin → Plugins → Add New',
    'Search for "BiztoriBD Automation" or upload the plugin ZIP',
    'Activate the plugin',
    'Navigate to BiztoriBD → Settings in the sidebar',
    `Paste your API Key: ${apiKey || 'YOUR_API_KEY'}`,
    `Set API URL to: ${API_BASE_URL}`,
    'Configure event mappings under BiztoriBD → Event Mappings',
    'Test with a sample order or page visit',
  ];

  const gtmSteps = [
    'Open Google Tag Manager → your container',
    'Go to Tags → New',
    'Choose "Custom HTML" tag type',
    'Paste the NexusTrack Universal Snippet (from the Script tab)',
    'Set trigger to "All Pages"',
    'Save, then Preview to test events arrive',
    'Publish the container when verified',
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const verifyConnection = useCallback(async () => {
    if (!verifyUrl.trim() || !profile?.id) return;
    setVerifying(true);
    setVerifyResult(null);

    const domain = verifyUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const { data: events } = await supabase
      .from('tracking_events')
      .select('id')
      .eq('user_id', profile.user_id)
      .ilike('payload', `%${domain}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (events && events.length > 0) {
      setVerifyResult('connected');
      toast.success('Your website is connected! Events are being received.');
    } else {
      const { data: events2 } = await supabase
        .from('tracking_events')
        .select('id')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (events2 && events2.length > 0) {
        setVerifyResult('connected');
        toast.success('Events detected! Your tracking is active.');
      } else {
        setVerifyResult('not_found');
        toast.error('No events found yet. Make sure the snippet is installed and visit your website.');
      }
    }
    setVerifying(false);
  }, [verifyUrl, profile]);

  useEffect(() => {
    if (!verifying || !profile?.user_id) return;
    const channel = supabase
      .channel('connect-verify')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tracking_events',
        filter: `user_id=eq.${profile.user_id}`,
      }, () => {
        setVerifyResult('connected');
        setVerifying(false);
        toast.success('🎉 First event received! Your website is connected!');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [verifying, profile?.user_id]);

  return (
    <div className="space-y-6">
      {/* Quick Start Guide */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Quick Start — Connect Your Website
          </CardTitle>
          <CardDescription>Follow these 3 steps to start tracking events from your website.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: 1, title: 'Copy Snippet', desc: 'Choose your platform below and copy the tracking code.' },
              { step: 2, title: 'Install on Site', desc: 'Paste the snippet into your website\'s HTML or CMS.' },
              { step: 3, title: 'Verify Connection', desc: 'Enter your URL below and confirm events are arriving.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/50">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Step 3: Verify Website Connection
          </CardTitle>
          <CardDescription>Enter your website URL and click verify to check if events are being received.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={verifyUrl}
              onChange={(e) => { setVerifyUrl(e.target.value); setVerifyResult(null); }}
              placeholder="https://yourwebsite.com"
              className="flex-1"
            />
            <Button onClick={verifyConnection} disabled={verifying || !verifyUrl.trim()}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Verify
            </Button>
          </div>
          {verifyResult === 'connected' && (
            <div className="mt-3 flex items-center gap-2 text-sm p-3 rounded-lg bg-green-500/10 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Connected! Your website is sending events to NexusTrack.</span>
            </div>
          )}
          {verifyResult === 'not_found' && (
            <div className="mt-3 flex items-center gap-2 text-sm p-3 rounded-lg bg-yellow-500/10 border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700 font-medium">No events found yet. Install the tracking snippet and visit your site, then try again.</span>
            </div>
          )}
          {verifying && (
            <p className="mt-2 text-xs text-muted-foreground">Listening for incoming events in real-time...</p>
          )}
        </CardContent>
      </Card>

      {/* Install Methods */}
      <Tabs defaultValue="script" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="script" className="gap-1.5"><Code className="h-4 w-4" /> Universal Script</TabsTrigger>
          <TabsTrigger value="shopify" className="gap-1.5"><ShoppingBag className="h-4 w-4" /> Shopify</TabsTrigger>
          <TabsTrigger value="wordpress" className="gap-1.5"><FileCode className="h-4 w-4" /> WordPress</TabsTrigger>
          <TabsTrigger value="gtm" className="gap-1.5"><Terminal className="h-4 w-4" /> Google Tag Manager</TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5"><Plug className="h-4 w-4" /> Server API</TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Universal Tracking Script</CardTitle>
              <CardDescription>Add this snippet to every page of your website, just before the closing &lt;/head&gt; tag.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap border">
                  {universalSnippet}
                </pre>
                <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyToClipboard(universalSnippet, 'Universal script')}>
                  {copied === 'Universal script' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">What this script does:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Automatically tracks page views, sessions, and referrer data</li>
                  <li>Captures UTM parameters and click IDs (gclid, fbclid, ttclid)</li>
                  <li>Sets a first-party cookie for cross-session identity</li>
                  <li>Detects ad blockers and routes events server-side</li>
                  <li>Sends data to your NexusTrack pipeline for processing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shopify">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-green-600" /> Shopify Integration
              </CardTitle>
              <CardDescription>Add NexusTrack to your Shopify store for complete e-commerce tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Quick Setup</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Shopify Admin → Online Store → Themes</li>
                  <li>Click <strong>Edit Code</strong> on your active theme</li>
                  <li>Open <code className="text-xs bg-muted px-1 rounded">theme.liquid</code></li>
                  <li>Paste the snippet below just before <code className="text-xs bg-muted px-1 rounded">&lt;/body&gt;</code></li>
                  <li>Save and verify using the checker above</li>
                </ol>
              </div>
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap border max-h-64 overflow-y-auto">
                  {shopifySnippet}
                </pre>
                <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyToClipboard(shopifySnippet, 'Shopify snippet')}>
                  {copied === 'Shopify snippet' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600">Tracks</Badge>
                <span className="text-xs text-muted-foreground">Page views • Customer identity • Checkout abandonment • Orders (via webhook)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wordpress">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-600" /> WordPress / WooCommerce
              </CardTitle>
              <CardDescription>Install the BiztoriBD plugin for full WooCommerce automation and tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3">
                {wordpressSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  <strong>API Key:</strong>{' '}
                  <code className="bg-muted px-2 py-0.5 rounded text-xs cursor-pointer" onClick={() => copyToClipboard(apiKey || 'YOUR_API_KEY', 'API Key')}>
                    {apiKey || 'YOUR_API_KEY'}
                  </code>
                  <Button size="sm" variant="ghost" className="ml-1 h-6 px-1" onClick={() => copyToClipboard(apiKey || 'YOUR_API_KEY', 'API Key')}>
                    {copied === 'API Key' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>API URL:</strong>{' '}
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{API_BASE_URL}</code>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Tracks</Badge>
                <span className="text-xs text-muted-foreground">Orders • Payments • Customers • Products • Cart abandonment • Page views</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gtm">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="h-5 w-5 text-orange-600" /> Google Tag Manager
              </CardTitle>
              <CardDescription>Use NexusTrack with your existing GTM setup — 100% sGTM compatible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3">
                {gtmSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  <strong>Pro tip:</strong> For server-side GTM, set your sGTM container URL as a custom domain in NexusTrack Settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plug className="h-5 w-5 text-purple-600" /> Server-to-Server API
              </CardTitle>
              <CardDescription>Send events directly from your backend using our REST API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap border">{`curl -X POST ${API_BASE_URL}/webhook-trigger \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{
    "event": "purchase",
    "data": {
      "order_id": "ORD-12345",
      "email": "customer@example.com",
      "value": 99.99,
      "currency": "USD",
      "items": [{"sku": "PROD-1", "quantity": 1, "price": 99.99}]
    }
  }'`}</pre>
                <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyToClipboard(`curl -X POST ${API_BASE_URL}/webhook-trigger -H "Content-Type: application/json" -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" -d '{"event":"purchase","data":{"order_id":"ORD-12345","email":"customer@example.com","value":99.99}}'`, 'cURL command')}>
                  {copied === 'cURL command' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { lang: 'Node.js', badge: 'npm install @nexustrack/node', color: 'text-green-600' },
                  { lang: 'Python', badge: 'pip install nexustrack', color: 'text-blue-600' },
                  { lang: 'PHP', badge: 'composer require nexustrack/php', color: 'text-purple-600' },
                ].map((sdk) => (
                  <div key={sdk.lang} className="p-3 rounded-lg border text-center">
                    <p className={`text-sm font-semibold ${sdk.color}`}>{sdk.lang}</p>
                    <code className="text-[10px] text-muted-foreground">{sdk.badge}</code>
                    <Badge variant="outline" className="mt-2 text-[10px]">Coming Soon</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open('/api-docs', '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" /> Full API Documentation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
