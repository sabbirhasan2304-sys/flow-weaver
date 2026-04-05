import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Database, Plus, Trash2, FileText, Search, Download, Upload, FolderOpen, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function NexusStore() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [createCollOpen, setCreateCollOpen] = useState(false);
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [collName, setCollName] = useState('');
  const [collDesc, setCollDesc] = useState('');
  const [collTtl, setCollTtl] = useState('');
  const [docData, setDocData] = useState('{\n  \n}');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: collections = [] } = useQuery({
    queryKey: ['nexus-collections', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from('nexus_store_collections').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['nexus-documents', selectedCollection?.id],
    queryFn: async () => {
      if (!selectedCollection?.id) return [];
      const { data } = await supabase.from('nexus_store_documents').select('*').eq('collection_id', selectedCollection.id).order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!selectedCollection?.id,
  });

  const createCollection = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('nexus_store_collections').insert({
        user_id: profile.id,
        name: collName,
        description: collDesc || null,
        default_ttl_seconds: collTtl ? parseInt(collTtl) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Collection created!');
      setCreateCollOpen(false);
      setCollName(''); setCollDesc(''); setCollTtl('');
      queryClient.invalidateQueries({ queryKey: ['nexus-collections'] });
    },
    onError: () => toast.error('Failed to create collection'),
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexus_store_collections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Collection deleted');
      setSelectedCollection(null);
      queryClient.invalidateQueries({ queryKey: ['nexus-collections'] });
    },
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !selectedCollection?.id) throw new Error('Missing context');
      let parsed: any;
      try { parsed = JSON.parse(docData); } catch { throw new Error('Invalid JSON'); }
      const ttl = selectedCollection.default_ttl_seconds
        ? new Date(Date.now() + selectedCollection.default_ttl_seconds * 1000).toISOString()
        : null;
      const { error } = await supabase.from('nexus_store_documents').insert({
        collection_id: selectedCollection.id,
        user_id: profile.id,
        data: parsed,
        ttl_expires_at: ttl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document created!');
      setCreateDocOpen(false);
      setDocData('{\n  \n}');
      queryClient.invalidateQueries({ queryKey: ['nexus-documents'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to create document'),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexus_store_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['nexus-documents'] });
    },
  });

  const exportDocuments = (format: 'json' | 'csv' = 'json') => {
    if (!documents.length) return;
    if (format === 'csv') {
      const allKeys = new Set<string>();
      documents.forEach((d: any) => Object.keys(d.data || {}).forEach(k => allKeys.add(k)));
      const keys = Array.from(allKeys);
      const csvRows = [keys.join(',')];
      documents.forEach((d: any) => {
        csvRows.push(keys.map(k => JSON.stringify((d.data as any)?.[k] ?? '')).join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${selectedCollection?.name || 'documents'}.csv`; a.click();
    } else {
      const blob = new Blob([JSON.stringify(documents.map((d: any) => d.data), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${selectedCollection?.name || 'documents'}.json`; a.click();
    }
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id || !selectedCollection?.id) return;
    const text = await file.text();
    let items: any[] = [];
    try {
      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { toast.error('CSV must have headers and at least one row'); return; }
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        items = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
          return obj;
        });
      } else {
        const parsed = JSON.parse(text);
        items = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch { toast.error('Failed to parse file'); return; }

    if (items.length === 0) { toast.error('No data found in file'); return; }
    if (items.length > 500) { toast.error('Max 500 documents per import'); return; }

    const ttl = selectedCollection.default_ttl_seconds
      ? new Date(Date.now() + selectedCollection.default_ttl_seconds * 1000).toISOString()
      : null;

    const rows = items.map(item => ({
      collection_id: selectedCollection.id,
      user_id: profile.id,
      data: item,
      ttl_expires_at: ttl,
    }));

    const { error } = await supabase.from('nexus_store_documents').insert(rows);
    if (error) toast.error('Import failed: ' + error.message);
    else {
      toast.success(`Imported ${items.length} documents!`);
      queryClient.invalidateQueries({ queryKey: ['nexus-documents'] });
    }
    e.target.value = '';
  };

  const filteredDocs = documents.filter((d: any) => {
    if (!searchQuery) return true;
    return JSON.stringify(d.data).toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Collection list view
  if (!selectedCollection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Collections</h3>
            <p className="text-sm text-muted-foreground">Manage your NoSQL document collections</p>
          </div>
          <Button size="sm" onClick={() => setCreateCollOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Collection
          </Button>
        </div>

        {collections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No collections yet. Create your first to start storing documents.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((c: any) => (
              <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedCollection(c)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.description || 'No description'}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteCollection.mutate(c.id); }}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  {c.default_ttl_seconds && (
                    <Badge variant="outline" className="mt-2 text-xs">TTL: {c.default_ttl_seconds}s</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Collection Dialog */}
        <Dialog open={createCollOpen} onOpenChange={setCreateCollOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Collection</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={collName} onChange={(e) => setCollName(e.target.value)} placeholder="products" /></div>
              <div><Label>Description</Label><Input value={collDesc} onChange={(e) => setCollDesc(e.target.value)} placeholder="Product catalog data" /></div>
              <div><Label>Default TTL (seconds, optional)</Label><Input type="number" value={collTtl} onChange={(e) => setCollTtl(e.target.value)} placeholder="86400" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateCollOpen(false)}>Cancel</Button>
              <Button onClick={() => createCollection.mutate()} disabled={!collName.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Document browser view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => setSelectedCollection(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{selectedCollection.name}</h3>
          <p className="text-xs text-muted-foreground">{filteredDocs.length} documents</p>
        </div>
        <div className="ml-auto flex gap-2">
          <label>
            <input type="file" accept=".json,.csv" className="hidden" onChange={handleBulkImport} />
            <Button size="sm" variant="outline" asChild><span><Upload className="h-4 w-4 mr-1" /> Import</span></Button>
          </label>
          <Button size="sm" variant="outline" onClick={() => exportDocuments('csv')} disabled={!documents.length}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportDocuments('json')} disabled={!documents.length}>
            <Download className="h-4 w-4 mr-1" /> JSON
          </Button>
          <Button size="sm" onClick={() => setCreateDocOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Document
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data Preview</TableHead>
                <TableHead className="hidden md:table-cell">TTL</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No documents found</TableCell></TableRow>
              ) : (
                filteredDocs.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-xs">{doc.id.slice(0, 8)}...</TableCell>
                    <TableCell className="max-w-[300px]">
                      <pre className="text-xs text-muted-foreground truncate">{JSON.stringify(doc.data).slice(0, 80)}</pre>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {doc.ttl_expires_at ? new Date(doc.ttl_expires_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteDocument.mutate(doc.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Document Dialog */}
      <Dialog open={createDocOpen} onOpenChange={setCreateDocOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <div>
            <Label>JSON Data</Label>
            <Textarea value={docData} onChange={(e) => setDocData(e.target.value)} className="font-mono text-sm h-[200px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDocOpen(false)}>Cancel</Button>
            <Button onClick={() => createDocument.mutate()}>Create Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
