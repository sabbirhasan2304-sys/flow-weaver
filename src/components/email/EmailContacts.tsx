import { useState, useEffect, useMemo } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Plus, Search, Upload, Trash2, Edit, UserPlus, FileSpreadsheet, Filter, X, Eye, Activity, Star, Layers } from 'lucide-react';
import { CsvImport } from './CsvImport';
import { ContactProfile } from './ContactProfile';
import { SegmentBuilder } from './SegmentBuilder';
import { format } from 'date-fns';

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

function getEngagementLevel(c: Contact) {
  const sent = c.total_emails_sent || 0;
  if (sent === 0) return 'New';
  const rate = ((c.total_opens || 0) / sent) * 0.6 + ((c.total_clicks || 0) / sent) * 0.4;
  const score = Math.min(100, Math.round(rate * 100));
  if (score >= 70) return 'Highly Engaged';
  if (score >= 40) return 'Engaged';
  if (score >= 15) return 'Low Engagement';
  return 'At Risk';
}

function getRFMSegment(c: Contact) {
  const now = Date.now();
  const lastEmail = c.last_emailed_at ? new Date(c.last_emailed_at).getTime() : 0;
  const days = lastEmail ? Math.floor((now - lastEmail) / 86400000) : 999;

  let r = 1;
  if (days <= 7) r = 5; else if (days <= 30) r = 4; else if (days <= 90) r = 3; else if (days <= 180) r = 2;

  const sent = c.total_emails_sent || 0;
  let f = 1;
  if (sent >= 20) f = 5; else if (sent >= 10) f = 4; else if (sent >= 5) f = 3; else if (sent >= 2) f = 2;

  const eng = (c.total_opens || 0) + (c.total_clicks || 0);
  let m = 1;
  if (eng >= 50) m = 5; else if (eng >= 20) m = 4; else if (eng >= 10) m = 3; else if (eng >= 3) m = 2;

  const total = r + f + m;
  if (total >= 13) return 'Champions';
  if (total >= 10) return 'Loyal';
  if (total >= 7) return 'Potential';
  if (total >= 4) return 'At Risk';
  return 'Hibernating';
}

const ENGAGEMENT_LEVELS = ['All', 'Highly Engaged', 'Engaged', 'Low Engagement', 'At Risk', 'New'];
const RFM_SEGMENTS = ['All', 'Champions', 'Loyal', 'Potential', 'At Risk', 'Hibernating'];
const STATUSES = ['All', 'subscribed', 'unsubscribed', 'bounced'];

