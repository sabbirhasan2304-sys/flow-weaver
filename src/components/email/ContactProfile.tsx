import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  User, Mail, Phone, Building2, Calendar, MousePointerClick,
  Eye, Send, Tag, TrendingUp, Activity, Star, Save,
} from 'lucide-react';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  source: string | null;
  total_emails_sent: number | null;
  total_opens: number | null;
  total_clicks: number | null;
  last_emailed_at: string | null;
  created_at: string;
  custom_fields: Record<string, any> | null;
}

interface ContactProfileProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

function computeEngagement(contact: Contact) {
  const sent = contact.total_emails_sent || 0;
  const opens = contact.total_opens || 0;
  const clicks = contact.total_clicks || 0;

  if (sent === 0) return { level: 'New', score: 0, color: 'bg-muted text-muted-foreground' };

  const openRate = opens / sent;
  const clickRate = clicks / sent;
  const score = Math.min(100, Math.round((openRate * 60 + clickRate * 40) * 100));

  if (score >= 70) return { level: 'Highly Engaged', score, color: 'bg-emerald-500/10 text-emerald-600' };
  if (score >= 40) return { level: 'Engaged', score, color: 'bg-blue-500/10 text-blue-600' };
  if (score >= 15) return { level: 'Low Engagement', score, color: 'bg-amber-500/10 text-amber-600' };
  return { level: 'At Risk', score, color: 'bg-red-500/10 text-red-600' };
}

function computeRFM(contact: Contact) {
  const now = Date.now();
  const lastEmail = contact.last_emailed_at ? new Date(contact.last_emailed_at).getTime() : 0;
  const daysSinceLast = lastEmail ? Math.floor((now - lastEmail) / (1000 * 60 * 60 * 24)) : 999;

  // Recency (1-5)
  let recency = 1;
  if (daysSinceLast <= 7) recency = 5;
  else if (daysSinceLast <= 30) recency = 4;
  else if (daysSinceLast <= 90) recency = 3;
  else if (daysSinceLast <= 180) recency = 2;

  // Frequency (1-5) based on emails sent
  const sent = contact.total_emails_sent || 0;
  let frequency = 1;
  if (sent >= 20) frequency = 5;
  else if (sent >= 10) frequency = 4;
  else if (sent >= 5) frequency = 3;
  else if (sent >= 2) frequency = 2;

  // Monetary/Engagement (1-5) based on opens+clicks
  const engagement = (contact.total_opens || 0) + (contact.total_clicks || 0);
  let monetary = 1;
  if (engagement >= 50) monetary = 5;
  else if (engagement >= 20) monetary = 4;
  else if (engagement >= 10) monetary = 3;
  else if (engagement >= 3) monetary = 2;

  const total = recency + frequency + monetary;
  let segment = 'Hibernating';
  if (total >= 13) segment = 'Champions';
  else if (total >= 10) segment = 'Loyal';
  else if (total >= 7) segment = 'Potential';
  else if (total >= 4) segment = 'At Risk';

  return { recency, frequency, monetary, total, segment };
}

