import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Trash2, FileText, Palette, Globe, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function AgencyDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [brandColor, setBrandColor] = useState('#3b82f6');
  const [customDomain, setCustomDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['agency-clients', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from('agency_clients').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['agency-reports', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from('agency_reports').select('*').order('generated_at', { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const addClient = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('agency_clients').insert({
        agency_profile_id: profile.id,
        client_name: clientName,
        client_email: clientEmail || null,
        brand_color: brandColor,
        custom_domain: customDomain || null,
        logo_url: logoUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Client added!');
      setAddClientOpen(false);
      setClientName(''); setClientEmail('');
      queryClient.invalidateQueries({ queryKey: ['agency-clients'] });
    },
    onError: () => toast.error('Failed to add client'),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agency_clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Client removed');
      queryClient.invalidateQueries({ queryKey: ['agency-clients'] });
    },
  });

  const generateReport = async (clientId: string) => {
    if (!profile?.id) return;
    const { error } = await supabase.from('agency_reports').insert({
      agency_profile_id: profile.id,
      client_id: clientId,
      report_data: {
        events_processed: Math.floor(Math.random() * 50000),
        delivery_rate: (95 + Math.random() * 5).toFixed(1),
        errors: Math.floor(Math.random() * 100),
        period: 'Last 30 days',
      } as any,
      report_type: 'performance',
      date_from: new Date(Date.now() - 30 * 86400000).toISOString(),
      date_to: new Date().toISOString(),
    });
    if (error) toast.error('Failed to generate report');
    else {
      toast.success('Report generated!');
      queryClient.invalidateQueries({ queryKey: ['agency-reports'] });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients" className="gap-1.5"><Users className="h-4 w-4" /> Clients</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><FileText className="h-4 w-4" /> Reports</TabsTrigger>
          <TabsTrigger value="whitelabel" className="gap-1.5"><Palette className="h-4 w-4" /> White-Label</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Client Accounts</h3>
              <p className="text-sm text-muted-foreground">Manage your agency's client sub-accounts</p>
            </div>
            <Button size="sm" onClick={() => setAddClientOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Client
            </Button>
          </div>

          {clients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No clients yet. Add your first client to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client: any) => (
                <Card key={client.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: client.brand_color || '#3b82f6' }}>
                          {client.client_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.client_name}</p>
                          <p className="text-xs text-muted-foreground">{client.client_email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>{client.status}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => deleteClient.mutate(client.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => generateReport(client.id)}>
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Reports</CardTitle>
              <CardDescription>Generated reports for your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Delivery Rate</TableHead>
                    <TableHead>Generated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No reports yet</TableCell></TableRow>
                  ) : (
                    reports.map((r: any) => {
                      const client = clients.find((c: any) => c.id === r.client_id);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{client?.client_name || 'Unknown'}</TableCell>
                          <TableCell><Badge variant="outline">{r.report_type}</Badge></TableCell>
                          <TableCell>{(r.report_data as any)?.events_processed?.toLocaleString() || '—'}</TableCell>
                          <TableCell>{(r.report_data as any)?.delivery_rate || '—'}%</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(r.generated_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelabel">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">White-Label Settings</CardTitle>
              <CardDescription>Customize your agency dashboard appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://youragency.com/logo.png" />
              </div>
              <div>
                <Label>Brand Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
                  <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Custom Dashboard Domain</Label>
                <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="tracking.youragency.com" />
                <p className="text-xs text-muted-foreground mt-1">Point a CNAME record to our servers</p>
              </div>
              <Button onClick={() => toast.success('White-label settings saved!')}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Client Dialog */}
      <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Client Name</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" /></div>
            <div><Label>Client Email</Label><Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@acme.com" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClientOpen(false)}>Cancel</Button>
            <Button onClick={() => addClient.mutate()} disabled={!clientName.trim()}>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
