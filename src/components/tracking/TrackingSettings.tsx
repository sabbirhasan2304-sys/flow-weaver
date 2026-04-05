import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Shield, Bot, Cookie } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function TrackingSettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [customDomain, setCustomDomain] = useState('');
  const [consentMode, setConsentMode] = useState('gdpr');
  const [botDetection, setBotDetection] = useState(true);
  const [botAction, setBotAction] = useState('tag');
  const [cookieRecovery, setCookieRecovery] = useState(false);
  const [cookieTtl, setCookieTtl] = useState('365');

  // Load existing identity config
  const { data: identityConfig } = useQuery({
    queryKey: ['tracking-identity-config', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('tracking_identity_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  // Load existing privacy settings
  const { data: privacySettings } = useQuery({
    queryKey: ['tracking-privacy-settings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('tracking_privacy_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  // Populate form from DB
  useEffect(() => {
    if (identityConfig) {
      setCustomDomain(identityConfig.custom_domain || '');
      setBotAction(identityConfig.bot_action || 'tag');
      setCookieTtl(String(identityConfig.cookie_ttl_days || 365));
      setCookieRecovery(identityConfig.ad_blocker_bypass || false);
      setBotDetection(identityConfig.bot_threshold > 0);
    }
    if (privacySettings) {
      const consent = privacySettings.consent_mode as any;
      if (consent?.google && consent?.meta) setConsentMode('both');
      else if (consent?.google) setConsentMode('gdpr');
      else if (consent?.meta) setConsentMode('ccpa');
      else setConsentMode('custom');
    }
  }, [identityConfig, privacySettings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');

      // Upsert identity config
      if (identityConfig?.id) {
        await supabase.from('tracking_identity_config').update({
          custom_domain: customDomain || null,
          bot_action: botAction,
          bot_threshold: botDetection ? 0.7 : 0,
          cookie_ttl_days: parseInt(cookieTtl) || 365,
          ad_blocker_bypass: cookieRecovery,
        }).eq('id', identityConfig.id);
      } else {
        await supabase.from('tracking_identity_config').insert({
          user_id: profile.id,
          custom_domain: customDomain || null,
          bot_action: botAction,
          bot_threshold: botDetection ? 0.7 : 0,
          cookie_ttl_days: parseInt(cookieTtl) || 365,
          ad_blocker_bypass: cookieRecovery,
        });
      }

      // Upsert privacy settings
      const consentData = {
        google: consentMode === 'gdpr' || consentMode === 'both',
        meta: consentMode === 'ccpa' || consentMode === 'both',
      };
      if (privacySettings?.id) {
        await supabase.from('tracking_privacy_settings').update({
          consent_mode: consentData as any,
        }).eq('id', privacySettings.id);
      } else {
        await supabase.from('tracking_privacy_settings').insert({
          user_id: profile.id,
          consent_mode: consentData as any,
        });
      }
    },
    onSuccess: () => {
      toast.success('Settings saved!');
      queryClient.invalidateQueries({ queryKey: ['tracking-identity-config'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-privacy-settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Custom Domain</CardTitle>
          </div>
          <CardDescription>Use your own domain for first-party tracking to improve data accuracy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Tracking Domain</Label>
            <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="track.yourdomain.com" />
          </div>
          <p className="text-xs text-muted-foreground">Add a CNAME record pointing to our servers. Verification will happen automatically.</p>
        </CardContent>
      </Card>

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Consent Management</CardTitle>
          </div>
          <CardDescription>Configure privacy compliance for your tracking pipelines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Consent Mode</Label>
            <Select value={consentMode} onValueChange={setConsentMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gdpr">GDPR (EU)</SelectItem>
                <SelectItem value="ccpa">CCPA (California)</SelectItem>
                <SelectItem value="both">GDPR + CCPA</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bot Detection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Bot Detection</CardTitle>
          </div>
          <CardDescription>Filter out bot and crawler traffic from your analytics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Enable Bot Detection</Label>
            <Switch checked={botDetection} onCheckedChange={setBotDetection} />
          </div>
          {botDetection && (
            <div>
              <Label>Bot Action</Label>
              <Select value={botAction} onValueChange={setBotAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block</SelectItem>
                  <SelectItem value="tag">Tag Only</SelectItem>
                  <SelectItem value="allow_seo">Allow SEO Bots</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cookie Recovery */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cookie Recovery</CardTitle>
          </div>
          <CardDescription>Extend cookie lifetime and recover tracking IDs lost by browser restrictions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Enable Cookie Recovery</Label>
            <Switch checked={cookieRecovery} onCheckedChange={setCookieRecovery} />
          </div>
          {cookieRecovery && (
            <div>
              <Label>Cookie TTL (days)</Label>
              <Input type="number" value={cookieTtl} onChange={(e) => setCookieTtl(e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} className="w-full">
        {saveSettings.isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
