import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Timer, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const PRESETS = [
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every day (midnight)', cron: '0 0 * * *' },
  { label: 'Every Monday', cron: '0 0 * * 1' },
];

interface ScheduleDialogProps {
  workflowId: string;
}

export function ScheduleDialog({ workflowId }: ScheduleDialogProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) fetchSchedule();
  }, [open]);

  const fetchSchedule = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('workflow_schedules')
      .select('*')
      .eq('workflow_id', workflowId)
      .maybeSingle();
    if (data) {
      setSchedule(data);
      setCronExpression((data as any).cron_expression);
    }
    setLoading(false);
  };

  const saveSchedule = async (activate?: boolean) => {
    setSaving(true);
    const isActive = activate !== undefined ? activate : schedule?.is_active || false;
    const now = new Date();

    // Simple next run calculation
    const nextRun = new Date(now.getTime() + 60000); // 1 min from now for simplicity

    if (schedule) {
      const { error } = await supabase
        .from('workflow_schedules')
        .update({
          cron_expression: cronExpression,
          is_active: isActive,
          next_run_at: isActive ? nextRun.toISOString() : null,
          updated_at: now.toISOString(),
        } as any)
        .eq('id', schedule.id);
      if (error) toast.error('Failed to update schedule');
      else {
        toast.success(isActive ? 'Schedule activated!' : 'Schedule updated');
        setSchedule({ ...schedule, cron_expression: cronExpression, is_active: isActive });
      }
    } else {
      const { data, error } = await supabase
        .from('workflow_schedules')
        .insert({
          workflow_id: workflowId,
          cron_expression: cronExpression,
          is_active: isActive,
          next_run_at: isActive ? nextRun.toISOString() : null,
          created_by: profile?.id,
        } as any)
        .select()
        .single();
      if (error) toast.error('Failed to create schedule');
      else {
        toast.success('Schedule created!');
        setSchedule(data);
      }
    }
    setSaving(false);
  };

  const toggleActive = async () => {
    await saveSchedule(!schedule?.is_active);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Timer className="h-4 w-4" />
          Schedule
          {schedule?.is_active && (
            <Badge variant="default" className="bg-success text-success-foreground ml-1 h-4 text-[10px]">ON</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Schedule Workflow
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preset Schedules</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.cron}
                    variant={cronExpression === preset.cron ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setCronExpression(preset.cron)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Cron Expression</label>
              <Input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="* * * * *"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>

            {schedule && (
              <div className="text-xs text-muted-foreground space-y-1">
                {schedule.last_run_at && (
                  <p>Last run: {new Date(schedule.last_run_at).toLocaleString()}</p>
                )}
                {schedule.next_run_at && schedule.is_active && (
                  <p>Next run: {new Date(schedule.next_run_at).toLocaleString()}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => saveSchedule()} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
              {schedule && (
                <Button
                  variant={schedule.is_active ? 'destructive' : 'default'}
                  onClick={toggleActive}
                  disabled={saving}
                >
                  {schedule.is_active ? (
                    <><Pause className="h-4 w-4 mr-1" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-1" /> Activate</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
