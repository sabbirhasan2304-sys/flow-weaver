import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap, ShoppingBag, FileCode, Globe, CheckCircle2, ArrowRight,
  Facebook, BarChart3, Target, Megaphone, TrendingUp, Loader2
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'source' | 'destination';
  description: string;
  color: string;
}

const SOURCE_PLATFORMS: Platform[] = [
  { id: 'shopify', name: 'Shopify', icon: <ShoppingBag className="h-5 w-5" />, category: 'source', description: 'E-commerce store events', color: 'text-green-600' },
  { id: 'wordpress', name: 'WordPress', icon: <FileCode className="h-5 w-5" />, category: 'source', description: 'WooCommerce & page events', color: 'text-blue-600' },
  { id: 'custom', name: 'Custom Website', icon: <Globe className="h-5 w-5" />, category: 'source', description: 'Any website with JS snippet', color: 'text-purple-600' },
];

const DESTINATION_PLATFORMS: Platform[] = [
  { id: 'ga4', name: 'Google Analytics 4', icon: <BarChart3 className="h-5 w-5" />, category: 'destination', description: 'Measurement Protocol', color: 'text-orange-600' },
  { id: 'facebook', name: 'Meta / Facebook', icon: <Facebook className="h-5 w-5" />, category: 'destination', description: 'Conversions API (CAPI)', color: 'text-blue-500' },
  { id: 'tiktok', name: 'TikTok', icon: <Megaphone className="h-5 w-5" />, category: 'destination', description: 'Events API', color: 'text-foreground' },
  { id: 'google-ads', name: 'Google Ads', icon: <Target className="h-5 w-5" />, category: 'destination', description: 'Enhanced Conversions', color: 'text-yellow-600' },
  { id: 'snapchat', name: 'Snapchat', icon: <TrendingUp className="h-5 w-5" />, category: 'destination', description: 'Conversions API', color: 'text-yellow-400' },
];

type GatewayStep = 'select-source' | 'select-destinations' | 'configure' | 'done';

export function GatewaySetup() {
  const { profile } = useAuth();
  const [step, setStep] = useState<GatewayStep>('select-source');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedDestinations, setSelectedDestinations] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Destination configs (pixel IDs, API keys, etc.)
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});

  const toggleDestination = (id: string) => {
    setSelectedDestinations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateConfig = (destId: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [destId]: { ...prev[destId], [key]: value }
    }));
  };

  const getConfigFields = (destId: string): { key: string; label: string; placeholder: string }[] => {
    switch (destId) {
      case 'ga4': return [
        { key: 'measurement_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' },
        { key: 'api_secret', label: 'API Secret', placeholder: 'Enter your GA4 API secret' },
      ];
      case 'facebook': return [
        { key: 'pixel_id', label: 'Pixel ID', placeholder: '123456789012345' },
        { key: 'access_token', label: 'Conversions API Access Token', placeholder: 'EAAxxxxxxx...' },
      ];
      case 'tiktok': return [
        { key: 'pixel_id', label: 'Pixel ID', placeholder: 'CXXXXXXXXXX' },
        { key: 'access_token', label: 'Access Token', placeholder: 'Enter TikTok access token' },
      ];
      case 'google-ads': return [
        { key: 'customer_id', label: 'Customer ID', placeholder: '123-456-7890' },
        { key: 'conversion_label', label: 'Conversion Label', placeholder: 'AbCdEf123' },
      ];
      case 'snapchat': return [
        { key: 'pixel_id', label: 'Pixel ID', placeholder: 'Enter Snap Pixel ID' },
        { key: 'access_token', label: 'CAPI Token', placeholder: 'Enter access token' },
      ];
      default: return [];
    }
  };

  const handleSaveGateway = async () => {
    if (!profile?.user_id || !selectedSource) return;
    setSaving(true);

    // Save each destination as a tracking_destination
    for (const destId of selectedDestinations) {
      const destPlatform = DESTINATION_PLATFORMS.find(d => d.id === destId);
      await supabase.from('tracking_destinations').insert({
        user_id: profile.user_id,
        name: `${destPlatform?.name} (Gateway)`,
        type: destId,
        config: configs[destId] || {},
        is_active: true,
      });
    }

    setSaving(false);
    setStep('done');
    toast.success('Gateway configured! Events will auto-forward to your selected platforms.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Gateway Mode — No-Code Setup
          </CardTitle>
          <CardDescription>
            Pick your source platform and destinations. NexusTrack automatically maps events, sets up server-side forwarding, and handles deduplication — no pipeline building needed.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Source', 'Destinations', 'Configure', 'Done'].map((label, i) => {
          const stepIndex = ['select-source', 'select-destinations', 'configure', 'done'].indexOf(step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              <Badge variant={isActive ? 'default' : isDone ? 'secondary' : 'outline'} className={isDone ? 'bg-green-500/10 text-green-600' : ''}>
                {isDone ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                {label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Step 1: Source */}
      {step === 'select-source' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Where are your events coming from?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SOURCE_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedSource(p.id); setStep('select-destinations'); }}
                  className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 ${
                    selectedSource === p.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className={`${p.color} mb-2`}>{p.icon}</div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Destinations */}
      {step === 'select-destinations' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Where should events be sent?</CardTitle>
            <CardDescription>Select all the platforms you want to receive server-side events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DESTINATION_PLATFORMS.map((p) => {
                const selected = selectedDestinations.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleDestination(p.id)}
                    className={`p-4 rounded-lg border text-left transition-all hover:border-primary ${
                      selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={p.color}>{p.icon}</div>
                      <Switch checked={selected} onCheckedChange={() => toggleDestination(p.id)} />
                    </div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep('configure')} disabled={selectedDestinations.size === 0}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="ghost" onClick={() => setStep('select-source')}>Back</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure */}
      {step === 'configure' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Enter Your Platform Credentials</CardTitle>
            <CardDescription>These credentials are stored securely and used only for server-side event forwarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from(selectedDestinations).map((destId) => {
              const platform = DESTINATION_PLATFORMS.find(d => d.id === destId);
              const fields = getConfigFields(destId);
              return (
                <div key={destId} className="space-y-3 p-4 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className={platform?.color}>{platform?.icon}</span>
                    <p className="text-sm font-semibold">{platform?.name}</p>
                  </div>
                  {fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        value={configs[destId]?.[field.key] || ''}
                        onChange={(e) => updateConfig(destId, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="font-mono text-xs"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
            <div className="flex gap-2">
              <Button onClick={handleSaveGateway} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                Activate Gateway
              </Button>
              <Button variant="ghost" onClick={() => setStep('select-destinations')}>Back</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Gateway Active!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Events from <strong>{SOURCE_PLATFORMS.find(s => s.id === selectedSource)?.name}</strong> will be automatically forwarded server-side to:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedDestinations).map((destId) => {
                const p = DESTINATION_PLATFORMS.find(d => d.id === destId);
                return (
                  <Badge key={destId} variant="outline" className="gap-1.5 py-1.5">
                    <span className={p?.color}>{p?.icon}</span>
                    {p?.name}
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </Badge>
                );
              })}
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                <strong>What happens next:</strong> Install the tracking snippet (or use a plugin) on your {SOURCE_PLATFORMS.find(s => s.id === selectedSource)?.name} store. NexusTrack will automatically map events like page_view, add_to_cart, purchase, etc. and forward them to your selected platforms with proper deduplication.
              </p>
            </div>
            <Button variant="outline" onClick={() => { setStep('select-source'); setSelectedDestinations(new Set()); }}>
              Set Up Another Gateway
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
