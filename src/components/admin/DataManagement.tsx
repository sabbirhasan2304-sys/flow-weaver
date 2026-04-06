import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Database, Zap, Activity, Mail, Shield, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface DataCategory {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  table: string;
  color: string;
  count: number;
}

export function DataManagement() {
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; category: DataCategory | null }>({ open: false, category: null });
  const [confirmText, setConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);

  const { data: counts, refetch } = useQuery({
    queryKey: ['admin-data-counts'],
    queryFn: async () => {
      const [
        { count: executions },
        { count: errorLogs },
        { count: trackingEvents },
        { count: emailLogs },
        { count: apiLogs },
        { count: creditTx },
      ] = await Promise.all([
        supabase.from('executions').select('*', { count: 'exact', head: true }),
        supabase.from('error_logs').select('*', { count: 'exact', head: true }),
        supabase.from('tracking_events').select('*', { count: 'exact', head: true }),
        supabase.from('email_send_log').select('*', { count: 'exact', head: true }),
        supabase.from('api_usage_logs').select('*', { count: 'exact', head: true }),
        supabase.from('credit_transactions').select('*', { count: 'exact', head: true }),
      ]);
      return {
        executions: executions || 0,
        errorLogs: errorLogs || 0,
        trackingEvents: trackingEvents || 0,
        emailLogs: emailLogs || 0,
        apiLogs: apiLogs || 0,
        creditTx: creditTx || 0,
      };
    },
  });

  const categories: DataCategory[] = [
    { key: 'executions', label: 'Workflow Executions', description: 'Clear all workflow execution history and logs', icon: Zap, table: 'executions', color: 'text-amber-500 bg-amber-500/10', count: counts?.executions || 0 },
    { key: 'error_logs', label: 'Error / Crash Logs', description: 'Clear all application error reports', icon: AlertTriangle, table: 'error_logs', color: 'text-rose-500 bg-rose-500/10', count: counts?.errorLogs || 0 },
    { key: 'tracking_events', label: 'Tracking Events', description: 'Clear all server-side tracking event data', icon: Activity, table: 'tracking_events', color: 'text-blue-500 bg-blue-500/10', count: counts?.trackingEvents || 0 },
    { key: 'email_send_log', label: 'Email Send Logs', description: 'Clear all email delivery logs and history', icon: Mail, table: 'email_send_log', color: 'text-emerald-500 bg-emerald-500/10', count: counts?.emailLogs || 0 },
    { key: 'api_usage_logs', label: 'API Usage Logs', description: 'Clear all API request/response logs', icon: Database, table: 'api_usage_logs', color: 'text-violet-500 bg-violet-500/10', count: counts?.apiLogs || 0 },
    { key: 'credit_transactions', label: 'Credit Transactions', description: 'Clear credit usage transaction history', icon: Shield, table: 'credit_transactions', color: 'text-cyan-500 bg-cyan-500/10', count: counts?.creditTx || 0 },
  ];

  const handleClear = async () => {
    if (!confirmDialog.category || confirmText !== 'DELETE') return;
    setClearing(true);
    try {
      const { error } = await supabase
        .from(confirmDialog.category.table as any)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

      if (error) throw error;
      toast.success(`${confirmDialog.category.label} cleared successfully`);
      refetch();
    } catch (err: any) {
      toast.error(`Failed to clear: ${err.message}`);
    } finally {
      setClearing(false);
      setConfirmDialog({ open: false, category: null });
      setConfirmText('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Management
              </CardTitle>
              <CardDescription>Clear logs and historical data to free up database space</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Counts
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${cat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {cat.count.toLocaleString()} rows
                    </Badge>
                  </div>
                  <h4 className="text-sm font-medium text-foreground mb-1">{cat.label}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    disabled={cat.count === 0}
                    onClick={() => setConfirmDialog({ open: true, category: cat })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {cat.count === 0 ? 'No Data' : `Clear ${cat.count.toLocaleString()} Records`}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-foreground">Warning</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Clearing data is <strong>permanent and irreversible</strong>. This cannot be undone. 
                  Charts and analytics will reset. Consider exporting data before clearing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => { setConfirmDialog({ open, category: open ? confirmDialog.category : null }); setConfirmText(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Data Deletion
            </DialogTitle>
            <DialogDescription>
              You are about to permanently delete <strong>{confirmDialog.category?.count.toLocaleString()}</strong> records 
              from <strong>{confirmDialog.category?.label}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Type <strong>DELETE</strong> to confirm:</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmDialog({ open: false, category: null }); setConfirmText(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'DELETE' || clearing}
              onClick={handleClear}
            >
              {clearing ? 'Clearing...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
