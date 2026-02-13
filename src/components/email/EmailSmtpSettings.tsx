import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Server, Trash2, TestTube, CheckCircle, XCircle, Mail } from 'lucide-react';

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

export function EmailSmtpSettings() {
  const { profile } = useAuth();
  const [configs, setConfigs] = useState<SmtpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', provider: 'cpanel', host: '', port: '465', username: '', password: '',
    encryption: 'ssl', from_email: '', from_name: '', api_key: '',
    daily_limit: '500', hourly_limit: '100',
  });

  useEffect(() => {
    if (profile) fetchConfigs();
  }, [profile]);

  const fetchConfigs = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase.from('email_smtp_configs').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false });
    setConfigs(data || []);
    setLoading(false);
  };

  const createConfig = async () => {
    if (!profile || !form.name || !form.from_email) return;
    const { error } = await supabase.from('email_smtp_configs').insert({
      profile_id: profile.id,
      name: form.name,
      provider: form.provider,
      host: form.provider === 'cpanel' ? form.host : null,
      port: form.provider === 'cpanel' ? parseInt(form.port) : null,
      username: form.provider === 'cpanel' ? form.username : null,
      password: form.provider === 'cpanel' ? form.password : null,
      encryption: form.provider === 'cpanel' ? form.encryption : null,
      from_email: form.from_email,
      from_name: form.from_name || null,
      api_key: form.provider === 'resend' ? form.api_key : null,
      daily_limit: parseInt(form.daily_limit),
      hourly_limit: parseInt(form.hourly_limit),
    });
    if (error) toast.error('Failed to add SMTP config');
    else {
      toast.success('SMTP configuration added');
      setDialogOpen(false);
      setForm({ name: '', provider: 'cpanel', host: '', port: '465', username: '', password: '', encryption: 'ssl', from_email: '', from_name: '', api_key: '', daily_limit: '500', hourly_limit: '100' });
      fetchConfigs();
    }
  };

  const testConnection = async (config: SmtpConfig) => {
    setTesting(config.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: { action: 'test', smtp_config_id: config.id, test_email: profile?.email },
      });
      if (error) throw error;
      toast.success('Test email sent successfully!');
    } catch {
      toast.error('Connection test failed');
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
    fetchConfigs();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Configure your email sending servers</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add SMTP</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add SMTP Configuration</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My cPanel Mail" /></div>
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpanel">cPanel SMTP</SelectItem>
                    <SelectItem value="resend">Resend API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.provider === 'cpanel' ? (
                <>
                  <div><Label>SMTP Host *</Label><Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="mail.techborno.com" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Port</Label><Input value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} /></div>
                    <div>
                      <Label>Encryption</Label>
                      <Select value={form.encryption} onValueChange={v => setForm({ ...form, encryption: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Username</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="noreply@techborno.com" /></div>
                  <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                </>
              ) : (
                <div><Label>Resend API Key *</Label><Input value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="re_..." /></div>
              )}

              <div><Label>From Email *</Label><Input value={form.from_email} onChange={e => setForm({ ...form, from_email: e.target.value })} placeholder="noreply@techborno.com" /></div>
              <div><Label>From Name</Label><Input value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} placeholder="TechBorno" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Daily Limit</Label><Input value={form.daily_limit} onChange={e => setForm({ ...form, daily_limit: e.target.value })} /></div>
                <div><Label>Hourly Limit</Label><Input value={form.hourly_limit} onChange={e => setForm({ ...form, hourly_limit: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createConfig}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : configs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No SMTP configurations yet</p>
          <p className="text-xs mt-1">Add your cPanel SMTP or Resend API settings to start sending emails</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map(config => (
            <Card key={config.id} className={config.is_default ? 'border-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {config.provider === 'cpanel' ? <Server className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      {config.name}
                      {config.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                    </CardTitle>
                    <CardDescription>{config.from_email}</CardDescription>
                  </div>
                  <Badge variant={config.is_active ? 'default' : 'secondary'}>{config.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Provider: <strong>{config.provider === 'cpanel' ? 'cPanel SMTP' : 'Resend'}</strong></p>
                  {config.host && <p>Host: {config.host}:{config.port} ({config.encryption})</p>}
                  <p>Sent today: {config.emails_sent_today} / {config.daily_limit}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => testConnection(config)} disabled={testing === config.id}>
                    <TestTube className="h-3 w-3 mr-1" />{testing === config.id ? 'Testing...' : 'Test'}
                  </Button>
                  {!config.is_default && <Button variant="outline" size="sm" onClick={() => toggleDefault(config.id)}>Set Default</Button>}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteConfig(config.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
