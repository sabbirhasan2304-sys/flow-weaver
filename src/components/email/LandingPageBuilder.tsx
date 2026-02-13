import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileText, Plus, Eye, Copy, Trash2, ExternalLink, Edit, BarChart3, Users, MousePointerClick, Globe } from 'lucide-react';

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  template: string;
  views: number;
  submissions: number;
  conversionRate: number;
  createdAt: string;
}

const TEMPLATES = [
  { id: 'lead-capture', name: 'Lead Capture', description: 'Simple form to collect email addresses', preview: '📧' },
  { id: 'webinar', name: 'Webinar Registration', description: 'Event signup with countdown timer', preview: '🎥' },
  { id: 'ebook', name: 'eBook Download', description: 'Content gate for downloadable resources', preview: '📚' },
  { id: 'product-launch', name: 'Product Launch', description: 'Pre-launch signup with social proof', preview: '🚀' },
  { id: 'waitlist', name: 'Waitlist', description: 'Collect interest with position counter', preview: '📋' },
  { id: 'contest', name: 'Contest / Giveaway', description: 'Viral contest entry with referral tracking', preview: '🎁' },
];

const MOCK_PAGES: LandingPage[] = [
  { id: '1', name: 'Summer Sale Signup', slug: 'summer-sale', status: 'published', template: 'lead-capture', views: 3420, submissions: 456, conversionRate: 13.3, createdAt: '2026-02-05' },
  { id: '2', name: 'Webinar: Growth Hacking', slug: 'webinar-growth', status: 'published', template: 'webinar', views: 1890, submissions: 234, conversionRate: 12.4, createdAt: '2026-02-08' },
  { id: '3', name: 'Free eBook Download', slug: 'ebook-guide', status: 'draft', template: 'ebook', views: 0, submissions: 0, conversionRate: 0, createdAt: '2026-02-12' },
];

export function LandingPageBuilder() {
  const [pages, setPages] = useState<LandingPage[]>(MOCK_PAGES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', template: '' });

  const totalViews = pages.reduce((s, p) => s + p.views, 0);
  const totalSubmissions = pages.reduce((s, p) => s + p.submissions, 0);
  const avgConversion = totalViews > 0 ? ((totalSubmissions / totalViews) * 100).toFixed(1) : '0';

  const createPage = () => {
    if (!form.name || !form.template) { toast.error('Fill in all fields'); return; }
    const newPage: LandingPage = {
      id: `page_${Date.now()}`,
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      status: 'draft',
      template: form.template,
      views: 0, submissions: 0, conversionRate: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPages(prev => [newPage, ...prev]);
    setDialogOpen(false);
    setForm({ name: '', slug: '', template: '' });
    toast.success('Landing page created');
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Landing Pages
          </h2>
          <p className="text-sm text-muted-foreground">Create high-converting landing pages for lead capture</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Page</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Landing Page</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Page Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Summer Sale Signup" /></div>
                <div><Label>URL Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="summer-sale" /></div>
              </div>
              <div>
                <Label>Choose Template</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {TEMPLATES.map(t => (
                    <Card key={t.id} className={`cursor-pointer transition-all hover:border-primary/50 ${form.template === t.id ? 'ring-2 ring-primary border-primary' : ''}`}
                      onClick={() => setForm({...form, template: t.id})}>
                      <CardContent className="pt-4 pb-3 text-center">
                        <span className="text-3xl">{t.preview}</span>
                        <p className="text-xs font-medium mt-2">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createPage}>Create Page</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />Total Pages</p>
          <p className="text-2xl font-bold mt-1">{pages.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />Total Views</p>
          <p className="text-2xl font-bold mt-1">{totalViews.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Submissions</p>
          <p className="text-2xl font-bold mt-1">{totalSubmissions.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><MousePointerClick className="h-3 w-3" />Avg Conversion</p>
          <p className="text-2xl font-bold mt-1">{avgConversion}%</p>
        </CardContent></Card>
      </div>

      {/* Pages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Conv. Rate</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'published' ? 'default' : p.status === 'draft' ? 'secondary' : 'outline'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{p.template.replace('-', ' ')}</TableCell>
                  <TableCell>{p.views.toLocaleString()}</TableCell>
                  <TableCell>{p.submissions.toLocaleString()}</TableCell>
                  <TableCell>{p.conversionRate}%</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3 w-3" /></Button>
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
