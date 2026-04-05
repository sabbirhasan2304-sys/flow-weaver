import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Upload, DollarSign, TrendingUp, TrendingDown, Plus, Trash2, FileText, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function POASDashboard() {
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newSell, setNewSell] = useState('');

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ['product-feeds', profile?.id, isAdmin],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_product_feeds')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Compute real POAS metrics from product feed
  const metrics = useMemo(() => {
    if (feeds.length === 0) return { totalRevenue: 0, totalCost: 0, totalProfit: 0, avgRoas: 0, avgPoas: 0 };
    const totalRevenue = feeds.reduce((s: number, f: any) => s + Number(f.sell_price || 0), 0);
    const totalCost = feeds.reduce((s: number, f: any) => s + Number(f.cost_price || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgRoas = totalCost > 0 ? +(totalRevenue / totalCost).toFixed(2) : 0;
    const avgPoas = totalCost > 0 ? +(totalProfit / totalCost).toFixed(2) : 0;
    return { totalRevenue, totalCost, totalProfit, avgRoas, avgPoas };
  }, [feeds]);

  // Build per-product chart data from real feeds
  const chartData = useMemo(() => {
    return feeds.slice(0, 10).map((f: any) => ({
      name: f.product_name || f.sku,
      revenue: Number(f.sell_price || 0),
      cost: Number(f.cost_price || 0),
      profit: Number(f.sell_price || 0) - Number(f.cost_price || 0),
      roas: Number(f.cost_price) > 0 ? +(Number(f.sell_price) / Number(f.cost_price)).toFixed(2) : 0,
      poas: Number(f.cost_price) > 0 ? +((Number(f.sell_price) - Number(f.cost_price)) / Number(f.cost_price)).toFixed(2) : 0,
    }));
  }, [feeds]);

  const addFeed = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('tracking_product_feeds').insert({
        user_id: profile.id,
        sku: newSku,
        product_name: newName,
        cost_price: parseFloat(newCost),
        sell_price: parseFloat(newSell),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Product added!');
      setAddDialogOpen(false);
      setNewSku(''); setNewName(''); setNewCost(''); setNewSell('');
      queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
    },
    onError: () => toast.error('Failed to add product'),
  });

  const deleteFeed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tracking_product_feeds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Product removed');
      queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
    },
  });

  const importCSV = () => {
    if (!profile?.id || !csvInput.trim()) return;
    const lines = csvInput.trim().split('\n').slice(1);
    const items = lines.map(line => {
      const [sku, name, cost, sell] = line.split(',').map(s => s.trim());
      return { user_id: profile.id, sku, product_name: name, cost_price: parseFloat(cost) || 0, sell_price: parseFloat(sell) || 0 };
    }).filter(i => i.sku);
    if (items.length === 0) { toast.error('No valid rows found'); return; }
    supabase.from('tracking_product_feeds').insert(items).then(({ error }) => {
      if (error) toast.error('Import failed');
      else {
        toast.success(`Imported ${items.length} products`);
        setCsvInput('');
        queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
      }
    });
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">👑 Admin Mode — Viewing all users' product feeds</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">${metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">${metrics.totalProfit.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{metrics.avgRoas}x</p>
                <p className="text-xs text-muted-foreground">ROAS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{metrics.avgPoas}x</p>
                <p className="text-xs text-muted-foreground">POAS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts from real data */}
      {chartData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ROAS vs POAS by Product</CardTitle>
              <CardDescription>Calculated from your product feed data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="roas" name="ROAS" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="poas" name="POAS" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Revenue vs Cost vs Profit</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="cost" name="Cost" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {chartData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Add products to your feed to see ROAS/POAS charts with real data.</p>
          </CardContent>
        </Card>
      )}

      {/* Product Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Product Feed ({feeds.length})</CardTitle>
              <CardDescription>Upload your product costs to calculate POAS</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCsvInput('sku,name,cost,sell\n')}>
                <Upload className="h-4 w-4 mr-1" /> CSV Import
              </Button>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {csvInput !== '' && (
            <div className="mb-4 space-y-2">
              <Label>Paste CSV (sku, name, cost, sell)</Label>
              <textarea
                className="w-full h-24 p-2 border rounded-md bg-background text-foreground text-sm font-mono"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="sku,name,cost,sell&#10;SKU001,Widget,5.00,15.00"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={importCSV}>Import</Button>
                <Button size="sm" variant="outline" onClick={() => setCsvInput('')}>Cancel</Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : feeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No products yet. Add products or import a CSV to calculate POAS.
                  </TableCell>
                </TableRow>
              ) : (
                feeds.map((f: any) => {
                  const margin = f.sell_price > 0 ? (((f.sell_price - f.cost_price) / f.sell_price) * 100).toFixed(1) : '0';
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.sku}</TableCell>
                      <TableCell>{f.product_name || '—'}</TableCell>
                      <TableCell>${Number(f.cost_price).toFixed(2)}</TableCell>
                      <TableCell>${Number(f.sell_price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={Number(margin) > 50 ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}>
                          {margin}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => deleteFeed.mutate(f.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>SKU</Label><Input value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="SKU001" /></div>
            <div><Label>Product Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Widget Pro" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cost Price</Label><Input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="5.00" /></div>
              <div><Label>Sell Price</Label><Input type="number" value={newSell} onChange={(e) => setNewSell(e.target.value)} placeholder="15.00" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => addFeed.mutate()} disabled={!newSku || !newCost || !newSell}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
