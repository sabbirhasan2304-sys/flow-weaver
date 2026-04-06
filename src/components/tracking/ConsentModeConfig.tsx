import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle2, AlertTriangle, Globe, Settings2, Code, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ConsentSignal {
  key: string;
  label: string;
  description: string;
  default: 'granted' | 'denied';
  current: 'granted' | 'denied';
}

export function ConsentModeConfig() {
  const [consentSignals, setConsentSignals] = useState<ConsentSignal[]>([
    { key: 'ad_storage', label: 'Ad Storage', description: 'Enables storage for advertising purposes (cookies, identifiers)', default: 'denied', current: 'denied' },
    { key: 'ad_user_data', label: 'Ad User Data', description: 'Consent to send user data to Google for advertising', default: 'denied', current: 'denied' },
    { key: 'ad_personalization', label: 'Ad Personalization', description: 'Consent for personalized advertising (remarketing)', default: 'denied', current: 'denied' },
    { key: 'analytics_storage', label: 'Analytics Storage', description: 'Enables storage for analytics purposes (e.g., visit duration)', default: 'denied', current: 'denied' },
    { key: 'functionality_storage', label: 'Functionality Storage', description: 'Enables storage for website functionality (e.g., language)', default: 'granted', current: 'granted' },
    { key: 'personalization_storage', label: 'Personalization Storage', description: 'Enables storage for personalization (e.g., recommendations)', default: 'denied', current: 'denied' },
    { key: 'security_storage', label: 'Security Storage', description: 'Enables storage for security purposes (e.g., authentication)', default: 'granted', current: 'granted' },
  ]);

  const [cmpPlatform, setCmpPlatform] = useState('custom');
  const [waitForUpdate, setWaitForUpdate] = useState('500');
  const [urlPassthrough, setUrlPassthrough] = useState(true);
  const [adsDataRedaction, setAdsDataRedaction] = useState(true);

  const updateSignal = (key: string, value: 'granted' | 'denied') => {
    setConsentSignals(prev => prev.map(s => s.key === key ? { ...s, current: value } : s));
  };

  const grantedCount = consentSignals.filter(s => s.current === 'granted').length;
  const deniedCount = consentSignals.filter(s => s.current === 'denied').length;

  const generateSnippet = () => {
    const defaults = consentSignals.reduce((acc, s) => ({ ...acc, [s.key]: s.default }), {} as Record<string, string>);
    return `<!-- NexusTrack Consent Mode v2 -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  // Set default consent state
  gtag('consent', 'default', ${JSON.stringify(defaults, null, 4)});
  
  ${urlPassthrough ? "gtag('set', 'url_passthrough', true);" : ''}
  ${adsDataRedaction ? "gtag('set', 'ads_data_redaction', true);" : ''}
</script>

<!-- Update consent when user interacts with CMP -->
<script>
  // Call this when user grants consent
  function updateConsent(consentState) {
    gtag('consent', 'update', consentState);
    
    // Notify NexusTrack
    window.nexusTrack?.updateConsent(consentState);
  }
</script>`;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(generateSnippet());
    toast.success('Consent snippet copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">Google Consent Mode v2</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure how NexusTrack handles user consent signals. Consent Mode v2 is required by Google 
                for EEA traffic since March 2024. NexusTrack automatically adjusts event data based on consent state.
              </p>
              <div className="flex gap-3 mt-3">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {grantedCount} Granted
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" /> {deniedCount} Denied
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals" className="gap-1.5"><Settings2 className="h-4 w-4" /> Consent Signals</TabsTrigger>
          <TabsTrigger value="cmp" className="gap-1.5"><Globe className="h-4 w-4" /> CMP Integration</TabsTrigger>
          <TabsTrigger value="snippet" className="gap-1.5"><Code className="h-4 w-4" /> Code Snippet</TabsTrigger>
          <TabsTrigger value="behavior" className="gap-1.5"><Eye className="h-4 w-4" /> Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Consent Signals</CardTitle>
              <CardDescription>Set the default state for each consent signal before the user interacts with your consent banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consentSignals.map((signal) => (
                <div key={signal.key} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{signal.label}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{signal.key}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{signal.description}</p>
                  </div>
                  <Select value={signal.current} onValueChange={(v: 'granted' | 'denied') => updateSignal(signal.key, v)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="granted">
                        <span className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-green-500" /> Granted
                        </span>
                      </SelectItem>
                      <SelectItem value="denied">
                        <span className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-red-500" /> Denied
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cmp">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consent Management Platform</CardTitle>
              <CardDescription>Configure your CMP integration for automatic consent updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CMP Platform</Label>
                <Select value={cmpPlatform} onValueChange={setCmpPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Implementation</SelectItem>
                    <SelectItem value="cookiebot">Cookiebot</SelectItem>
                    <SelectItem value="onetrust">OneTrust</SelectItem>
                    <SelectItem value="usercentrics">Usercentrics</SelectItem>
                    <SelectItem value="iubenda">Iubenda</SelectItem>
                    <SelectItem value="quantcast">Quantcast</SelectItem>
                    <SelectItem value="didomi">Didomi</SelectItem>
                    <SelectItem value="termly">Termly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Wait for Update (ms)</Label>
                <Input value={waitForUpdate} onChange={(e) => setWaitForUpdate(e.target.value)} type="number" placeholder="500" />
                <p className="text-xs text-muted-foreground">How long to wait for consent update before firing tags (default: 500ms)</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="text-sm font-medium text-foreground mb-2">How it works</h4>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                  <li>User visits your site → default consent state is set (all denied for ads/analytics)</li>
                  <li>Consent banner appears → NexusTrack collects basic, cookieless pings</li>
                  <li>User interacts with CMP → consent state updates to granted/denied per category</li>
                  <li>NexusTrack adjusts event enrichment based on new consent state</li>
                  <li>Events forwarded to destinations with consent signals attached</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snippet">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Integration Code</CardTitle>
                <CardDescription>Add this snippet before your NexusTrack tracking script</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={copySnippet}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-muted/50 border border-border text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground">
                {generateSnippet()}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Server-Side Behavior</CardTitle>
              <CardDescription>How NexusTrack handles events based on consent state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                <div>
                  <span className="font-medium text-sm text-foreground">URL Passthrough</span>
                  <p className="text-xs text-muted-foreground">Pass ad click information (gclid, dclid, etc.) through page URLs when cookies are denied</p>
                </div>
                <Switch checked={urlPassthrough} onCheckedChange={setUrlPassthrough} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                <div>
                  <span className="font-medium text-sm text-foreground">Ads Data Redaction</span>
                  <p className="text-xs text-muted-foreground">Redact ad click identifiers when ad_storage is denied</p>
                </div>
                <Switch checked={adsDataRedaction} onCheckedChange={setAdsDataRedaction} />
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Event Behavior by Consent State</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { state: 'All Granted', behavior: 'Full tracking: cookies, user data, ad identifiers all sent', color: 'green' },
                    { state: 'Analytics Only', behavior: 'Analytics pings sent, ad data redacted, no remarketing lists', color: 'blue' },
                    { state: 'All Denied', behavior: 'Cookieless pings only, no user identifiers, modeled conversions', color: 'red' },
                    { state: 'Partial', behavior: 'Respects each signal independently, sends only permitted data', color: 'amber' },
                  ].map((item) => (
                    <div key={item.state} className={`p-3 rounded-lg bg-${item.color}-500/5 border border-${item.color}-500/20`}>
                      <Badge variant="outline" className={`bg-${item.color}-500/10 text-${item.color}-600 border-${item.color}-200 mb-2`}>
                        {item.state}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{item.behavior}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
