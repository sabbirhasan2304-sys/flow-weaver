import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Cloud, Database, Server, CheckCircle2, AlertTriangle,
  Shield, Zap, Trash2, Settings2, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataExport } from '@/components/admin/DataExport';
import { MigrationGuide } from '@/components/admin/MigrationGuide';

interface ProviderConfig {
  id: string;
  user_id: string;
  provider: string;
  display_name: string;
  connection_url: string | null;
  anon_key: string | null;
  service_role_key: string | null;
  is_active: boolean;
  migration_status: string | null;
  last_synced_at: string | null;
  config: Record<string, any>;
}

const PROVIDERS = [
  {
    id: 'lovable_cloud',
    name: 'Lovable Cloud',
    description: 'Built-in backend powered by Lovable. Zero configuration needed.',
    icon: Cloud,
    color: 'text-primary bg-primary/10 border-primary/20',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    features: ['Auto-managed', 'Free tier included', 'Edge Functions', 'Realtime'],
    requiresConfig: false,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Connect your own Supabase project for full control over your data.',
    icon: Database,
    color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    features: ['Self-hosted option', 'Full SQL access', 'Custom domains', 'Unlimited scale'],
    requiresConfig: true,
    fields: [
      { key: 'connection_url', label: 'Project URL', placeholder: 'https://your-project.supabase.co', type: 'url' },
      { key: 'anon_key', label: 'Anon / Public Key', placeholder: 'eyJhbGciOiJIUzI1NiIs...', type: 'password' },
      { key: 'service_role_key', label: 'Service Role Key (for migration)', placeholder: 'eyJhbGciOiJIUzI1NiIs...', type: 'password' },
    ],
  },
  {
    id: 'tenbyte',
    name: 'Tenbyte Cloud',
    description: 'Enterprise-grade infrastructure by Tenbyte with global edge network.',
    icon: Server,
    color: 'text-violet-600 bg-violet-500/10 border-violet-200',
    badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-200',
    features: ['Global CDN', 'Enterprise SLA', 'Custom regions', 'Dedicated support'],
    requiresConfig: true,
    fields: [
      { key: 'connection_url', label: 'API Endpoint', placeholder: 'https://your-app.tenbyte.cloud', type: 'url' },
      { key: 'anon_key', label: 'API Key', placeholder: 'tb_live_...', type: 'password' },
      { key: 'service_role_key', label: 'Admin Key (for migration)', placeholder: 'tb_admin_...', type: 'password' },
    ],
  },
];

