import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users, Clock, CalendarDays, ShoppingCart, Heart, Sparkles,
  Mail, GitBranch, Zap, Tag, Loader2,
} from 'lucide-react';

interface TemplateStep {
  step_type: 'send_email' | 'wait' | 'condition' | 'action';
  config: Record<string, any>;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  icon: any;
  color: string;
  steps: TemplateStep[];
}

const TEMPLATES: AutomationTemplate[] = [
  {
    id: 'welcome-series',
    name: 'Welcome Series',
    description: '3-email welcome sequence for new subscribers with engagement check',
    trigger_type: 'welcome',
    trigger_config: {},
    icon: Users,
    color: 'text-green-600 bg-green-500/10 border-green-500/20',
    steps: [
      { step_type: 'send_email', config: { subject: 'Welcome! Here\'s what to expect', template_id: '' } },
      { step_type: 'wait', config: { duration: 2, unit: 'days' } },
      { step_type: 'send_email', config: { subject: 'Getting started — your quick guide', template_id: '' } },
      { step_type: 'wait', config: { duration: 3, unit: 'days' } },
      { step_type: 'condition', config: { condition_type: 'email_opened', value: '' } },
      { step_type: 'send_email', config: { subject: 'Exclusive offer just for you 🎁', template_id: '' } },
      { step_type: 'action', config: { action_type: 'add_tag', value: 'engaged' } },
    ],
  },
  {
    id: 'cart-recovery',
    name: 'Cart Recovery',
    description: '3-step abandoned cart recovery with urgency escalation',
    trigger_type: 'abandoned_cart',
    trigger_config: {},
    icon: ShoppingCart,
    color: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
    steps: [
      { step_type: 'wait', config: { duration: 1, unit: 'hours' } },
      { step_type: 'send_email', config: { subject: 'You left something behind!', template_id: '' } },
      { step_type: 'wait', config: { duration: 1, unit: 'days' } },
      { step_type: 'condition', config: { condition_type: 'email_clicked', value: '' } },
      { step_type: 'send_email', config: { subject: 'Still thinking it over? Here\'s 10% off', template_id: '' } },
      { step_type: 'wait', config: { duration: 2, unit: 'days' } },
      { step_type: 'send_email', config: { subject: '⏰ Last chance — your cart expires soon', template_id: '' } },
    ],
  },
  {
    id: 're-engagement',
    name: 'Re-engagement',
    description: 'Win back inactive subscribers with a targeted sequence',
    trigger_type: 'date_based',
    trigger_config: { date_field: 'created_at', days_offset: 30 },
    icon: Heart,
    color: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
    steps: [
      { step_type: 'condition', config: { condition_type: 'email_opened', value: '' } },
      { step_type: 'send_email', config: { subject: 'We miss you! Here\'s what you\'ve been missing', template_id: '' } },
      { step_type: 'wait', config: { duration: 3, unit: 'days' } },
      { step_type: 'condition', config: { condition_type: 'email_opened', value: '' } },
      { step_type: 'send_email', config: { subject: 'A special gift to welcome you back 💝', template_id: '' } },
      { step_type: 'wait', config: { duration: 5, unit: 'days' } },
      { step_type: 'action', config: { action_type: 'add_tag', value: 'inactive' } },
    ],
  },
  {
    id: 'birthday',
    name: 'Birthday Celebration',
    description: 'Automated birthday greeting with a special offer',
    trigger_type: 'date_based',
    trigger_config: { date_field: 'birthday', days_offset: 0 },
    icon: CalendarDays,
    color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    steps: [
      { step_type: 'send_email', config: { subject: '🎂 Happy Birthday! A gift from us to you', template_id: '' } },
      { step_type: 'wait', config: { duration: 3, unit: 'days' } },
      { step_type: 'condition', config: { condition_type: 'email_clicked', value: '' } },
      { step_type: 'send_email', config: { subject: 'Your birthday treat is still waiting!', template_id: '' } },
      { step_type: 'action', config: { action_type: 'add_tag', value: 'birthday-redeemed' } },
    ],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled: () => void;
}

export function AutomationTemplates({ open, onOpenChange, onInstalled }: Props) {
  const { profile } = useAuth();
  const [installing, setInstalling] = useState<string | null>(null);

  const handleInstall = async (template: AutomationTemplate) => {
    if (!profile) return;
    setInstalling(template.id);

    try {
      // Create automation
      const { data: automation, error: autoError } = await supabase
        .from('email_automations')
        .insert([{
          profile_id: profile.id,
          name: template.name,
          description: template.description,
          trigger_type: template.trigger_type,
          trigger_config: template.trigger_config,
          status: 'draft',
        }])
        .select()
        .single();

      if (autoError || !automation) throw autoError || new Error('Failed to create');

      // Insert steps
      if (template.steps.length > 0) {
        const stepsToInsert = template.steps.map((s, i) => ({
          automation_id: automation.id,
          step_type: s.step_type,
          step_order: i,
          config: s.config,
          parent_step_id: null as string | null,
          branch_label: null as string | null,
        }));
        const { error: stepsError } = await supabase
          .from('email_automation_steps')
          .insert(stepsToInsert);
        if (stepsError) throw stepsError;
      }

      toast.success(`"${template.name}" automation created as draft`);
      onInstalled();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to install template');
    } finally {
      setInstalling(null);
    }
  };

  const stepIcons: Record<string, any> = {
    send_email: Mail,
    wait: Clock,
    condition: GitBranch,
    action: Zap,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Automation Templates
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          One-click install pre-configured automation flows. Each is created as a draft so you can customize before activating.
        </p>
        <div className="grid grid-cols-1 gap-4 mt-2">
          {TEMPLATES.map(t => {
            const Icon = t.icon;
            const isInstalling = installing === t.id;
            return (
              <Card key={t.id} className={`border ${t.color.split(' ')[2] || ''} hover:shadow-md transition-shadow`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${t.color.split(' ').slice(0, 2).join(' ')}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold">{t.name}</h3>
                        <Button
                          size="sm"
                          onClick={() => handleInstall(t)}
                          disabled={!!installing}
                        >
                          {isInstalling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                          {isInstalling ? 'Installing...' : 'Install'}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                      {/* Step preview */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <Badge variant="outline" className="text-green-600 border-green-600/30 text-[10px]">
                          {t.trigger_type.replace('_', ' ')}
                        </Badge>
                        {t.steps.map((s, i) => {
                          const SIcon = stepIcons[s.step_type] || Zap;
                          return (
                            <span key={i} className="flex items-center gap-0.5">
                              <span className="text-muted-foreground text-[10px]">→</span>
                              <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5">
                                <SIcon className="h-2.5 w-2.5" />
                                {s.step_type === 'send_email' ? 'Email' :
                                 s.step_type === 'wait' ? `${s.config.duration}${s.config.unit?.[0]}` :
                                 s.step_type === 'condition' ? 'If' : 'Act'}
                              </Badge>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
