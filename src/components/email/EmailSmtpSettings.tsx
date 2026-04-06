import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Server, Trash2, TestTube, Mail, Eye, EyeOff, Shield, AlertCircle, CheckCircle2, HardDrive, Globe, Info } from 'lucide-react';

interface SmtpConfig {
  id: string;
  name: string;
  provider: string;
  host: string | null;
  port: number | null;
  username: string | null;
  encryption: string | null;
  from_email: string;
  from_name: string | null;
  is_default: boolean;
  is_active: boolean;
  daily_limit: number;
  hourly_limit: number;
  emails_sent_today: number;
  created_at: string;
}

const PROVIDER_PRESETS: Record<string, { host: string; port: string; encryption: string; label: string; icon: React.ReactNode; description: string }> = {
  vps_smtp: { host: '', port: '587', encryption: 'tls', label: 'VPS / Custom SMTP', icon: <HardDrive className="h-4 w-4" />, description: 'Use your own VPS mail server (Postfix, hMailServer, iRedMail, etc.)' },
  cpanel: { host: '', port: '465', encryption: 'ssl', label: 'cPanel SMTP', icon: <Server className="h-4 w-4" />, description: 'cPanel-hosted email with SMTP' },
  sendgrid: { host: 'smtp.sendgrid.net', port: '587', encryption: 'tls', label: 'SendGrid', icon: <Mail className="h-4 w-4" />, description: 'SendGrid SMTP relay service' },
  mailgun: { host: 'smtp.mailgun.org', port: '587', encryption: 'tls', label: 'Mailgun', icon: <Mail className="h-4 w-4" />, description: 'Mailgun SMTP relay' },
  ses: { host: '', port: '587', encryption: 'tls', label: 'Amazon SES', icon: <Globe className="h-4 w-4" />, description: 'Amazon Simple Email Service SMTP' },
  resend: { host: '', port: '', encryption: '', label: 'Resend API', icon: <Mail className="h-4 w-4" />, description: 'Resend API (no SMTP needed)' },
  zoho: { host: 'smtp.zoho.com', port: '465', encryption: 'ssl', label: 'Zoho Mail', icon: <Mail className="h-4 w-4" />, description: 'Zoho Mail SMTP' },
  gmail: { host: 'smtp.gmail.com', port: '587', encryption: 'tls', label: 'Gmail / Google Workspace', icon: <Mail className="h-4 w-4" />, description: 'Gmail SMTP (requires App Password)' },
  outlook: { host: 'smtp.office365.com', port: '587', encryption: 'tls', label: 'Outlook / Microsoft 365', icon: <Mail className="h-4 w-4" />, description: 'Microsoft 365 SMTP relay' },
};

const VPS_SETUP_STEPS = [
  { title: 'Install Mail Server', desc: 'On your VPS, install Postfix, hMailServer, or iRedMail. For Ubuntu: sudo apt install postfix' },
  { title: 'Configure DNS Records', desc: 'Add SPF (v=spf1 ip4:YOUR_IP ~all), DKIM, and DMARC records to your domain DNS' },
  { title: 'Set Up TLS/SSL', desc: 'Use Let\'s Encrypt to secure SMTP connections: sudo certbot certonly --standalone -d mail.yourdomain.com' },
  { title: 'Create Email Account', desc: 'Create a sending email account on your mail server (e.g., noreply@yourdomain.com)' },
  { title: 'Open Firewall Ports', desc: 'Ensure ports 25, 465, 587 are open. Check with your VPS provider if port 25 is blocked.' },
  { title: 'Add SMTP Here', desc: 'Click "Add SMTP" above and enter your VPS mail server details to start sending.' },
];

