import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save, X, Plus, Trash2, Mail, Clock, GitBranch, Zap, Tag,
  Users, CalendarDays, ArrowDown, GripVertical, ChevronDown, ChevronRight,
  MousePointerClick,
} from 'lucide-react';

export interface AutomationStep {
  id: string;
  step_type: 'send_email' | 'wait' | 'condition' | 'action';
  step_order: number;
  config: Record<string, any>;
  parent_step_id: string | null;
  branch_label: string | null;
  // UI-only
  children?: { yes?: AutomationStep[]; no?: AutomationStep[] };
}

const TRIGGER_TYPES = [
  { value: 'welcome', label: 'Welcome / New Subscriber', icon: Users, description: 'Triggered when a contact joins a list' },
  { value: 'abandoned_cart', label: 'Abandoned Cart', icon: Clock, description: 'Triggered when a cart is abandoned' },
  { value: 'date_based', label: 'Date Based', icon: CalendarDays, description: 'Triggered on a specific date or anniversary' },
  { value: 'tag_added', label: 'Tag Added', icon: Tag, description: 'Triggered when a tag is applied to a contact' },
  { value: 'list_joined', label: 'List Joined', icon: Users, description: 'Triggered when a contact joins a specific list' },
  { value: 'manual', label: 'Manual Trigger', icon: Zap, description: 'Manually triggered by you' },
];

const STEP_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: Mail, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'wait', label: 'Wait / Delay', icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
  { value: 'condition', label: 'If / Condition', icon: GitBranch, color: 'text-purple-500 bg-purple-500/10' },
  { value: 'action', label: 'Action', icon: Zap, color: 'text-green-500 bg-green-500/10' },
];

const WAIT_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
];

const CONDITION_TYPES = [
  { value: 'email_opened', label: 'Email Opened' },
  { value: 'email_clicked', label: 'Email Clicked' },
  { value: 'has_tag', label: 'Has Tag' },
  { value: 'in_list', label: 'In List' },
  { value: 'field_equals', label: 'Custom Field Equals' },
];

const ACTION_TYPES = [
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'remove_tag', label: 'Remove Tag' },
  { value: 'add_to_list', label: 'Add to List' },
  { value: 'remove_from_list', label: 'Remove from List' },
  { value: 'update_field', label: 'Update Contact Field' },
  { value: 'notify', label: 'Send Notification' },
];

