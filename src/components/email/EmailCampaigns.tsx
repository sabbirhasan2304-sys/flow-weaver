import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Send, Trash2, Search, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import { ABTestEditor } from './ABTestEditor';

interface Campaign {
  id: string;
  name: string;
  subject: string | null;
  status: string;
  campaign_type: string;
  total_recipients: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  list_id: string | null;
  smtp_config_id: string | null;
  is_ab_test: boolean;
}

interface EmailList { id: string; name: string; subscriber_count: number; }
interface SmtpConfig { id: string; name: string; from_email: string; }

export function EmailCampaigns() {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [abTestCampaignId, setAbTestCampaignId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', list_id: '', smtp_config_id: '', html_content: '' });

  useEffect(() => {
    if (profile) { fetchCampaigns(); fetchLists(); fetchSmtpConfigs(); }
  }, [profile]);

  const fetchCampaigns = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase.from('email_campaigns').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchLists = async () => {
    if (!profile) return;
    const { data } = await supabase.from('email_lists').select('id, name, subscriber_count').eq('profile_id', profile.id);
    setLists(data || []);
  };

  const fetchSmtpConfigs = async () => {
    if (!profile) return;
    const { data } = await supabase.from('email_smtp_configs').select('id, name, from_email').eq('profile_id', profile.id).eq('is_active', true);
    setSmtpConfigs(data || []);
  };

  const createCampaign = async () => {
    if (!profile || !form.name) return;
    const { error } = await supabase.from('email_campaigns').insert({
      profile_id: profile.id,
      name: form.name,
      subject: form.subject || null,
      list_id: form.list_id || null,
      smtp_config_id: form.smtp_config_id || null,
      html_content: form.html_content || null,
    });
    if (error) toast.error('Failed to create campaign');
    else { toast.success('Campaign created'); setDialogOpen(false); setForm({ name: '', subject: '', list_id: '', smtp_config_id: '', html_content: '' }); fetchCampaigns(); }
  };

  const sendCampaign = async (campaign: Campaign) => {
    if (!campaign.list_id || !campaign.smtp_config_id) {
      toast.error('Campaign needs a list and SMTP config before sending');
      return;
    }
    const { error } = await supabase.functions.invoke('send-email-campaign', {
      body: { campaign_id: campaign.id },
    });
    if (error) toast.error('Failed to send campaign');
    else { toast.success('Campaign is being sent!'); fetchCampaigns(); }
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchCampaigns(); }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = { draft: 'secondary', sending: 'default', sent: 'default', scheduled: 'outline', failed: 'destructive', paused: 'outline' };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // If A/B test editor is open, show it fullscreen
  if (abTestCampaignId) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">A/B Test Configuration</h2>
        </div>
        <ABTestEditor campaignId={abTestCampaignId} onClose={() => { setAbTestCampaignId(null); fetchCampaigns(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Campaign</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Campaign Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Summer Newsletter" /></div>
              <div><Label>Subject Line</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Check out our latest updates!" /></div>
              <div>
                <Label>Send To (List)</Label>
                <Select value={form.list_id} onValueChange={v => setForm({ ...form, list_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a list" /></SelectTrigger>
                  <SelectContent>
                    {lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.subscriber_count})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SMTP Config</Label>
                <Select value={form.smtp_config_id} onValueChange={v => setForm({ ...form, smtp_config_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select SMTP" /></SelectTrigger>
                  <SelectContent>
                    {smtpConfigs.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.from_email})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Email Content (HTML)</Label><Textarea value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })} placeholder="<h1>Hello {{first_name}}</h1>" rows={6} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createCampaign}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No campaigns yet</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.subject || 'No subject'}</p>
                      </div>
                      {c.is_ab_test && <Badge variant="outline" className="text-[10px] gap-1"><FlaskConical className="h-3 w-3" />A/B</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>{c.total_sent}</TableCell>
                  <TableCell>{c.total_opens}</TableCell>
                  <TableCell>{c.total_clicks}</TableCell>
                  <TableCell>{format(new Date(c.created_at), 'MMM d')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.status === 'draft' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAbTestCampaignId(c.id)} title="A/B Test">
                            <FlaskConical className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendCampaign(c)} title="Send">
                            <Send className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCampaign(c.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