export function EmailSmtpSettings() {
  const { profile } = useAuth();
  const [configs, setConfigs] = useState<SmtpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', provider: 'vps_smtp', host: '', port: '587', username: '', password: '',
    encryption: 'tls', from_email: '', from_name: '', api_key: '',
    daily_limit: '500', hourly_limit: '100',
  });

  useEffect(() => {
    if (profile) fetchConfigs();
  }, [profile]);

  const fetchConfigs = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase.from('email_smtp_configs').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false });
    setConfigs((data as SmtpConfig[]) || []);
    setLoading(false);
  };

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider];
    setForm(prev => ({
      ...prev,
      provider,
      host: preset?.host || '',
      port: preset?.port || '587',
      encryption: preset?.encryption || 'tls',
    }));
  };

  const isSmtpProvider = form.provider !== 'resend';

  const createConfig = async () => {
    if (!profile || !form.name || !form.from_email) {
      toast.error('Please fill in name and from email');
      return;
    }
    if (isSmtpProvider && !form.host) {
      toast.error('Please enter SMTP host');
      return;
    }

    const { error } = await supabase.from('email_smtp_configs').insert({
      profile_id: profile.id,
      name: form.name,
      provider: form.provider,
      host: isSmtpProvider ? form.host : null,
      port: isSmtpProvider ? parseInt(form.port) : null,
      username: isSmtpProvider ? form.username : null,
      password: isSmtpProvider ? form.password : null,
      encryption: isSmtpProvider ? form.encryption : null,
      from_email: form.from_email,
      from_name: form.from_name || null,
      api_key: form.provider === 'resend' ? form.api_key : null,
      daily_limit: parseInt(form.daily_limit),
      hourly_limit: parseInt(form.hourly_limit),
    });

    if (error) toast.error('Failed to add SMTP config');
    else {
      toast.success('SMTP configuration added successfully!');
      setDialogOpen(false);
      setForm({ name: '', provider: 'vps_smtp', host: '', port: '587', username: '', password: '', encryption: 'tls', from_email: '', from_name: '', api_key: '', daily_limit: '500', hourly_limit: '100' });
      fetchConfigs();
    }
  };

  const testConnection = async (config: SmtpConfig) => {
    setTesting(config.id);
    try {
      const { error } = await supabase.functions.invoke('send-email-campaign', {
        body: { action: 'test', smtp_config_id: config.id, test_email: profile?.email },
      });
      if (error) throw error;
      toast.success('Test email sent! Check your inbox.');
    } catch {
      toast.error('Connection test failed. Check your SMTP settings.');
    }
    setTesting(null);
  };

  const deleteConfig = async (id: string) => {
    const { error } = await supabase.from('email_smtp_configs').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchConfigs(); }
  };

  const toggleDefault = async (id: string) => {
    if (!profile) return;
    await supabase.from('email_smtp_configs').update({ is_default: false }).eq('profile_id', profile.id);
    await supabase.from('email_smtp_configs').update({ is_default: true }).eq('id', id);
    toast.success('Default SMTP updated');
    fetchConfigs();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from('email_smtp_configs').update({ is_active: !currentActive }).eq('id', id);
    toast.success(currentActive ? 'SMTP deactivated' : 'SMTP activated');
    fetchConfigs();
  };

  const getProviderLabel = (provider: string) => PROVIDER_PRESETS[provider]?.label || provider;

  return (
    <div className="space-y-6 mt-4">
      <Tabs defaultValue="configs">
        <TabsList>
          <TabsTrigger value="configs" className="gap-1.5"><Server className="h-3.5 w-3.5" />SMTP Servers</TabsTrigger>
          <TabsTrigger value="vps-guide" className="gap-1.5"><HardDrive className="h-3.5 w-3.5" />VPS Setup Guide</TabsTrigger>
          <TabsTrigger value="dns" className="gap-1.5"><Shield className="h-3.5 w-3.5" />DNS & Deliverability</TabsTrigger>
        </TabsList>

        {/* SMTP Configs Tab */}
        <TabsContent value="configs" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Configure your email sending servers — use your own VPS, cPanel, or third-party SMTP</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add SMTP</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add SMTP Configuration</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                  {/* Name */}
                  <div className="space-y-1">
                    <Label>Configuration Name *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., My VPS Mail Server" />
                  </div>

                  {/* Provider */}
                  <div className="space-y-1">
                    <Label>Provider / Server Type</Label>
                    <Select value={form.provider} onValueChange={handleProviderChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {preset.icon}
                              <span>{preset.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{PROVIDER_PRESETS[form.provider]?.description}</p>
                  </div>

                  {/* SMTP Fields */}
                  {isSmtpProvider && (
                    <>
                      <div className="space-y-1">
                        <Label>SMTP Host *</Label>
                        <Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder={form.provider === 'vps_smtp' ? 'mail.yourdomain.com or VPS IP' : PROVIDER_PRESETS[form.provider]?.host || 'smtp.example.com'} />
                        {form.provider === 'vps_smtp' && (
                          <p className="text-xs text-muted-foreground">Enter your VPS hostname or IP address</p>
                        )}
                        {form.provider === 'ses' && (
                          <p className="text-xs text-muted-foreground">e.g., email-smtp.us-east-1.amazonaws.com</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Port</Label>
                          <Input value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} />
                          <p className="text-xs text-muted-foreground">587 (TLS) or 465 (SSL)</p>
                        </div>
                        <div className="space-y-1">
                          <Label>Encryption</Label>
                          <Select value={form.encryption} onValueChange={v => setForm({ ...form, encryption: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tls">STARTTLS (Port 587)</SelectItem>
                              <SelectItem value="ssl">SSL/TLS (Port 465)</SelectItem>
                              <SelectItem value="none">None (Port 25)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Username</Label>
                        <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder={form.provider === 'sendgrid' ? 'apikey' : 'noreply@yourdomain.com'} />
                        {form.provider === 'sendgrid' && <p className="text-xs text-muted-foreground">For SendGrid, username is always "apikey"</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Password</Label>
                        <div className="relative">
                          <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={form.provider === 'sendgrid' ? 'Your SendGrid API key' : form.provider === 'gmail' ? 'App Password (not regular password)' : 'SMTP password'} className="pr-10" />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                        {form.provider === 'gmail' && (
                          <p className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Use an App Password, not your regular Google password</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Resend API Key */}
                  {!isSmtpProvider && (
                    <div className="space-y-1">
                      <Label>Resend API Key *</Label>
                      <Input value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="re_..." />
                    </div>
                  )}

                  {/* From fields */}
                  <div className="pt-2 border-t border-border space-y-3">
                    <h4 className="text-sm font-medium">Sender Identity</h4>
                    <div className="space-y-1">
                      <Label>From Email *</Label>
                      <Input value={form.from_email} onChange={e => setForm({ ...form, from_email: e.target.value })} placeholder="noreply@yourdomain.com" />
                    </div>
                    <div className="space-y-1">
                      <Label>From Name</Label>
                      <Input value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} placeholder="Your Brand Name" />
                    </div>
                  </div>

                  {/* Rate limits */}
                  <div className="pt-2 border-t border-border space-y-3">
                    <h4 className="text-sm font-medium">Rate Limits</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Daily Limit</Label>
                        <Input value={form.daily_limit} onChange={e => setForm({ ...form, daily_limit: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Hourly Limit</Label>
                        <Input value={form.hourly_limit} onChange={e => setForm({ ...form, hourly_limit: e.target.value })} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Set limits to avoid hitting your provider's sending quota</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={createConfig}>Add Configuration</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : configs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No SMTP configurations yet</p>
              <p className="text-xs mt-1 max-w-md mx-auto">Add your own VPS SMTP, cPanel, SendGrid, or any SMTP server to start sending emails from your campaigns</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Your First SMTP</Button>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configs.map(config => (
                <Card key={config.id} className={config.is_default ? 'border-primary shadow-sm' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {PROVIDER_PRESETS[config.provider]?.icon || <Server className="h-4 w-4" />}
                          {config.name}
                          {config.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                        </CardTitle>
                        <CardDescription>{config.from_name ? `${config.from_name} <${config.from_email}>` : config.from_email}</CardDescription>
                      </div>
                      <Badge
                        variant={config.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(config.id, config.is_active)}
                      >
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Provider: <strong>{getProviderLabel(config.provider)}</strong></p>
                      {config.host && <p>Host: <span className="font-mono text-foreground/80">{config.host}:{config.port}</span> ({config.encryption?.toUpperCase()})</p>}
                      <div className="flex items-center gap-4">
                        <p>Today: <strong>{config.emails_sent_today}</strong> / {config.daily_limit}</p>
                        <p>Hourly: {config.hourly_limit}/hr</p>
                      </div>
                      {/* Usage bar */}
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary rounded-full h-1.5 transition-all"
                          style={{ width: `${Math.min((config.emails_sent_today / config.daily_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => testConnection(config)} disabled={testing === config.id}>
                        <TestTube className="h-3 w-3 mr-1" />{testing === config.id ? 'Sending...' : 'Test'}
                      </Button>
                      {!config.is_default && (
                        <Button variant="outline" size="sm" onClick={() => toggleDefault(config.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />Set Default
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={() => deleteConfig(config.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* VPS Setup Guide */}
        <TabsContent value="vps-guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary" />VPS Mail Server Setup Guide</CardTitle>
              <CardDescription>Step-by-step guide to set up your own mail server on a VPS and connect it here</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {VPS_SETUP_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{i + 1}</div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2"><Info className="h-4 w-4 text-primary" />Recommended VPS Providers for Bangladesh</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="p-2 rounded bg-background border">
                    <p className="font-medium text-foreground">DigitalOcean</p>
                    <p>From $4/mo — Port 25 open on request</p>
                  </div>
                  <div className="p-2 rounded bg-background border">
                    <p className="font-medium text-foreground">Contabo</p>
                    <p>From €4.99/mo — Port 25 open by default</p>
                  </div>
                  <div className="p-2 rounded bg-background border">
                    <p className="font-medium text-foreground">Hetzner</p>
                    <p>From €3.29/mo — Request port 25 unblock</p>
                  </div>
                  <div className="p-2 rounded bg-background border">
                    <p className="font-medium text-foreground">Local BD Hosting</p>
                    <p>ExonHost, WebHostBD — cPanel with SMTP</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400"><AlertCircle className="h-4 w-4" />Important Notes</h4>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Many VPS providers block port 25 by default — you may need to request unblocking</li>
                  <li>Always use port 587 (STARTTLS) or 465 (SSL) for better deliverability</li>
                  <li>Set up reverse DNS (PTR record) pointing to your mail hostname</li>
                  <li>Without proper SPF/DKIM/DMARC, emails will likely land in spam</li>
                  <li>Start with low volume and gradually increase to build sender reputation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DNS & Deliverability */}
        <TabsContent value="dns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />DNS Records for Email Deliverability</CardTitle>
              <CardDescription>Essential DNS records to ensure your emails reach the inbox</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: 'SPF Record',
                  type: 'TXT',
                  host: '@',
                  value: 'v=spf1 ip4:YOUR_SERVER_IP ~all',
                  desc: 'Authorizes your server IP to send emails for your domain',
                },
                {
                  name: 'DKIM Record',
                  type: 'TXT',
                  host: 'default._domainkey',
                  value: 'v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY',
                  desc: 'Cryptographic signature to verify email authenticity',
                },
                {
                  name: 'DMARC Record',
                  type: 'TXT',
                  host: '_dmarc',
                  value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
                  desc: 'Policy for handling emails that fail SPF/DKIM checks',
                },
                {
                  name: 'MX Record',
                  type: 'MX',
                  host: '@',
                  value: '10 mail.yourdomain.com',
                  desc: 'Points incoming mail to your mail server',
                },
                {
                  name: 'PTR Record (Reverse DNS)',
                  type: 'PTR',
                  host: 'Your IP',
                  value: 'mail.yourdomain.com',
                  desc: 'Set via your VPS provider — maps IP back to hostname',
                },
              ].map((record, i) => (
                <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-foreground">{record.name}</h4>
                    <Badge variant="outline" className="text-xs">{record.type}</Badge>
                  </div>
                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">Host:</span> <code className="bg-muted px-1 rounded">{record.host}</code></p>
                    <p><span className="text-muted-foreground">Value:</span> <code className="bg-muted px-1 rounded text-primary/80 break-all">{record.value}</code></p>
                    <p className="text-muted-foreground mt-1">{record.desc}</p>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Deliverability Checklist</h4>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  {[
                    'SPF record configured and valid',
                    'DKIM signing enabled on mail server',
                    'DMARC policy set to at least "quarantine"',
                    'PTR/Reverse DNS matches mail hostname',
                    'Server IP not on any blocklist (check mxtoolbox.com)',
                    'TLS encryption enabled (port 587 or 465)',
                    'Proper From header with valid reply-to address',
                    'Unsubscribe header included in marketing emails',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded border border-muted-foreground/30 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