export function BackendProviderSettings() {
  const { profile } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const { data: configs = [], refetch } = useQuery({
    queryKey: ['backend-provider-configs', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('backend_provider_config')
        .select('*')
        .order('created_at', { ascending: true });
      return (data || []) as unknown as ProviderConfig[];
    },
    enabled: !!profile?.id,
  });

  const activeProvider = configs.find(c => c.is_active);

  const saveProvider = useMutation({
    mutationFn: async ({ providerId, values }: { providerId: string; values: Record<string, string> }) => {
      if (!profile?.id) throw new Error('Not authenticated');
      const provider = PROVIDERS.find(p => p.id === providerId)!;
      const payload = {
        user_id: profile.id,
        provider: providerId,
        display_name: provider.name,
        connection_url: values.connection_url || null,
        anon_key: values.anon_key || null,
        service_role_key: values.service_role_key || null,
        is_active: false,
        config: {} as Record<string, any>,
      };
      const existing = configs.find(c => c.provider === providerId);
      if (existing) {
        const { error } = await supabase.from('backend_provider_config').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('backend_provider_config').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success('Provider configuration saved!'); refetch(); setSelectedProvider(null); },
    onError: () => toast.error('Failed to save configuration'),
  });

  const deleteProvider = useMutation({
    mutationFn: async (providerId: string) => {
      const config = configs.find(c => c.provider === providerId);
      if (!config) return;
      if (config.is_active) { toast.error('Cannot delete the active provider.'); return; }
      const { error } = await supabase.from('backend_provider_config').delete().eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Provider removed'); refetch(); },
  });

  useEffect(() => {
    if (profile?.id && configs.length === 0) {
      supabase.from('backend_provider_config').insert({
        user_id: profile.id, provider: 'lovable_cloud', display_name: 'Lovable Cloud', is_active: true,
      }).then(() => refetch());
    }
  }, [profile?.id, configs.length]);

  return (
    <div className="space-y-6">
      {/* Transparency Banner */}
      <Card className="border-amber-200 dark:border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">What this section does & doesn't do</p>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <p><strong>✅ Does:</strong> Stores connection credentials for future migration planning, provides real data export (JSON/CSV), and includes a step-by-step migration guide.</p>
                <p><strong>❌ Does NOT:</strong> Automatically switch the running backend, redirect queries to external instances, or deploy edge functions. The app always runs on Lovable Cloud. Full migration is a manual DevOps process.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Provider Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {activeProvider?.provider === 'supabase' ? (
                  <Database className="h-5 w-5 text-emerald-600" />
                ) : activeProvider?.provider === 'tenbyte' ? (
                  <Server className="h-5 w-5 text-violet-600" />
                ) : (
                  <Cloud className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Active Backend: {activeProvider?.display_name || 'Lovable Cloud'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeProvider?.connection_url || 'Using built-in Lovable Cloud infrastructure'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards — for credential storage / planning */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Migration Target Credentials
          <Badge variant="outline" className="text-[10px] ml-1">Planning Only</Badge>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const config = configs.find(c => c.provider === provider.id);
            const isActive = config?.is_active || false;
            const isConfigured = !!config;

            return (
              <Card key={provider.id} className={`relative transition-all ${isActive ? 'border-primary ring-1 ring-primary/20' : 'hover:border-muted-foreground/30'}`}>
                {isActive && (
                  <div className="absolute -top-2.5 left-4">
                    <Badge className="bg-primary text-primary-foreground text-[10px]">Current</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${provider.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isConfigured && !isActive && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteProvider.mutate(provider.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-sm mt-2">{provider.name}</CardTitle>
                  <CardDescription className="text-xs">{provider.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {provider.features.map((f) => (
                      <Badge key={f} variant="outline" className={`text-[10px] ${provider.badgeColor}`}>{f}</Badge>
                    ))}
                  </div>
                  {isConfigured && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">Credentials Saved</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {provider.requiresConfig && (
                      <Button variant="outline" size="sm" className="flex-1 text-xs"
                        onClick={() => {
                          setSelectedProvider(provider.id);
                          if (config) {
                            setConfigValues({
                              connection_url: config.connection_url || '',
                              anon_key: config.anon_key || '',
                              service_role_key: config.service_role_key || '',
                            });
                          } else { setConfigValues({}); }
                        }}>
                        <Settings2 className="h-3 w-3 mr-1" />
                        {isConfigured ? 'Edit' : 'Save Credentials'}
                      </Button>
                    )}
                    {isActive && !provider.requiresConfig && (
                      <Button variant="outline" size="sm" className="flex-1 text-xs" disabled>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Default
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Real Data Export */}
      <DataExport />

      {/* Migration Guide */}
      <MigrationGuide />

      {/* Configure Provider Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={(open) => !open && setSelectedProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Save Credentials — {PROVIDERS.find(p => p.id === selectedProvider)?.name}
            </DialogTitle>
            <DialogDescription>
              Store your connection details for future migration. This does NOT switch the running backend.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {PROVIDERS.find(p => p.id === selectedProvider)?.fields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <div className="relative">
                  <Input
                    type={field.type === 'password' && !showKeys[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={configValues[field.key] || ''}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                  {field.type === 'password' && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowKeys(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                    >
                      {showKeys[field.key] ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProvider(null)}>Cancel</Button>
            <Button
              onClick={() => selectedProvider && saveProvider.mutate({ providerId: selectedProvider, values: configValues })}
              disabled={saveProvider.isPending}
            >
              {saveProvider.isPending ? 'Saving...' : 'Save Credentials'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
