import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Zap, Play, Pause, Trash2, Edit, Users, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { AutomationJourneyBuilder } from './AutomationJourneyBuilder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: any;
  status: string;
  stats: any;
  created_at: string;
  updated_at: string;
}

const TRIGGER_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  welcome: { label: 'Welcome', color: 'bg-green-500/10 text-green-600', icon: Users },
  abandoned_cart: { label: 'Abandoned Cart', color: 'bg-orange-500/10 text-orange-600', icon: Clock },
  date_based: { label: 'Date Based', color: 'bg-blue-500/10 text-blue-600', icon: Clock },
  tag_added: { label: 'Tag Added', color: 'bg-purple-500/10 text-purple-600', icon: Zap },
  list_joined: { label: 'List Joined', color: 'bg-cyan-500/10 text-cyan-600', icon: Users },
  manual: { label: 'Manual', color: 'bg-muted text-muted-foreground', icon: Zap },
};

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'destructive' },
};

export function AutomationList() {
  const { profile } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) fetchAutomations();
  }, [profile]);

  const fetchAutomations = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('email_automations')
      .select('*')
      .eq('profile_id', profile.id)
      .order('updated_at', { ascending: false });
    setAutomations((data as Automation[]) || []);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingId(null);
    setBuilderOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setBuilderOpen(true);
  };

  const toggleStatus = async (automation: Automation) => {
    const newStatus = automation.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('email_automations')
      .update({ status: newStatus })
      .eq('id', automation.id);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(newStatus === 'active' ? 'Automation activated' : 'Automation paused');
      fetchAutomations();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('email_automations').delete().eq('id', deleteId);
    if (error) toast.error('Failed to delete');
    else { toast.success('Automation deleted'); fetchAutomations(); }
    setDeleteId(null);
  };

  return (
    <>
      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Build automated email journeys with triggers, delays, and branching logic</p>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />New Automation</Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : automations.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No automations yet</p>
            <p className="text-sm mt-1">Create your first automation to engage contacts automatically</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {automations.map(a => {
              const trigger = TRIGGER_LABELS[a.trigger_type] || TRIGGER_LABELS.manual;
              const statusBadge = STATUS_BADGES[a.status] || STATUS_BADGES.draft;
              const TriggerIcon = trigger.icon;
              const stats = a.stats as any || {};
              return (
                <Card key={a.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${trigger.color}`}>
                        <TriggerIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{a.name}</h3>
                          <Badge variant={statusBadge.variant} className="shrink-0">{statusBadge.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{a.description || `${trigger.label} trigger`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                      <div className="text-center hidden md:block">
                        <p className="font-medium text-foreground">{stats.entered || 0}</p>
                        <p className="text-xs">Entered</p>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="font-medium text-foreground">{stats.completed || 0}</p>
                        <p className="text-xs">Completed</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(a)}>
                          {a.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0">
          <AutomationJourneyBuilder
            automationId={editingId}
            onSave={() => { setBuilderOpen(false); setEditingId(null); fetchAutomations(); }}
            onCancel={() => { setBuilderOpen(false); setEditingId(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this automation and all its steps.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
