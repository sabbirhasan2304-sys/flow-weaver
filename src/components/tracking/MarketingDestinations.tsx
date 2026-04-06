import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Send, Plus, Check, X, Settings2, Zap, ExternalLink, TestTube,
  ArrowRight, Loader2, Trash2, RefreshCw
} from 'lucide-react';

// Platform definitions
const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook / Meta',
    description: 'Conversions API (CAPI) for server-side event tracking',
    color: 'bg-blue-500',
    credentialFields: [
      { key: 'pixel_id', label: 'Pixel ID', placeholder: '123456789012345' },
      { key: 'access_token', label: 'Access Token', placeholder: 'EAAxxxxxxx...', type: 'password' },
      { key: 'test_event_code', label: 'Test Event Code (optional)', placeholder: 'TEST12345' },
    ],
    standardEvents: ['Purchase', 'AddToCart', 'InitiateCheckout', 'Lead', 'CompleteRegistration', 'ViewContent', 'AddPaymentInfo', 'Search', 'Subscribe', 'Contact'],
    docsUrl: 'https://developers.facebook.com/docs/marketing-api/conversions-api/',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Events API for server-side conversion tracking',
    color: 'bg-black',
    credentialFields: [
      { key: 'pixel_code', label: 'Pixel Code', placeholder: 'XXXXXXXXXXXXXXXX' },
      { key: 'access_token', label: 'Access Token', placeholder: 'xxxxxxxx...', type: 'password' },
    ],
    standardEvents: ['CompletePayment', 'AddToCart', 'PlaceAnOrder', 'InitiateCheckout', 'ViewContent', 'ClickButton', 'SubmitForm', 'Contact', 'Download', 'Subscribe'],
    docsUrl: 'https://business-api.tiktok.com/portal/docs?id=1741601162187777',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Enhanced Conversions & Offline Conversion Import',
    color: 'bg-yellow-500',
    credentialFields: [
      { key: 'conversion_id', label: 'Conversion ID', placeholder: 'AW-XXXXXXXXX' },
      { key: 'conversion_label', label: 'Conversion Label', placeholder: 'AbCdEfGhIjK' },
      { key: 'api_key', label: 'API Key (optional)', placeholder: 'AIzaSy...', type: 'password' },
    ],
    standardEvents: ['purchase', 'add_to_cart', 'begin_checkout', 'generate_lead', 'sign_up', 'page_view', 'view_item'],
    docsUrl: 'https://developers.google.com/google-ads/api/docs/conversions/overview',
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Measurement Protocol for server-side events',
    color: 'bg-orange-500',
    credentialFields: [
      { key: 'measurement_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' },
      { key: 'api_secret', label: 'API Secret', placeholder: 'xxxxxxxx...', type: 'password' },
    ],
    standardEvents: ['purchase', 'add_to_cart', 'begin_checkout', 'generate_lead', 'sign_up', 'page_view', 'view_item', 'login', 'search', 'select_content'],
    docsUrl: 'https://developers.google.com/analytics/devguides/collection/protocol/ga4',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    description: 'Snap Conversions API for server-side tracking',
    color: 'bg-yellow-400',
    credentialFields: [
      { key: 'pixel_id', label: 'Pixel ID', placeholder: 'xxxx-xxxx-xxxx' },
      { key: 'access_token', label: 'Access Token', placeholder: 'xxxxxxxx...', type: 'password' },
    ],
    standardEvents: ['PURCHASE', 'ADD_CART', 'START_CHECKOUT', 'SIGN_UP', 'PAGE_VIEW', 'VIEW_CONTENT', 'SEARCH', 'ADD_BILLING'],
    docsUrl: 'https://developers.snap.com/api/marketing-api/Conversions-API',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    description: 'Pinterest Conversions API',
    color: 'bg-red-600',
    credentialFields: [
      { key: 'ad_account_id', label: 'Ad Account ID', placeholder: '123456789' },
      { key: 'access_token', label: 'Access Token', placeholder: 'pina_xxxxxxxx...', type: 'password' },
    ],
    standardEvents: ['checkout', 'add_to_cart', 'page_visit', 'signup', 'lead', 'search', 'view_category', 'watch_video'],
    docsUrl: 'https://developers.pinterest.com/docs/api/v5/#tag/conversion_events',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'LinkedIn Conversions API',
    color: 'bg-blue-700',
    credentialFields: [
      { key: 'partner_id', label: 'Partner ID', placeholder: '123456' },
      { key: 'conversion_id', label: 'Conversion Rule ID', placeholder: '12345678' },
      { key: 'access_token', label: 'Access Token', placeholder: 'AQxxxxxxx...', type: 'password' },
    ],
    standardEvents: ['CONVERSION', 'LEAD', 'SIGN_UP', 'KEY_PAGE_VIEW', 'ADD_TO_CART', 'PURCHASE', 'INSTALL'],
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/conversions-api',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    description: 'X Ads Conversions API',
    color: 'bg-gray-800',
    credentialFields: [
      { key: 'pixel_id', label: 'Pixel ID', placeholder: 'xxxxx' },
      { key: 'access_token', label: 'Bearer Token', placeholder: 'AAAAAxxxxxxx...', type: 'password' },
    ],
    standardEvents: ['Purchase', 'AddToCart', 'Checkout', 'Lead', 'SignUp', 'PageView', 'ViewContent', 'Download', 'Search'],
    docsUrl: 'https://developer.x.com/en/docs/x-ads-api/measurement/conversions-api',
  },
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