function generateId() {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface Props {
  automationId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function AutomationJourneyBuilder({ automationId, onSave, onCancel }: Props) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('welcome');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedStep = steps.find(s => s.id === selectedStepId) || null;

  useEffect(() => {
    if (automationId) loadAutomation();
  }, [automationId]);

  const loadAutomation = async () => {
    if (!automationId) return;
    const { data: automation } = await supabase
      .from('email_automations')
      .select('*')
      .eq('id', automationId)
      .single();
    if (automation) {
      setName(automation.name);
      setDescription(automation.description || '');
      setTriggerType(automation.trigger_type);
      setTriggerConfig(automation.trigger_config as Record<string, any> || {});
    }
    const { data: stepsData } = await supabase
      .from('email_automation_steps')
      .select('*')
      .eq('automation_id', automationId)
      .order('step_order', { ascending: true });
    if (stepsData) {
      setSteps(stepsData.map(s => ({
        id: s.id,
        step_type: s.step_type as AutomationStep['step_type'],
        step_order: s.step_order,
        config: s.config as Record<string, any>,
        parent_step_id: s.parent_step_id,
        branch_label: s.branch_label,
      })));
    }
  };

  const addStep = (type: AutomationStep['step_type'], afterIndex?: number) => {
    const newStep: AutomationStep = {
      id: generateId(),
      step_type: type,
      step_order: afterIndex !== undefined ? afterIndex + 1 : steps.length,
      config: getDefaultConfig(type),
      parent_step_id: null,
      branch_label: null,
    };
    if (afterIndex !== undefined) {
      const newSteps = [...steps];
      newSteps.splice(afterIndex + 1, 0, newStep);
      // Re-order
      newSteps.forEach((s, i) => s.step_order = i);
      setSteps(newSteps);
    } else {
      setSteps([...steps, newStep]);
    }
    setSelectedStepId(newStep.id);
  };

  const getDefaultConfig = (type: AutomationStep['step_type']): Record<string, any> => {
    switch (type) {
      case 'send_email': return { subject: '', template_id: '', from_name: '', from_email: '' };
      case 'wait': return { duration: 1, unit: 'days' };
      case 'condition': return { condition_type: 'email_opened', value: '' };
      case 'action': return { action_type: 'add_tag', value: '' };
      default: return {};
    }
  };

  const updateStepConfig = (stepId: string, config: Record<string, any>) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, config } : s));
  };

  const deleteStep = (stepId: string) => {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== stepId);
      filtered.forEach((s, i) => s.step_order = i);
      return filtered;
    });
    if (selectedStepId === stepId) setSelectedStepId(null);
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    const idx = steps.findIndex(s => s.id === stepId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
    newSteps.forEach((s, i) => s.step_order = i);
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) { toast.error('Please enter a name'); return; }
    setSaving(true);

    try {
      let autoId = automationId;

      if (autoId) {
        await supabase.from('email_automations').update({
          name, description, trigger_type: triggerType, trigger_config: triggerConfig,
        }).eq('id', autoId);
        // Delete old steps
        await supabase.from('email_automation_steps').delete().eq('automation_id', autoId);
      } else {
        const { data, error } = await supabase.from('email_automations').insert([{
          profile_id: profile.id, name, description, trigger_type: triggerType, trigger_config: triggerConfig,
        }]).select().single();
        if (error) throw error;
        autoId = data.id;
      }

      // Insert steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map(s => ({
          automation_id: autoId!,
          step_type: s.step_type,
          step_order: s.step_order,
          config: s.config,
          parent_step_id: null as string | null,
          branch_label: s.branch_label,
        }));
        const { error } = await supabase.from('email_automation_steps').insert(stepsToInsert);
        if (error) throw error;
      }

      toast.success(automationId ? 'Automation updated' : 'Automation created');
      onSave();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const triggerInfo = TRIGGER_TYPES.find(t => t.value === triggerType)!;
  const TriggerIcon = triggerInfo.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-3 flex-1">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Automation name..." className="max-w-xs font-medium" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}><X className="h-3 w-3 mr-1" />Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-3 w-3 mr-1" />{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Journey canvas */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="max-w-lg mx-auto py-8 px-4 space-y-0">
            {/* Trigger card */}
            <Card className="border-2 border-green-500/30 bg-green-500/5 cursor-pointer" onClick={() => setSelectedStepId('trigger')}>
              <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TriggerIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{triggerInfo.label}</p>
                  <p className="text-xs text-muted-foreground">{triggerInfo.description}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600/30">Trigger</Badge>
              </div>
            </Card>

            {/* Steps */}
            {steps.map((step, idx) => {
              const stepDef = STEP_TYPES.find(s => s.value === step.step_type)!;
              const StepIcon = stepDef.icon;
              const isSelected = selectedStepId === step.id;

              return (
                <div key={step.id}>
                  {/* Connector */}
                  <div className="flex justify-center py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-4 bg-border" />
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Step card */}
                  <Card
                    className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/40'}`}
                    onClick={() => setSelectedStepId(step.id)}
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${stepDef.color}`}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{stepDef.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{getStepSummary(step)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deleteStep(step.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Condition branches */}
                    {step.step_type === 'condition' && (
                      <div className="px-4 pb-3 flex gap-4 text-xs">
                        <div className="flex items-center gap-1 text-green-600">
                          <ChevronRight className="h-3 w-3" />
                          <span>Yes → continue</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                          <ChevronRight className="h-3 w-3" />
                          <span>No → skip</span>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}

            {/* Add step button */}
            <div className="flex justify-center py-1">
              <div className="w-px h-4 bg-border" />
            </div>
            <div className="flex justify-center">
              <div className="flex gap-2">
                {STEP_TYPES.map(st => {
                  const Icon = st.icon;
                  return (
                    <Button
                      key={st.value}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => addStep(st.value as AutomationStep['step_type'])}
                    >
                      <Icon className="h-3 w-3" />
                      {st.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings panel */}
        <div className="w-80 border-l border-border bg-card">
          <ScrollArea className="h-full">
            <div className="p-4">
              {selectedStepId === 'trigger' ? (
                <TriggerSettings
                  triggerType={triggerType}
                  triggerConfig={triggerConfig}
                  description={description}
                  onTriggerTypeChange={setTriggerType}
                  onTriggerConfigChange={setTriggerConfig}
                  onDescriptionChange={setDescription}
                />
              ) : selectedStep ? (
                <StepSettings
                  step={selectedStep}
                  onConfigChange={(config) => updateStepConfig(selectedStep.id, config)}
                  onDelete={() => deleteStep(selectedStep.id)}
                />
              ) : (
                <div className="text-center text-sm text-muted-foreground py-12">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Select a trigger or step to edit its settings</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function getStepSummary(step: AutomationStep): string {
  switch (step.step_type) {
    case 'send_email':
      return step.config.subject || 'No subject set';
    case 'wait':
      return `Wait ${step.config.duration || 1} ${step.config.unit || 'days'}`;
    case 'condition':
      const condType = CONDITION_TYPES.find(c => c.value === step.config.condition_type);
      return condType?.label || 'No condition set';
    case 'action':
      const actType = ACTION_TYPES.find(a => a.value === step.config.action_type);
      return actType?.label || 'No action set';
    default:
      return '';
  }
}

function TriggerSettings({
  triggerType, triggerConfig, description,
  onTriggerTypeChange, onTriggerConfigChange, onDescriptionChange,
}: {
  triggerType: string;
  triggerConfig: Record<string, any>;
  description: string;
  onTriggerTypeChange: (v: string) => void;
  onTriggerConfigChange: (v: Record<string, any>) => void;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-green-500" />Trigger Settings</h3>
      <div>
        <Label>Trigger Type</Label>
        <Select value={triggerType} onValueChange={onTriggerTypeChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={e => onDescriptionChange(e.target.value)} placeholder="Describe this automation..." rows={2} />
      </div>

      {/* Trigger-specific config */}
      {triggerType === 'date_based' && (
        <>
          <div>
            <Label>Date Field</Label>
            <Select value={triggerConfig.date_field || 'created_at'} onValueChange={v => onTriggerConfigChange({ ...triggerConfig, date_field: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Sign-up Date</SelectItem>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="custom">Custom Date Field</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Days Before/After</Label>
            <Input type="number" value={triggerConfig.days_offset || 0} onChange={e => onTriggerConfigChange({ ...triggerConfig, days_offset: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">0 = on the day, negative = before, positive = after</p>
          </div>
        </>
      )}

      {triggerType === 'welcome' && (
        <div>
          <Label>List (optional)</Label>
          <Input value={triggerConfig.list_name || ''} onChange={e => onTriggerConfigChange({ ...triggerConfig, list_name: e.target.value })} placeholder="Any list" />
        </div>
      )}

      {triggerType === 'tag_added' && (
        <div>
          <Label>Tag Name</Label>
          <Input value={triggerConfig.tag_name || ''} onChange={e => onTriggerConfigChange({ ...triggerConfig, tag_name: e.target.value })} placeholder="Tag name..." />
        </div>
      )}

      {triggerType === 'abandoned_cart' && (
        <div>
          <Label>Wait Before Triggering</Label>
          <div className="flex gap-2">
            <Input type="number" value={triggerConfig.wait_hours || 1} onChange={e => onTriggerConfigChange({ ...triggerConfig, wait_hours: Number(e.target.value) })} className="w-20" />
            <span className="text-sm text-muted-foreground self-center">hours after abandonment</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StepSettings({ step, onConfigChange, onDelete }: {
  step: AutomationStep;
  onConfigChange: (config: Record<string, any>) => void;
  onDelete: () => void;
}) {
  const update = (key: string, value: any) => onConfigChange({ ...step.config, [key]: value });
  const stepDef = STEP_TYPES.find(s => s.value === step.step_type)!;
  const StepIcon = stepDef.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <StepIcon className="h-4 w-4" />{stepDef.label} Settings
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {step.step_type === 'send_email' && (
        <>
          <div><Label>Email Subject</Label><Input value={step.config.subject || ''} onChange={e => update('subject', e.target.value)} placeholder="Subject line..." /></div>
          <div><Label>From Name</Label><Input value={step.config.from_name || ''} onChange={e => update('from_name', e.target.value)} placeholder="Your Name" /></div>
          <div><Label>From Email</Label><Input value={step.config.from_email || ''} onChange={e => update('from_email', e.target.value)} placeholder="you@example.com" /></div>
          <div>
            <Label>Template</Label>
            <Select value={step.config.template_id || ''} onValueChange={v => update('template_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template (inline)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Select a pre-built template or compose inline</p>
          </div>
        </>
      )}

      {step.step_type === 'wait' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Duration</Label>
            <Input type="number" min={1} value={step.config.duration || 1} onChange={e => update('duration', Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <Label>Unit</Label>
            <Select value={step.config.unit || 'days'} onValueChange={v => update('unit', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WAIT_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step.step_type === 'condition' && (
        <>
          <div>
            <Label>Condition Type</Label>
            <Select value={step.config.condition_type || 'email_opened'} onValueChange={v => update('condition_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(step.config.condition_type === 'has_tag' || step.config.condition_type === 'field_equals') && (
            <div><Label>Value</Label><Input value={step.config.value || ''} onChange={e => update('value', e.target.value)} placeholder="Value..." /></div>
          )}
          <p className="text-xs text-muted-foreground">
            Contacts matching the condition proceed through "Yes" branch. Others take the "No" branch (skip to next step).
          </p>
        </>
      )}

      {step.step_type === 'action' && (
        <>
          <div>
            <Label>Action Type</Label>
            <Select value={step.config.action_type || 'add_tag'} onValueChange={v => update('action_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Value</Label><Input value={step.config.value || ''} onChange={e => update('value', e.target.value)} placeholder="Tag name, list name, etc." /></div>
        </>
      )}
    </div>
  );
}
