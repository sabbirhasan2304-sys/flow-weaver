import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Upload, Trash2, Edit, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  source: string;
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
  created_at: string;
}

export function EmailContacts() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '', company: '' });
  const [importText, setImportText] = useState('');

  useEffect(() => {
    if (profile) fetchContacts();
  }, [profile]);

  const fetchContacts = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('email_contacts')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load contacts');
    else setContacts(data || []);
    setLoading(false);
  };

  const saveContact = async () => {
    if (!profile || !form.email) return;

    if (editingContact) {
      const { error } = await supabase
        .from('email_contacts')
        .update({ email: form.email, first_name: form.first_name || null, last_name: form.last_name || null, phone: form.phone || null, company: form.company || null })
        .eq('id', editingContact.id);
      if (error) toast.error('Failed to update contact');
      else { toast.success('Contact updated'); setDialogOpen(false); setEditingContact(null); fetchContacts(); }
    } else {
      const { error } = await supabase
        .from('email_contacts')
        .insert({ profile_id: profile.id, email: form.email, first_name: form.first_name || null, last_name: form.last_name || null, phone: form.phone || null, company: form.company || null });
      if (error) {
        if (error.code === '23505') toast.error('Contact with this email already exists');
        else toast.error('Failed to add contact');
      } else { toast.success('Contact added'); setDialogOpen(false); fetchContacts(); }
    }
    setForm({ email: '', first_name: '', last_name: '', phone: '', company: '' });
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('email_contacts').delete().eq('id', id);
    if (error) toast.error('Failed to delete contact');
    else { toast.success('Contact deleted'); fetchContacts(); }
  };

  const importContacts = async () => {
    if (!profile || !importText.trim()) return;
    const lines = importText.trim().split('\n');
    const contactsToInsert = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        profile_id: profile.id,
        email: parts[0],
        first_name: parts[1] || null,
        last_name: parts[2] || null,
      };
    }).filter(c => c.email && c.email.includes('@'));

    if (contactsToInsert.length === 0) { toast.error('No valid emails found'); return; }

    const { error } = await supabase.from('email_contacts').upsert(contactsToInsert, { onConflict: 'profile_id,email' });
    if (error) toast.error('Failed to import contacts');
    else { toast.success(`${contactsToInsert.length} contacts imported`); setImportDialogOpen(false); setImportText(''); fetchContacts(); }
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({ email: contact.email, first_name: contact.first_name || '', last_name: contact.last_name || '', phone: contact.phone || '', company: contact.company || '' });
    setDialogOpen(true);
  };

  const filtered = contacts.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'subscribed': return 'default';
      case 'unsubscribed': return 'secondary';
      case 'bounced': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Import Contacts</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Paste contacts (one per line): <code>email, first_name, last_name</code></p>
                <textarea
                  className="w-full h-40 p-3 text-sm border rounded-md bg-background"
                  placeholder={"john@example.com, John, Doe\njane@example.com, Jane, Smith"}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                <Button onClick={importContacts}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingContact(null); setForm({ email: '', first_name: '', last_name: '', phone: '', company: '' }); } }}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Add Contact</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Email *</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>First Name</Label><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
                  <div><Label>Last Name</Label><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Company</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveContact}>{editingContact ? 'Update' : 'Add'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No contacts found</TableCell></TableRow>
              ) : filtered.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.email}</TableCell>
                  <TableCell>{[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}</TableCell>
                  <TableCell><Badge variant={statusColor(contact.status) as any}>{contact.status}</Badge></TableCell>
                  <TableCell>{contact.total_emails_sent}</TableCell>
                  <TableCell>{contact.total_opens}</TableCell>
                  <TableCell>{format(new Date(contact.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(contact)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContact(contact.id)}><Trash2 className="h-3 w-3" /></Button>
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
