import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, LayoutTemplate, Trash2, Copy } from 'lucide-react';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  subject: string | null;
  category: string;
  html_content: string | null;
  created_at: string;
  updated_at: string;
}

export function EmailTemplates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', category: 'custom', html_content: '' });

  useEffect(() => {
    if (profile) fetchTemplates();
  }, [profile]);

  const fetchTemplates = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase.from('email_templates').select('*').eq('profile_id', profile.id).order('updated_at', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  };

  const createTemplate = async () => {
    if (!profile || !form.name) return;
    const { error } = await supabase.from('email_templates').insert({
      profile_id: profile.id, name: form.name, subject: form.subject || null,
      category: form.category, html_content: form.html_content || null,
    });
    if (error) toast.error('Failed to create template');
    else { toast.success('Template created'); setDialogOpen(false); setForm({ name: '', subject: '', category: 'custom', html_content: '' }); fetchTemplates(); }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('email_templates').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchTemplates(); }
  };

  const duplicateTemplate = async (template: Template) => {
    if (!profile) return;
    const { error } = await supabase.from('email_templates').insert({
      profile_id: profile.id, name: `${template.name} (Copy)`, subject: template.subject,
      category: template.category, html_content: template.html_content,
    });
    if (error) toast.error('Failed to duplicate');
    else { toast.success('Duplicated'); fetchTemplates(); }
  };

  const categoryColors: Record<string, string> = {
    custom: 'bg-blue-500/10 text-blue-500',
    marketing: 'bg-purple-500/10 text-purple-500',
    transactional: 'bg-green-500/10 text-green-500',
    welcome: 'bg-orange-500/10 text-orange-500',
    cart: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Create reusable email templates</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Template</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Welcome Email" /></div>
              <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Welcome to {{company}}" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="cart">Cart Recovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>HTML Content</Label><Textarea value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })} rows={8} placeholder="<h1>Welcome!</h1>" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createTemplate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : templates.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No templates yet</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{t.name}</CardTitle>
                    <CardDescription>{t.subject || 'No subject'}</CardDescription>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[t.category] || categoryColors.custom}`}>{t.category}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Updated {format(new Date(t.updated_at), 'MMM d, yyyy')}</p>
                <div className="flex gap-1 mt-3">
                  <Button variant="ghost" size="sm" onClick={() => duplicateTemplate(t)}><Copy className="h-3 w-3 mr-1" />Copy</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTemplate(t.id)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