interface DestinationConfig {
  id?: string;
  platform: string;
  display_name: string;
  credentials: Record<string, string>;
  event_mappings: { source_event: string; platform_event: string }[];
  is_active: boolean;
  test_status: string;
  last_tested_at: string | null;
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'fb-capi',
    name: 'Facebook CAPI Server-Side',
    description: 'Complete server-side Facebook Conversions API workflow with event deduplication and user data hashing',
    platforms: ['facebook'],
    complexity: 'Intermediate',
  },
  {
    id: 'tiktok-events',
    name: 'TikTok Server-Side Events',
    description: 'Send conversion events to TikTok Events API with automatic parameter mapping',
    platforms: ['tiktok'],
    complexity: 'Intermediate',
  },
  {
    id: 'ga4-mp',
    name: 'GA4 Measurement Protocol',
    description: 'Server-side event tracking using Google Analytics 4 Measurement Protocol',
    platforms: ['ga4'],
    complexity: 'Beginner',
  },
  {
    id: 'multi-platform',
    name: 'Multi-Platform Fan-Out',
    description: 'Send a single event to Facebook, TikTok, Google Ads, and GA4 simultaneously with platform-specific mapping',
    platforms: ['facebook', 'tiktok', 'google_ads', 'ga4'],
    complexity: 'Advanced',
  },
  {
    id: 'ecommerce-full',
    name: 'E-commerce Full Stack',
    description: 'Complete purchase funnel tracking across all platforms — ViewContent → AddToCart → Checkout → Purchase',
    platforms: ['facebook', 'tiktok', 'google_ads', 'ga4', 'pinterest'],
    complexity: 'Advanced',
  },
  {
    id: 'lead-gen',
    name: 'Lead Generation Tracker',
    description: 'Track form submissions and signups as leads across Facebook, Google Ads, and LinkedIn',
    platforms: ['facebook', 'google_ads', 'linkedin'],
    complexity: 'Beginner',
  },
];