const engagementBadgeColor = (level: string) => {
  switch (level) {
    case 'Highly Engaged': return 'bg-emerald-500/10 text-emerald-600';
    case 'Engaged': return 'bg-blue-500/10 text-blue-600';
    case 'Low Engagement': return 'bg-amber-500/10 text-amber-600';
    case 'At Risk': return 'bg-red-500/10 text-red-600';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function EmailContacts() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [profileContact, setProfileContact] = useState<Contact | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '', company: '' });
  const [showSegmentBuilder, setShowSegmentBuilder] = useState(false);
  const [segmentFilterIds, setSegmentFilterIds] = useState<string[] | null>(null);

  // Advanced filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterEngagement, setFilterEngagement] = useState('All');
  const [filterRFM, setFilterRFM] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [filterStatus, filterEngagement, filterRFM].filter(f => f !== 'All').length;

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
    else setContacts((data || []) as Contact[]);
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
        if (error.code === '23505') toast.error('Contact already exists');
        else toast.error('Failed to add contact');
      } else { toast.success('Contact added'); setDialogOpen(false); fetchContacts(); }
    }
    setForm({ email: '', first_name: '', last_name: '', phone: '', company: '' });
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('email_contacts').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchContacts(); }
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({ email: contact.email, first_name: contact.first_name || '', last_name: contact.last_name || '', phone: contact.phone || '', company: contact.company || '' });
    setDialogOpen(true);
  };

  const openProfile = (contact: Contact) => {
    setProfileContact(contact);
    setProfileOpen(true);
  };

  const clearFilters = () => {
    setFilterStatus('All');
    setFilterEngagement('All');
    setFilterRFM('All');
  };

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      // Segment filter
      if (segmentFilterIds && !segmentFilterIds.includes(c.id)) return false;

      // Search
      const q = search.toLowerCase();
      if (q && !c.email.toLowerCase().includes(q) && !c.first_name?.toLowerCase().includes(q) && !c.last_name?.toLowerCase().includes(q) && !c.company?.toLowerCase().includes(q)) return false;

      // Status
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;

      // Engagement
      if (filterEngagement !== 'All' && getEngagementLevel(c) !== filterEngagement) return false;

      // RFM
      if (filterRFM !== 'All' && getRFMSegment(c) !== filterRFM) return false;

      return true;
    });
  }, [contacts, search, filterStatus, filterEngagement, filterRFM, segmentFilterIds]);

  // Segment counts for summary
  const segmentCounts = useMemo(() => {
    const eng: Record<string, number> = {};
    const rfm: Record<string, number> = {};
    contacts.forEach(c => {
      const e = getEngagementLevel(c);
      eng[e] = (eng[e] || 0) + 1;
      const r = getRFMSegment(c);
      rfm[r] = (rfm[r] || 0) + 1;
    });
    return { eng, rfm };
  }, [contacts]);

  return (
    <div className="space-y-4 mt-4">
      {/* Segment summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['Highly Engaged', 'Engaged', 'Low Engagement', 'At Risk', 'New'].map(level => (
          <button
            key={level}
            onClick={() => setFilterEngagement(filterEngagement === level ? 'All' : level)}
            className={`p-3 rounded-lg border text-left transition-all ${filterEngagement === level ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
          >
            <p className="text-xs text-muted-foreground">{level}</p>
            <p className="text-lg font-bold">{segmentCounts.eng[level] || 0}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {/* Advanced filters */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />Filters
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Advanced Filters</p>
                  {activeFilterCount > 0 && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>Clear all</Button>}
                </div>

                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Engagement Level</Label>
                  <Select value={filterEngagement} onValueChange={setFilterEngagement}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENGAGEMENT_LEVELS.map(l => <SelectItem key={l} value={l}>{l === 'All' ? 'All Levels' : l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">RFM Segment</Label>
                  <Select value={filterRFM} onValueChange={setFilterRFM}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RFM_SEGMENTS.map(s => <SelectItem key={s} value={s}>{s === 'All' ? 'All Segments' : s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button
            variant={showSegmentBuilder ? 'secondary' : 'outline'}
            onClick={() => { setShowSegmentBuilder(!showSegmentBuilder); if (showSegmentBuilder) setSegmentFilterIds(null); }}
          >
            <Layers className="h-4 w-4 mr-2" />Segments
          </Button>
          <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Import Contacts from CSV</DialogTitle></DialogHeader>
              <CsvImport onComplete={() => { setCsvImportOpen(false); fetchContacts(); }} onCancel={() => setCsvImportOpen(false)} />
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

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filterStatus !== 'All' && <Badge variant="secondary" className="text-xs gap-1">Status: {filterStatus}<button onClick={() => setFilterStatus('All')}><X className="h-2.5 w-2.5" /></button></Badge>}
          {filterEngagement !== 'All' && <Badge variant="secondary" className="text-xs gap-1">Engagement: {filterEngagement}<button onClick={() => setFilterEngagement('All')}><X className="h-2.5 w-2.5" /></button></Badge>}
          {filterRFM !== 'All' && <Badge variant="secondary" className="text-xs gap-1">RFM: {filterRFM}<button onClick={() => setFilterRFM('All')}><X className="h-2.5 w-2.5" /></button></Badge>}
        </div>
      )}

      {/* Segment Builder */}
      {showSegmentBuilder && (
        <SegmentBuilder
          contacts={contacts}
          onApplySegment={(ids) => setSegmentFilterIds(ids)}
        />
      )}

      {/* Segment active indicator */}
      {segmentFilterIds && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1">
            <Layers className="h-2.5 w-2.5" />
            Segment active: {segmentFilterIds.length} contacts
            <button onClick={() => setSegmentFilterIds(null)}><X className="h-2.5 w-2.5" /></button>
          </Badge>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} of {contacts.length} contacts</p>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>RFM</TableHead>
                <TableHead>Opens/Clicks</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No contacts found</TableCell></TableRow>
              ) : filtered.map(contact => {
                const engagement = getEngagementLevel(contact);
                const rfm = getRFMSegment(contact);
                return (
                  <TableRow key={contact.id} className="cursor-pointer hover:bg-accent/50" onClick={() => openProfile(contact)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{contact.email}</p>
                        <p className="text-xs text-muted-foreground">{[contact.first_name, contact.last_name].filter(Boolean).join(' ')}{contact.company ? ` · ${contact.company}` : ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.status === 'subscribed' ? 'default' : contact.status === 'bounced' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${engagementBadgeColor(engagement)}`}>{engagement}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{rfm}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-muted-foreground">{contact.total_opens || 0} / {contact.total_clicks || 0}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(contact.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openProfile(contact)} title="View profile"><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(contact)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContact(contact.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contact Profile Sheet */}
      <ContactProfile contact={profileContact} open={profileOpen} onOpenChange={setProfileOpen} onUpdated={fetchContacts} />
    </div>
  );
}
