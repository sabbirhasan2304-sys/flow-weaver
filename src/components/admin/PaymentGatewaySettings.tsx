import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, Settings, CheckCircle2, XCircle, 
  Eye, EyeOff, Save, TestTube, ExternalLink,
  Shield, Zap, Globe, AlertTriangle, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface GatewayConfig {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
  borderColor: string;
  enabled: boolean;
  configured: boolean;
  testMode: boolean;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
    value: string;
  }[];
  docs: string;
}

const defaultGateways: GatewayConfig[] = [
  {
    id: 'bkash',
    name: 'bKash',
    description: 'Mobile financial service - Bangladesh\'s leading MFS',
    logo: 'https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg',
    color: 'from-pink-500/15 to-pink-500/5',
    borderColor: 'border-pink-500/30',
    enabled: false,
    configured: false,
    testMode: true,
    fields: [
      { name: 'app_key', label: 'App Key', type: 'text', placeholder: 'Enter bKash App Key', required: true, value: '' },
      { name: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'Enter bKash App Secret', required: true, value: '' },
      { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter bKash Username', required: true, value: '' },
      { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter bKash Password', required: true, value: '' },
    ],
    docs: 'https://developer.bka.sh/',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    description: 'Digital financial service by Bangladesh Post Office',
    logo: 'https://nagad.com.bd/wp-content/uploads/2023/11/Nagad-Logo.svg',
    color: 'from-orange-500/15 to-orange-500/5',
    borderColor: 'border-orange-500/30',
    enabled: false,
    configured: false,
    testMode: true,
    fields: [
      { name: 'merchant_id', label: 'Merchant ID', type: 'text', placeholder: 'Enter Nagad Merchant ID', required: true, value: '' },
      { name: 'merchant_number', label: 'Merchant Number', type: 'text', placeholder: 'Enter Merchant Phone Number', required: true, value: '' },
      { name: 'public_key', label: 'Public Key', type: 'password', placeholder: 'Enter Nagad Public Key', required: true, value: '' },
      { name: 'private_key', label: 'Private Key', type: 'password', placeholder: 'Enter Nagad Private Key', required: true, value: '' },
    ],
    docs: 'https://nagad.com.bd/merchant/',
  },
  {
    id: 'sslcommerz',
    name: 'SSLCommerz',
    description: 'Leading payment gateway in Bangladesh',
    logo: 'https://sslcommerz.com/wp-content/uploads/2021/11/logo.png',
    color: 'from-blue-500/15 to-blue-500/5',
    borderColor: 'border-blue-500/30',
    enabled: false,
    configured: false,
    testMode: true,
    fields: [
      { name: 'store_id', label: 'Store ID', type: 'text', placeholder: 'Enter SSLCommerz Store ID', required: true, value: '' },
      { name: 'store_password', label: 'Store Password', type: 'password', placeholder: 'Enter SSLCommerz Store Password', required: true, value: '' },
    ],
    docs: 'https://developer.sslcommerz.com/',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'International payments & subscriptions',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    color: 'from-violet-500/15 to-violet-500/5',
    borderColor: 'border-violet-500/30',
    enabled: false,
    configured: false,
    testMode: true,
    fields: [
      { name: 'publishable_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_test_...', required: true, value: '' },
      { name: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_test_...', required: true, value: '' },
      { name: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', required: false, value: '' },
    ],
    docs: 'https://stripe.com/docs',
  },
];

export function PaymentGatewaySettings() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(defaultGateways);
  const [selectedGateway, setSelectedGateway] = useState<GatewayConfig | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load saved gateway configurations from localStorage (in production, use Supabase)
  useEffect(() => {
    const savedConfig = localStorage.getItem('payment_gateway_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setGateways(prev => prev.map(g => {
          const saved = parsed[g.id];
          if (saved) {
            return {
              ...g,
              enabled: saved.enabled || false,
              configured: saved.configured || false,
              testMode: saved.testMode ?? true,
              fields: g.fields.map(f => ({
                ...f,
                value: saved.fields?.[f.name] || '',
              })),
            };
          }
          return g;
        }));
      } catch (e) {
        console.error('Failed to load gateway config:', e);
      }
    }
  }, []);

  const handleConfigure = (gateway: GatewayConfig) => {
    setSelectedGateway({ ...gateway });
    setIsConfigDialogOpen(true);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    if (!selectedGateway) return;
    setSelectedGateway({
      ...selectedGateway,
      fields: selectedGateway.fields.map(f => 
        f.name === fieldName ? { ...f, value } : f
      ),
    });
  };

  const handleToggleEnabled = (gatewayId: string, enabled: boolean) => {
    setGateways(prev => prev.map(g => 
      g.id === gatewayId ? { ...g, enabled } : g
    ));
    
    // Save to localStorage
    saveConfig(gateways.map(g => 
      g.id === gatewayId ? { ...g, enabled } : g
    ));
    
    toast.success(`${gateways.find(g => g.id === gatewayId)?.name} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleToggleTestMode = (testMode: boolean) => {
    if (!selectedGateway) return;
    setSelectedGateway({ ...selectedGateway, testMode });
  };

  const saveConfig = (gatewaysToSave: GatewayConfig[]) => {
    const config: Record<string, any> = {};
    gatewaysToSave.forEach(g => {
      config[g.id] = {
        enabled: g.enabled,
        configured: g.configured,
        testMode: g.testMode,
        fields: g.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {}),
      };
    });
    localStorage.setItem('payment_gateway_config', JSON.stringify(config));
  };

  const handleSaveConfig = async () => {
    if (!selectedGateway) return;
    
    // Validate required fields
    const missingFields = selectedGateway.fields.filter(f => f.required && !f.value);
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedGateways = gateways.map(g => 
        g.id === selectedGateway.id 
          ? { ...selectedGateway, configured: true } 
          : g
      );
      
      setGateways(updatedGateways);
      saveConfig(updatedGateways);
      
      toast.success(`${selectedGateway.name} configured successfully`);
      setIsConfigDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedGateway) return;
    
    setIsTesting(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random success/failure for demo
      const success = Math.random() > 0.3;
      
      if (success) {
        toast.success(`${selectedGateway.name} connection successful!`);
      } else {
        toast.error(`${selectedGateway.name} connection failed. Please check your credentials.`);
      }
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const toggleSecretVisibility = (fieldName: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const getGatewayLogo = (gateway: GatewayConfig) => {
    return (
      <div className="w-12 h-12 rounded-xl bg-background shadow-sm flex items-center justify-center overflow-hidden p-2">
        <img 
          src={gateway.logo} 
          alt={gateway.name} 
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `
              <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <span class="text-lg font-bold text-muted-foreground">${gateway.name.charAt(0)}</span>
              </div>
            `;
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{gateways.length}</div>
                <div className="text-xs text-muted-foreground">Total Gateways</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{gateways.filter(g => g.configured).length}</div>
                <div className="text-xs text-muted-foreground">Configured</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{gateways.filter(g => g.enabled).length}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TestTube className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{gateways.filter(g => g.testMode && g.configured).length}</div>
                <div className="text-xs text-muted-foreground">Test Mode</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Cards */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Gateway Integrations
          </CardTitle>
          <CardDescription>Configure and manage payment providers for your platform</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gateways.map((gateway, index) => (
              <motion.div
                key={gateway.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 ${gateway.borderColor} bg-gradient-to-br ${gateway.color} hover:shadow-lg transition-all`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {getGatewayLogo(gateway)}
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {gateway.name}
                            {gateway.testMode && gateway.configured && (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                                Test Mode
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">{gateway.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={gateway.configured 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : 'bg-muted text-muted-foreground'
                          }
                        >
                          {gateway.configured ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Configured</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Not Configured</>
                          )}
                        </Badge>
                        
                        {gateway.configured && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Enabled</span>
                            <Switch 
                              checked={gateway.enabled}
                              onCheckedChange={(checked) => handleToggleEnabled(gateway.id, checked)}
                            />
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleConfigure(gateway)}
                        className="gap-1.5"
                      >
                        <Settings className="h-4 w-4" />
                        {gateway.configured ? 'Edit' : 'Configure'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedGateway && getGatewayLogo(selectedGateway)}
              <div>
                <span>Configure {selectedGateway?.name}</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  Enter your API credentials
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedGateway && (
            <div className="space-y-4">
              {/* Test/Live Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium">Test Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Use sandbox/test credentials
                    </div>
                  </div>
                </div>
                <Switch 
                  checked={selectedGateway.testMode}
                  onCheckedChange={handleToggleTestMode}
                />
              </div>

              {!selectedGateway.testMode && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-amber-700 dark:text-amber-400">
                    Live mode will process real payments. Make sure your credentials are correct.
                  </span>
                </div>
              )}

              {/* API Fields */}
              <div className="space-y-3">
                {selectedGateway.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-rose-500">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        type={field.type === 'password' && !showSecrets[field.name] ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="pr-10"
                      />
                      {field.type === 'password' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => toggleSecretVisibility(field.name)}
                        >
                          {showSecrets[field.name] ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Documentation Link */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  Need help? Check the{' '}
                  <a 
                    href={selectedGateway.docs} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline inline-flex items-center gap-1"
                  >
                    documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isTesting}
              className="gap-2"
            >
              {isTesting ? (
                <><span className="animate-spin">⚡</span> Testing...</>
              ) : (
                <><TestTube className="h-4 w-4" /> Test Connection</>
              )}
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <><span className="animate-spin">💾</span> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Configuration</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
