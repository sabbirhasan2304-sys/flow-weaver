import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Bell, Plus, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const mockHealthData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  success: 0,
  failed: 0,
}));

export function MonitoringDashboard() {
  const { profile } = useAuth();
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertMetric, setAlertMetric] = useState('error_rate');
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [alertEmail, setAlertEmail] = useState('');

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ['tracking-alerts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const createAlert = async () => {
    if (!profile?.id || !alertName.trim()) return;
    const { error } = await supabase.from('tracking_alerts').insert({
      user_id: profile.id,
      name: alertName,
      condition: { metric: alertMetric, operator: 'gt', threshold: parseFloat(alertThreshold) } as any,
      notify_email: alertEmail || profile.email,
    });
    if (error) {
      toast.error('Failed to create alert');
    } else {
      toast.success('Alert created!');
      setAlertDialogOpen(false);
      setAlertName('');
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Failed Events (24h)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Events Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Health Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Health (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHealthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="rgba(239,68,68,0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Alert Rules</CardTitle>
            <Button size="sm" onClick={() => setAlertDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No alert rules yet. Create one to get notified about anomalies.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(alert.condition as any)?.metric} &gt; {(alert.condition as any)?.threshold}%
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                    {alert.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alert Name</Label>
              <Input value={alertName} onChange={(e) => setAlertName(e.target.value)} placeholder="e.g., High Error Rate" />
            </div>
            <div>
              <Label>Metric</Label>
              <Select value={alertMetric} onValueChange={setAlertMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="error_rate">Error Rate (%)</SelectItem>
                  <SelectItem value="event_drop">Event Drop (%)</SelectItem>
                  <SelectItem value="latency">Latency (ms)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Threshold</Label>
              <Input type="number" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} />
            </div>
            <div>
              <Label>Notification Email</Label>
              <Input value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="your@email.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
            <Button onClick={createAlert}>Create Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
