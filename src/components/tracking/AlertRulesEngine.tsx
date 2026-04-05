import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Plus, Trash2, Webhook } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const metrics = [
  { value: 'error_rate', label: 'Error Rate (%)' },
  { value: 'event_volume', label: 'Event Volume' },
  { value: 'delivery_rate', label: 'Delivery Rate (%)' },
  { value: 'retry_count', label: 'Retry Count' },
  { value: 'latency_ms', label: 'Avg Latency (ms)' },
];

const operators = [
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: 'greater or equal' },
  { value: '<=', label: 'less or equal' },
  { value: '==', label: 'equals' },
];

export function AlertRulesEngine() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metric, setMetric] = useState('error_rate');
  const [operator, setOperator] = useState('>');
  const [threshold, setThreshold] = useState('5');
  const [channel, setChannel] = useState('email');
  const [webhookUrl, setWebhookUrl] = useState('');

  const { data: rules = [], refetch } = useQuery({
    queryKey: ['tracking-alert-rules', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_alert_rules' as any)
        .select('*')
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!profile?.id,
  });

  const createRule = async () => {
    if (!profile?.id) return;
    const { error } = await supabase.from('tracking_alert_rules' as any).insert({
      user_id: profile.id,
      metric,
      operator,
      threshold: parseFloat(threshold),
      channel,
      webhook_url: channel === 'webhook' ? webhookUrl : null,
    } as any);
    if (error) {
      toast.error('Failed to create rule');
    } else {
      toast.success('Alert rule created!');
      setDialogOpen(false);
      refetch();
    }
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from('tracking_alert_rules' as any).update({ enabled } as any).eq('id', id);
    refetch();
  };

  const deleteRule = async (id: string) => {
    await supabase.from('tracking_alert_rules' as any).delete().eq('id', id);
    toast.success('Rule deleted');
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Alert Rules Engine
            </CardTitle>
            <CardDescription>Configurable rules with email and webhook notifications</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No alert rules configured. Create one to get notified about issues.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule: any) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-sm font-medium">
                    {metrics.find(m => m.value === rule.metric)?.label || rule.metric}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rule.operator} {rule.threshold}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1 text-xs">
                      {rule.channel === 'webhook' ? <Webhook className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                      {rule.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={rule.enabled} onCheckedChange={(v) => toggleRule(rule.id, v)} />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Alert Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Metric</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {metrics.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Operator</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {operators.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Threshold</Label>
                <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notification Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {channel === 'webhook' && (
              <div>
                <Label>Webhook URL</Label>
                <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createRule}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
