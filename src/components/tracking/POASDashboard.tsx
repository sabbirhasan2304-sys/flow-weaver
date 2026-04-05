import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Upload, DollarSign, TrendingUp, TrendingDown, Plus, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const mockProfitData = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  const revenue = Math.floor(Math.random() * 5000) + 2000;
  const cost = Math.floor(revenue * (0.3 + Math.random() * 0.3));
  return {
    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
    revenue,
    cost,
    profit: revenue - cost,
    roas: +(revenue / (cost * 0.4)).toFixed(2),
    poas: +((revenue - cost) / (cost * 0.4)).toFixed(2),
  };
});

export function POASDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newSell, setNewSell] = useState('');

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ['product-feeds', profile?.id],
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
    const lines = csvInput.trim().split('\n').slice(1); // skip header
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

  const totalRevenue = mockProfitData.reduce((s, d) => s + d.revenue, 0);
  const totalCost = mockProfitData.reduce((s, d) => s + d.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgRoas = +(totalRevenue / (totalCost * 0.4)).toFixed(2);
  const avgPoas = +(totalProfit / (totalCost * 0.4)).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
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
                <p className="text-xl font-bold text-foreground">${totalProfit.toLocaleString()}</p>
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
                <p className="text-xl font-bold text-foreground">{avgRoas}x</p>
                <p className="text-xs text-muted-foreground">Avg ROAS</p>
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
                <p className="text-xl font-bold text-foreground">{avgPoas}x</p>
                <p className="text-xs text-muted-foreground">Avg POAS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROAS vs POAS Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ROAS vs POAS Comparison</CardTitle>
          <CardDescription>Revenue-based vs Profit-based return on ad spend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockProfitData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
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

      {/* Profit Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profit Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockProfitData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
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

      {/* Product Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Product Feed</CardTitle>
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