export function ContactProfile({ contact, open, onOpenChange, onUpdated }: ContactProfileProps) {
  const { profile } = useAuth();
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [newTag, setNewTag] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  useEffect(() => {
    if (contact && open) {
      fetchTags();
      setCustomFields((contact.custom_fields as Record<string, string>) || {});
    }
  }, [contact, open]);

  const fetchTags = async () => {
    if (!contact) return;
    const { data } = await supabase
      .from('email_contact_tags')
      .select('tag_id, email_tags(id, name, color)')
      .eq('contact_id', contact.id);
    if (data) {
      setTags(data.map((d: any) => d.email_tags).filter(Boolean));
    }
  };

  const addTag = async () => {
    if (!profile || !contact || !newTag.trim()) return;
    // Create or find tag
    let tagId: string;
    const { data: existing } = await supabase
      .from('email_tags')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('name', newTag.trim())
      .maybeSingle();

    if (existing) {
      tagId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('email_tags')
        .insert({ profile_id: profile.id, name: newTag.trim() })
        .select('id')
        .single();
      if (error || !created) { toast.error('Failed to create tag'); return; }
      tagId = created.id;
    }

    const { error } = await supabase
      .from('email_contact_tags')
      .insert({ contact_id: contact.id, tag_id: tagId });
    if (error && error.code !== '23505') toast.error('Failed to add tag');
    else { setNewTag(''); fetchTags(); }
  };

  const saveCustomFields = async () => {
    if (!contact) return;
    const fields = { ...customFields };
    if (newFieldKey.trim() && newFieldValue.trim()) {
      fields[newFieldKey.trim()] = newFieldValue.trim();
      setNewFieldKey('');
      setNewFieldValue('');
    }
    const { error } = await supabase
      .from('email_contacts')
      .update({ custom_fields: fields })
      .eq('id', contact.id);
    if (error) toast.error('Failed to save');
    else { toast.success('Saved'); setCustomFields(fields); onUpdated(); }
  };

  if (!contact) return null;

  const engagement = computeEngagement(contact);
  const rfm = computeRFM(contact);
  const openRate = (contact.total_emails_sent || 0) > 0
    ? Math.round(((contact.total_opens || 0) / (contact.total_emails_sent || 1)) * 100) : 0;
  const clickRate = (contact.total_emails_sent || 0) > 0
    ? Math.round(((contact.total_clicks || 0) / (contact.total_emails_sent || 1)) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg">{[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email}</p>
              <p className="text-sm font-normal text-muted-foreground">{contact.email}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs">Engagement</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-3">
            {/* Status & Engagement */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={contact.status === 'subscribed' ? 'default' : 'secondary'}>{contact.status}</Badge>
              <Badge className={engagement.color}>{engagement.level}</Badge>
              <Badge variant="outline">RFM: {rfm.segment}</Badge>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Send className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{contact.total_emails_sent || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{openRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Open Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <MousePointerClick className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{clickRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Click Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact info */}
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{contact.email}</div>
                {contact.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{contact.phone}</div>}
                {contact.company && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{contact.company}</div>}
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Added {format(new Date(contact.created_at), 'MMM d, yyyy')}</div>
                {contact.source && <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />Source: {contact.source}</div>}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Tag className="h-3.5 w-3.5" />Tags</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-muted-foreground">No tags</p>}
                </div>
                <div className="flex gap-2">
                  <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag..." className="h-7 text-xs" onKeyDown={e => e.key === 'Enter' && addTag()} />
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addTag}>Add</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4 mt-3">
            {/* Engagement Score */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Activity className="h-3.5 w-3.5" />Engagement Score</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{engagement.score}</span>
                  <Badge className={engagement.color}>{engagement.level}</Badge>
                </div>
                <Progress value={engagement.score} className="h-2" />
              </CardContent>
            </Card>

            {/* RFM Analysis */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Star className="h-3.5 w-3.5" />RFM Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className="mb-2">{rfm.segment}</Badge>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Recency</span><span>{rfm.recency}/5</span></div>
                    <Progress value={rfm.recency * 20} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Frequency</span><span>{rfm.frequency}/5</span></div>
                    <Progress value={rfm.frequency * 20} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Engagement</span><span>{rfm.monetary}/5</span></div>
                    <Progress value={rfm.monetary * 20} className="h-1.5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Total RFM Score: {rfm.total}/15</p>
              </CardContent>
            </Card>

            {/* Activity timeline placeholder */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {contact.last_emailed_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Last emailed: {format(new Date(contact.last_emailed_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Total opens: {contact.total_opens || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Total clicks: {contact.total_clicks || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-3">
            {/* Custom Fields */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Custom Fields</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(customFields).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-2">
                    <Input value={key} disabled className="h-7 text-xs bg-muted" />
                    <Input value={value} onChange={e => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))} className="h-7 text-xs" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <Input value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)} placeholder="Field name" className="h-7 text-xs" />
                  <Input value={newFieldValue} onChange={e => setNewFieldValue(e.target.value)} placeholder="Value" className="h-7 text-xs" />
                </div>
                <Button size="sm" className="w-full text-xs" onClick={saveCustomFields}>
                  <Save className="h-3 w-3 mr-1" />Save Fields
                </Button>
              </CardContent>
            </Card>

            {/* Merge Tags Reference */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Merge Tags</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p><code className="bg-muted px-1 rounded">{'{{first_name}}'}</code> → {contact.first_name || '—'}</p>
                <p><code className="bg-muted px-1 rounded">{'{{last_name}}'}</code> → {contact.last_name || '—'}</p>
                <p><code className="bg-muted px-1 rounded">{'{{email}}'}</code> → {contact.email}</p>
                <p><code className="bg-muted px-1 rounded">{'{{company}}'}</code> → {contact.company || '—'}</p>
                {Object.entries(customFields).map(([k, v]) => (
                  <p key={k}><code className="bg-muted px-1 rounded">{`{{${k}}}`}</code> → {v}</p>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