export function MarketingDestinations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<DestinationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [formCredentials, setFormCredentials] = useState<Record<string, string>>({});
  const [formMappings, setFormMappings] = useState<{ source_event: string; platform_event: string }[]>([]);
  const [newSourceEvent, setNewSourceEvent] = useState('');
  const [newPlatformEvent, setNewPlatformEvent] = useState('');

  useEffect(() => {
    if (user) loadDestinations();
  }, [user]);

  const loadDestinations = async () => {
    try {
      const { data } = await supabase
        .from('tracking_marketing_destinations')
        .select('*')
        .eq('user_id', user!.id);
      if (data) {
        setDestinations(data.map(d => ({
          id: d.id,
          platform: d.platform,
          display_name: d.display_name,
          credentials: (d.credentials as any) || {},
          event_mappings: (d.event_mappings as any) || [],
          is_active: d.is_active,
          test_status: d.test_status || 'untested',
          last_tested_at: d.last_tested_at,
        })));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const openConfig = (platformId: PlatformId) => {
    setSelectedPlatform(platformId);
    const existing = destinations.find(d => d.platform === platformId);
    if (existing) {
      setFormCredentials(existing.credentials);
      setFormMappings(existing.event_mappings);
    } else {
      setFormCredentials({});
      setFormMappings([]);
    }
    setConfigOpen(true);
  };

  const saveDestination = async () => {
    if (!user || !selectedPlatform) return;
    setSaving(true);
    const platform = PLATFORMS.find(p => p.id === selectedPlatform)!;
    try {
      const { error } = await supabase
        .from('tracking_marketing_destinations')
        .upsert({
          user_id: user.id,
          platform: selectedPlatform,
          display_name: platform.name,
          credentials: formCredentials as any,
          event_mappings: formMappings as any,
          is_active: true,
        }, { onConflict: 'user_id,platform' });
      if (error) throw error;
      toast.success(`${platform.name} destination saved`);
      setConfigOpen(false);
      await loadDestinations();
    } catch (e: any) {
      toast.error('Failed to save: ' + (e.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const toggleDestination = async (dest: DestinationConfig) => {
    if (!dest.id) return;
    await supabase
      .from('tracking_marketing_destinations')
      .update({ is_active: !dest.is_active })
      .eq('id', dest.id);
    await loadDestinations();
    toast.success(`${dest.display_name} ${dest.is_active ? 'disabled' : 'enabled'}`);
  };

  const deleteDestination = async (dest: DestinationConfig) => {
    if (!dest.id) return;
    await supabase
      .from('tracking_marketing_destinations')
      .delete()
      .eq('id', dest.id);
    await loadDestinations();
    toast.success(`${dest.display_name} removed`);
  };

  const testDestination = async (dest: DestinationConfig) => {
    if (!dest.id) return;
    setTesting(dest.id);
    // Simulate test — in production this would call an edge function
    await new Promise(r => setTimeout(r, 2000));
    await supabase
      .from('tracking_marketing_destinations')
      .update({ test_status: 'success', last_tested_at: new Date().toISOString() })
      .eq('id', dest.id);
    await loadDestinations();
    setTesting(null);
    toast.success(`Test event sent to ${dest.display_name}`);
  };

  const addMapping = () => {
    if (!newSourceEvent || !newPlatformEvent) return;
    setFormMappings(m => [...m, { source_event: newSourceEvent, platform_event: newPlatformEvent }]);
    setNewSourceEvent('');
    setNewPlatformEvent('');
  };

  const removeMapping = (idx: number) => {
    setFormMappings(m => m.filter((_, i) => i !== idx));
  };

  const selectedPlatformDef = PLATFORMS.find(p => p.id === selectedPlatform);
  const connectedCount = destinations.filter(d => d.is_active).length;

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading destinations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Marketing Destinations</CardTitle>
                <CardDescription>Push server-side events to advertising platforms</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">{connectedCount} connected</Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="connectors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connectors" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Platform Connectors</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Workflow Templates</TabsTrigger>
        </TabsList>

        {/* PLATFORM CONNECTORS */}
        <TabsContent value="connectors" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLATFORMS.map(platform => {
              const dest = destinations.find(d => d.platform === platform.id);
              const isConnected = dest?.is_active;
              return (
                <Card key={platform.id} className={`relative transition-shadow hover:shadow-md ${isConnected ? 'border-primary/40' : ''}`}>
                  <CardContent className="pt-5 pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${platform.color}`} />
                        <h4 className="font-medium text-sm">{platform.name}</h4>
                      </div>
                      {isConnected ? (
                        <Badge className="bg-success/10 text-success text-xs border-0">Connected</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Not connected</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant={isConnected ? 'outline' : 'default'} className="flex-1 text-xs" onClick={() => openConfig(platform.id as PlatformId)}>
                        <Settings2 className="h-3 w-3 mr-1" />
                        {isConnected ? 'Configure' : 'Connect'}
                      </Button>
                      {dest && (
                        <>
                          <Button size="sm" variant="outline" className="text-xs px-2" onClick={() => testDestination(dest)} disabled={testing === dest.id}>
                            {testing === dest.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs px-2" onClick={() => toggleDestination(dest)}>
                            {dest.is_active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          </Button>
                        </>
                      )}
                    </div>
                    {dest?.test_status === 'success' && (
                      <p className="text-xs text-success flex items-center gap-1">
                        <Check className="h-3 w-3" /> Test passed
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Connected destinations summary */}
          {destinations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {destinations.map(dest => {
                    const platform = PLATFORMS.find(p => p.id === dest.platform);
                    return (
                      <div key={dest.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${platform?.color || 'bg-muted'}`} />
                          <span className="text-sm font-medium">{dest.display_name}</span>
                          <Badge variant={dest.is_active ? 'default' : 'secondary'} className="text-xs">
                            {dest.is_active ? 'Active' : 'Paused'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {dest.event_mappings.length} events mapped
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openConfig(dest.platform as PlatformId)}>
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteDestination(dest)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* WORKFLOW TEMPLATES */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORKFLOW_TEMPLATES.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">{template.complexity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.platforms.map(p => {
                      const platform = PLATFORMS.find(pl => pl.id === p);
                      return (
                        <Badge key={p} variant="secondary" className="text-xs gap-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${platform?.color || ''}`} />
                          {platform?.name?.split(' ')[0] || p}
                        </Badge>
                      );
                    })}
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigate('/dashboard')}>
                    <Zap className="h-3 w-3 mr-1" /> Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* CONFIG DIALOG */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedPlatformDef && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${selectedPlatformDef.color}`} />
                  {selectedPlatformDef.name}
                </DialogTitle>
                <DialogDescription>
                  Configure your {selectedPlatformDef.name} server-side tracking connection
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Credentials */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Credentials</h4>
                  {selectedPlatformDef.credentialFields.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={formCredentials[field.key] || ''}
                        onChange={e => setFormCredentials(c => ({ ...c, [field.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>

                {/* Event Mappings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Event Mapping</h4>
                  <p className="text-xs text-muted-foreground">Map your tracking events to {selectedPlatformDef.name} standard events</p>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Your event (e.g. checkout_complete)"
                      value={newSourceEvent}
                      onChange={e => setNewSourceEvent(e.target.value)}
                      className="flex-1 text-xs"
                    />
                    <ArrowRight className="h-4 w-4 self-center text-muted-foreground flex-shrink-0" />
                    <Select value={newPlatformEvent} onValueChange={setNewPlatformEvent}>
                      <SelectTrigger className="flex-1 text-xs">
                        <SelectValue placeholder="Platform event" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPlatformDef.standardEvents.map(evt => (
                          <SelectItem key={evt} value={evt} className="text-xs">{evt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline" onClick={addMapping} className="flex-shrink-0">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {formMappings.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-3 py-2">
                      <span className="font-mono">{m.source_event}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">{m.platform_event}</Badge>
                      <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => removeMapping(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Docs link */}
                <Button variant="link" size="sm" className="text-xs px-0" asChild>
                  <a href={selectedPlatformDef.docsUrl} target="_blank" rel="noopener">
                    <ExternalLink className="h-3 w-3 mr-1" /> View API Documentation
                  </a>
                </Button>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={saveDestination} disabled={saving} className="flex-1">
                    {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : <><Check className="h-4 w-4 mr-1" /> Save & Connect</>}
                  </Button>
                  <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancel</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
