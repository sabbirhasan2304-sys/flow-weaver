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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Save, X, Plus, Trash2, Mail, Clock, GitBranch, Zap, Tag,
  Users, CalendarDays, ArrowDown, ChevronRight, MousePointerClick,
  ShoppingCart, ListPlus, UserPlus, Bell, Webhook, Repeat, MoveDown,
  Check, XCircle, Merge, GripVertical, ChevronUp, ChevronDown as ChevronDownIcon,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AutomationStep {
  id: string;
  step_type: 'send_email' | 'wait' | 'condition' | 'action' | 'goto';
  step_order: number;
  config: Record<string, any>;
  parent_step_id: string | null;
  branch_label: string | null;
}

interface StepNode {
  step: AutomationStep;
  yesBranch: StepNode[];
  noBranch: StepNode[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TRIGGER_TYPES = [
  { value: 'welcome', label: 'Welcome / New Subscriber', icon: UserPlus, description: 'When a contact subscribes or joins a list', color: 'text-emerald-600 bg-emerald-500/10' },
  { value: 'abandoned_cart', label: 'Abandoned Cart', icon: ShoppingCart, description: 'When a shopping cart is abandoned', color: 'text-orange-600 bg-orange-500/10' },
  { value: 'date_based', label: 'Date / Anniversary', icon: CalendarDays, description: 'On a birthday, signup anniversary, or custom date', color: 'text-blue-600 bg-blue-500/10' },
  { value: 'tag_added', label: 'Tag Added', icon: Tag, description: 'When a specific tag is applied to a contact', color: 'text-purple-600 bg-purple-500/10' },
  { value: 'list_joined', label: 'List Joined', icon: ListPlus, description: 'When a contact is added to a specific list', color: 'text-cyan-600 bg-cyan-500/10' },
  { value: 'webhook', label: 'Webhook / API', icon: Webhook, description: 'Triggered via an external webhook call', color: 'text-rose-600 bg-rose-500/10' },
  { value: 'manual', label: 'Manual Trigger', icon: Zap, description: 'Manually triggered by you', color: 'text-muted-foreground bg-muted' },
];

const STEP_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: Mail, color: 'text-blue-500 bg-blue-500/10', description: 'Send an email to the contact' },
  { value: 'wait', label: 'Wait / Delay', icon: Clock, color: 'text-amber-500 bg-amber-500/10', description: 'Wait for a specified duration' },
  { value: 'condition', label: 'If / Then', icon: GitBranch, color: 'text-purple-500 bg-purple-500/10', description: 'Branch based on a condition' },
  { value: 'action', label: 'Action', icon: Zap, color: 'text-green-500 bg-green-500/10', description: 'Perform an action on the contact' },
];

const WAIT_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
];

const CONDITION_TYPES = [
  { value: 'email_opened', label: 'Previous Email Opened' },
  { value: 'email_clicked', label: 'Previous Email Clicked' },
  { value: 'has_tag', label: 'Contact Has Tag' },
  { value: 'in_list', label: 'Contact In List' },
  { value: 'field_equals', label: 'Custom Field Equals' },
  { value: 'engagement_score', label: 'Engagement Score Above' },
  { value: 'purchased', label: 'Has Made Purchase' },
];

const ACTION_TYPES = [
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'remove_tag', label: 'Remove Tag' },
  { value: 'add_to_list', label: 'Add to List' },
  { value: 'remove_from_list', label: 'Remove from List' },
  { value: 'update_field', label: 'Update Contact Field' },
  { value: 'notify', label: 'Send Notification' },
  { value: 'unsubscribe', label: 'Unsubscribe Contact' },
];

function generateId() {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Tree helpers ───────────────────────────────────────────────────────────

function buildTree(flatSteps: AutomationStep[]): StepNode[] {
  // For simplicity: root steps have parent_step_id = null and branch_label = null
  const rootSteps = flatSteps
    .filter(s => !s.parent_step_id)
    .sort((a, b) => a.step_order - b.step_order);

  function buildChildren(parentId: string): { yes: StepNode[]; no: StepNode[] } {
    const yesSteps = flatSteps
      .filter(s => s.parent_step_id === parentId && s.branch_label === 'yes')
      .sort((a, b) => a.step_order - b.step_order);
    const noSteps = flatSteps
      .filter(s => s.parent_step_id === parentId && s.branch_label === 'no')
      .sort((a, b) => a.step_order - b.step_order);

    return {
      yes: yesSteps.map(s => ({ step: s, ...buildNodeChildren(s) })),
      no: noSteps.map(s => ({ step: s, ...buildNodeChildren(s) })),
    };
  }

  function buildNodeChildren(s: AutomationStep): { yesBranch: StepNode[]; noBranch: StepNode[] } {
    if (s.step_type === 'condition') {
      const children = buildChildren(s.id);
      return { yesBranch: children.yes, noBranch: children.no };
    }
    return { yesBranch: [], noBranch: [] };
  }

  return rootSteps.map(s => ({ step: s, ...buildNodeChildren(s) }));
}

function flattenTree(nodes: StepNode[], parentId: string | null = null, branchLabel: string | null = null, startOrder = 0): AutomationStep[] {
  const result: AutomationStep[] = [];
  let order = startOrder;
  for (const node of nodes) {
    result.push({
      ...node.step,
      parent_step_id: parentId,
      branch_label: branchLabel,
      step_order: order++,
    });
    if (node.step.step_type === 'condition') {
      result.push(...flattenTree(node.yesBranch, node.step.id, 'yes', 0));
      result.push(...flattenTree(node.noBranch, node.step.id, 'no', 0));
    }
  }
  return result;
}

// ─── Main Component ─────────────────────────────────────────────────────────

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
  const [tree, setTree] = useState<StepNode[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const findStep = useCallback((nodes: StepNode[], id: string): AutomationStep | null => {
    for (const n of nodes) {
      if (n.step.id === id) return n.step;
      const found = findStep(n.yesBranch, id) || findStep(n.noBranch, id);
      if (found) return found;
    }
    return null;
  }, []);

  const selectedStep = selectedStepId && selectedStepId !== 'trigger'
    ? findStep(tree, selectedStepId) : null;

  useEffect(() => {
    if (automationId) loadAutomation();
  }, [automationId]);

  const loadAutomation = async () => {
    if (!automationId) return;
    const { data: automation } = await supabase
      .from('email_automations').select('*').eq('id', automationId).single();
    if (automation) {
      setName(automation.name);
      setDescription(automation.description || '');
      setTriggerType(automation.trigger_type);
      setTriggerConfig(automation.trigger_config as Record<string, any> || {});
    }
    const { data: stepsData } = await supabase
      .from('email_automation_steps').select('*').eq('automation_id', automationId).order('step_order');
    if (stepsData) {
      const flat: AutomationStep[] = stepsData.map(s => ({
        id: s.id,
        step_type: s.step_type as AutomationStep['step_type'],
        step_order: s.step_order,
        config: s.config as Record<string, any>,
        parent_step_id: s.parent_step_id,
        branch_label: s.branch_label,
      }));
      setTree(buildTree(flat));
    }
  };

  // ─── Tree mutation helpers ──────────────────────────

  const addStepToList = (
    list: StepNode[],
    type: AutomationStep['step_type'],
    afterIndex?: number,
  ): StepNode[] => {
    const newNode: StepNode = {
      step: {
        id: generateId(),
        step_type: type,
        step_order: 0,
        config: getDefaultConfig(type),
        parent_step_id: null,
        branch_label: null,
      },
      yesBranch: [],
      noBranch: [],
    };
    const newList = [...list];
    if (afterIndex !== undefined) {
      newList.splice(afterIndex + 1, 0, newNode);
    } else {
      newList.push(newNode);
    }
    setSelectedStepId(newNode.step.id);
    return newList;
  };

  const addToRoot = (type: AutomationStep['step_type'], afterIndex?: number) => {
    setTree(prev => addStepToList(prev, type, afterIndex));
  };

  const addToBranch = (conditionId: string, branch: 'yes' | 'no', type: AutomationStep['step_type'], afterIndex?: number) => {
    setTree(prev => mapTree(prev, conditionId, node => {
      if (branch === 'yes') {
        return { ...node, yesBranch: addStepToList(node.yesBranch, type, afterIndex) };
      } else {
        return { ...node, noBranch: addStepToList(node.noBranch, type, afterIndex) };
      }
    }));
  };

  const mapTree = (nodes: StepNode[], targetId: string, fn: (n: StepNode) => StepNode): StepNode[] => {
    return nodes.map(n => {
      if (n.step.id === targetId) return fn(n);
      return {
        ...n,
        yesBranch: mapTree(n.yesBranch, targetId, fn),
        noBranch: mapTree(n.noBranch, targetId, fn),
      };
    });
  };

  const updateStepInTree = (stepId: string, config: Record<string, any>) => {
    setTree(prev => mapTree(prev, stepId, n => ({
      ...n,
      step: { ...n.step, config },
    })));
  };

  const deleteFromTree = (stepId: string) => {
    const filterNodes = (nodes: StepNode[]): StepNode[] =>
      nodes.filter(n => n.step.id !== stepId).map(n => ({
        ...n,
        yesBranch: filterNodes(n.yesBranch),
        noBranch: filterNodes(n.noBranch),
      }));
    setTree(prev => filterNodes(prev));
    if (selectedStepId === stepId) setSelectedStepId(null);
  };

  const moveStepInList = (list: StepNode[], stepId: string, dir: -1 | 1): StepNode[] => {
    const idx = list.findIndex(n => n.step.id === stepId);
    if (idx < 0) return list;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return list;
    const newList = [...list];
    [newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]];
    return newList;
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    // Try root first
    const rootIdx = tree.findIndex(n => n.step.id === stepId);
    if (rootIdx >= 0) {
      setTree(prev => moveStepInList(prev, stepId, dir));
      return;
    }
    // Search branches
    setTree(prev => {
      const search = (nodes: StepNode[]): StepNode[] =>
        nodes.map(n => {
          const yesIdx = n.yesBranch.findIndex(c => c.step.id === stepId);
          const noIdx = n.noBranch.findIndex(c => c.step.id === stepId);
          return {
            ...n,
            yesBranch: yesIdx >= 0 ? moveStepInList(n.yesBranch, stepId, dir) : search(n.yesBranch),
            noBranch: noIdx >= 0 ? moveStepInList(n.noBranch, stepId, dir) : search(n.noBranch),
          };
        });
      return search(prev);
    });
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

  // ─── Save ───────────────────────────────────────────

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
        await supabase.from('email_automation_steps').delete().eq('automation_id', autoId);
      } else {
        const { data, error } = await supabase.from('email_automations').insert([{
          profile_id: profile.id, name, description, trigger_type: triggerType, trigger_config: triggerConfig,
        }]).select().single();
        if (error) throw error;
        autoId = data.id;
      }

      const flat = flattenTree(tree);
      if (flat.length > 0) {
        const stepsToInsert = flat.map(s => ({
          automation_id: autoId!,
          step_type: s.step_type,
          step_order: s.step_order,
          config: s.config,
          parent_step_id: s.parent_step_id,
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
          <Badge variant="outline" className="text-xs shrink-0">
            {flattenTree(tree).length} steps
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}><X className="h-3 w-3 mr-1" />Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-3 w-3 mr-1" />{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Journey canvas */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Trigger card */}
            <div className="flex justify-center">
              <Card
                className={`max-w-md w-full cursor-pointer transition-all ${selectedStepId === 'trigger' ? 'ring-2 ring-primary border-primary' : 'border-2 border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'}`}
                onClick={() => setSelectedStepId('trigger')}
              >
                <div className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${triggerInfo.color}`}>
                    <TriggerIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{triggerInfo.label}</p>
                    <p className="text-xs text-muted-foreground">{triggerInfo.description}</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">Trigger</Badge>
                </div>
              </Card>
            </div>

            {/* Root steps */}
            <StepList
              nodes={tree}
              selectedStepId={selectedStepId}
              onSelect={setSelectedStepId}
              onAdd={(type, afterIdx) => addToRoot(type, afterIdx)}
              onAddToBranch={addToBranch}
              onDelete={deleteFromTree}
              onMove={moveStep}
              depth={0}
            />

            {/* Add first step */}
            <Connector />
            <AddStepButtons onAdd={(type) => addToRoot(type)} />
          </div>
        </div>

        {/* Right: Settings panel */}
        <div className="w-80 border-l border-border bg-card flex flex-col">
          <ScrollArea className="flex-1">
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
                  onConfigChange={(config) => updateStepInTree(selectedStep.id, config)}
                  onDelete={() => deleteFromTree(selectedStep.id)}
                  onMoveUp={() => moveStep(selectedStep.id, -1)}
                  onMoveDown={() => moveStep(selectedStep.id, 1)}
                />
              ) : (
                <div className="text-center text-sm text-muted-foreground py-12">
                  <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">Select a step to configure</p>
                  <p className="text-xs mt-1">Click any trigger, step, or add new steps to build your journey</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─── Step List (recursive for branches) ─────────────────────────────────────

function StepList({
  nodes, selectedStepId, onSelect, onAdd, onAddToBranch, onDelete, onMove, depth,
  parentConditionId, branchLabel,
}: {
  nodes: StepNode[];
  selectedStepId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: AutomationStep['step_type'], afterIndex?: number) => void;
  onAddToBranch: (conditionId: string, branch: 'yes' | 'no', type: AutomationStep['step_type'], afterIndex?: number) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  depth: number;
  parentConditionId?: string;
  branchLabel?: string;
}) {
  return (
    <>
      {nodes.map((node, idx) => {
        const stepDef = STEP_TYPES.find(s => s.value === node.step.step_type)!;
        const StepIcon = stepDef.icon;
        const isSelected = selectedStepId === node.step.id;
        const isCondition = node.step.step_type === 'condition';

        return (
          <div key={node.step.id}>
            <Connector />

            {/* Step card */}
            <div className="flex justify-center">
              <Card
                className={`max-w-md w-full cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/40'}`}
                onClick={() => onSelect(node.step.id)}
              >
                <div className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${stepDef.color}`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{stepDef.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{getStepSummary(node.step)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(node.step.id, -1)}>
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(node.step.id, 1)}>
                      <ChevronDownIcon className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(node.step.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Condition branches */}
            {isCondition && (
              <div className="mt-2">
                {/* Branch split visual */}
                <div className="flex justify-center">
                  <div className="w-px h-4 bg-border" />
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {/* Yes branch */}
                  <div className="border-l-2 border-emerald-500/40 pl-3 rounded-bl-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">Yes</span>
                    </div>
                    <StepList
                      nodes={node.yesBranch}
                      selectedStepId={selectedStepId}
                      onSelect={onSelect}
                      onAdd={(type, afterIdx) => onAddToBranch(node.step.id, 'yes', type, afterIdx)}
                      onAddToBranch={onAddToBranch}
                      onDelete={onDelete}
                      onMove={onMove}
                      depth={depth + 1}
                      parentConditionId={node.step.id}
                      branchLabel="yes"
                    />
                    <div className="mt-2">
                      <AddStepButtons
                        onAdd={(type) => onAddToBranch(node.step.id, 'yes', type)}
                        compact
                      />
                    </div>
                  </div>

                  {/* No branch */}
                  <div className="border-l-2 border-red-500/40 pl-3 rounded-bl-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-500">No</span>
                    </div>
                    <StepList
                      nodes={node.noBranch}
                      selectedStepId={selectedStepId}
                      onSelect={onSelect}
                      onAdd={(type, afterIdx) => onAddToBranch(node.step.id, 'no', type, afterIdx)}
                      onAddToBranch={onAddToBranch}
                      onDelete={onDelete}
                      onMove={onMove}
                      depth={depth + 1}
                      parentConditionId={node.step.id}
                      branchLabel="no"
                    />
                    <div className="mt-2">
                      <AddStepButtons
                        onAdd={(type) => onAddToBranch(node.step.id, 'no', type)}
                        compact
                      />
                    </div>
                  </div>
                </div>
                {/* Merge indicator */}
                <div className="flex justify-center mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Merge className="h-3 w-3" />
                    <span>Branches merge</span>
                  </div>
                </div>
              </div>
            )}

            {/* Insert-between button */}
            {idx < nodes.length - 1 && (
              <>
                <Connector />
                <InsertStepButton onAdd={(type) => onAdd(type, idx)} />
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── UI Components ──────────────────────────────────────────────────────────

function Connector() {
  return (
    <div className="flex justify-center py-0.5">
      <div className="flex flex-col items-center">
        <div className="w-px h-3 bg-border" />
        <ArrowDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
}

function InsertStepButton({ onAdd }: { onAdd: (type: AutomationStep['step_type']) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex justify-center">
      {open ? (
        <div className="flex gap-1.5 bg-card border rounded-lg p-1.5 shadow-sm">
          {STEP_TYPES.map(st => {
            const Icon = st.icon;
            return (
              <Tooltip key={st.value}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { onAdd(st.value as AutomationStep['step_type']); setOpen(false); }}>
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{st.label}</TooltipContent>
              </Tooltip>
            );
          })}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full border border-dashed border-border hover:border-primary hover:bg-primary/5" onClick={() => setOpen(true)}>
          <Plus className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function AddStepButtons({ onAdd, compact }: { onAdd: (type: AutomationStep['step_type']) => void; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {STEP_TYPES.map(st => {
          const Icon = st.icon;
          return (
            <Button key={st.value} variant="outline" size="sm" className="gap-1 text-[10px] h-6 px-2" onClick={() => onAdd(st.value as AutomationStep['step_type'])}>
              <Icon className="h-2.5 w-2.5" />{st.label}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="flex gap-2 flex-wrap justify-center">
        {STEP_TYPES.map(st => {
          const Icon = st.icon;
          return (
            <Button key={st.value} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onAdd(st.value as AutomationStep['step_type'])}>
              <Icon className="h-3.5 w-3.5" />{st.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function getStepSummary(step: AutomationStep): string {
  switch (step.step_type) {
    case 'send_email': return step.config.subject || 'No subject set';
    case 'wait': return `Wait ${step.config.duration || 1} ${step.config.unit || 'days'}`;
    case 'condition':
      const cond = CONDITION_TYPES.find(c => c.value === step.config.condition_type);
      return cond?.label || 'No condition';
    case 'action':
      const act = ACTION_TYPES.find(a => a.value === step.config.action_type);
      return `${act?.label || 'Action'}${step.config.value ? `: ${step.config.value}` : ''}`;
    default: return '';
  }
}

// ─── Settings Panels ────────────────────────────────────────────────────────

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
      <h3 className="font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" />Trigger Settings</h3>

      <div>
        <Label className="text-xs">Trigger Type</Label>
        <div className="space-y-1.5 mt-2">
          {TRIGGER_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5 ${triggerType === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}
                onClick={() => onTriggerTypeChange(t.value)}
              >
                <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${t.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs">Description</Label>
        <Textarea value={description} onChange={e => onDescriptionChange(e.target.value)} placeholder="Describe this automation..." rows={2} className="mt-1" />
      </div>

      {/* Trigger-specific config */}
      {triggerType === 'date_based' && (
        <>
          <div>
            <Label className="text-xs">Date Field</Label>
            <Select value={triggerConfig.date_field || 'created_at'} onValueChange={v => onTriggerConfigChange({ ...triggerConfig, date_field: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Sign-up Date</SelectItem>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="custom">Custom Date Field</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Days Before/After</Label>
            <Input type="number" value={triggerConfig.days_offset || 0} onChange={e => onTriggerConfigChange({ ...triggerConfig, days_offset: Number(e.target.value) })} className="mt-1" />
            <p className="text-[10px] text-muted-foreground mt-1">0 = on the day, negative = before, positive = after</p>
          </div>
          {triggerConfig.date_field === 'custom' && (
            <div>
              <Label className="text-xs">Custom Field Name</Label>
              <Input value={triggerConfig.custom_field || ''} onChange={e => onTriggerConfigChange({ ...triggerConfig, custom_field: e.target.value })} placeholder="e.g. renewal_date" className="mt-1" />
            </div>
          )}
        </>
      )}

      {triggerType === 'welcome' && (
        <div>
          <Label className="text-xs">List (optional)</Label>
          <Input value={triggerConfig.list_name || ''} onChange={e => onTriggerConfigChange({ ...triggerConfig, list_name: e.target.value })} placeholder="Any list" className="mt-1" />
        </div>
      )}

      {triggerType === 'tag_added' && (
        <div>
          <Label className="text-xs">Tag Name</Label>
          <Input value={triggerConfig.tag_name || ''} onChange={e => onTriggerConfigChange({ ...triggerConfig, tag_name: e.target.value })} placeholder="Tag name..." className="mt-1" />
        </div>
      )}

      {triggerType === 'abandoned_cart' && (
        <div>
          <Label className="text-xs">Wait Before Triggering</Label>
          <div className="flex gap-2 mt-1">
            <Input type="number" value={triggerConfig.wait_hours || 1} onChange={e => onTriggerConfigChange({ ...triggerConfig, wait_hours: Number(e.target.value) })} className="w-20" />
            <span className="text-xs text-muted-foreground self-center">hours after abandonment</span>
          </div>
        </div>
      )}

      {triggerType === 'list_joined' && (
        <div>
          <Label className="text-xs">List Name</Label>
          <Input value={triggerConfig.list_name || ''} onChange={e => onTriggerConfigChange({ ...triggerConfig, list_name: e.target.value })} placeholder="List name..." className="mt-1" />
        </div>
      )}

      {triggerType === 'webhook' && (
        <div>
          <Label className="text-xs">Webhook URL</Label>
          <Input value={triggerConfig.webhook_url || ''} readOnly placeholder="Generated after saving" className="mt-1 bg-muted text-xs" />
          <p className="text-[10px] text-muted-foreground mt-1">POST requests to this URL will trigger the automation</p>
        </div>
      )}
    </div>
  );
}

function StepSettings({ step, onConfigChange, onDelete, onMoveUp, onMoveDown }: {
  step: AutomationStep;
  onConfigChange: (config: Record<string, any>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const update = (key: string, value: any) => onConfigChange({ ...step.config, [key]: value });
  const stepDef = STEP_TYPES.find(s => s.value === step.step_type)!;
  const StepIcon = stepDef.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <div className={`h-6 w-6 rounded flex items-center justify-center ${stepDef.color}`}>
            <StepIcon className="h-3.5 w-3.5" />
          </div>
          {stepDef.label}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp}><ChevronUp className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown}><ChevronDownIcon className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{stepDef.description}</p>

      {step.step_type === 'send_email' && (
        <>
          <div><Label className="text-xs">Email Subject</Label><Input value={step.config.subject || ''} onChange={e => update('subject', e.target.value)} placeholder="Subject line..." className="mt-1" /></div>
          <div><Label className="text-xs">From Name</Label><Input value={step.config.from_name || ''} onChange={e => update('from_name', e.target.value)} placeholder="Your Name" className="mt-1" /></div>
          <div><Label className="text-xs">From Email</Label><Input value={step.config.from_email || ''} onChange={e => update('from_email', e.target.value)} placeholder="you@example.com" className="mt-1" /></div>
          <div>
            <Label className="text-xs">Template</Label>
            <Select value={step.config.template_id || ''} onValueChange={v => update('template_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select template..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template (inline)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {step.step_type === 'wait' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs">Duration</Label>
            <Input type="number" min={1} value={step.config.duration || 1} onChange={e => update('duration', Number(e.target.value))} className="mt-1" />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Unit</Label>
            <Select value={step.config.unit || 'days'} onValueChange={v => update('unit', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
            <Label className="text-xs">Condition Type</Label>
            <Select value={step.config.condition_type || 'email_opened'} onValueChange={v => update('condition_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {['has_tag', 'field_equals', 'engagement_score'].includes(step.config.condition_type) && (
            <div><Label className="text-xs">Value</Label><Input value={step.config.value || ''} onChange={e => update('value', e.target.value)} placeholder="Value..." className="mt-1" /></div>
          )}
          <Card className="bg-muted/50 border-dashed">
            <div className="p-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /><span><strong className="text-foreground">Yes branch:</strong> Contacts matching the condition</span></div>
              <div className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-red-500" /><span><strong className="text-foreground">No branch:</strong> Contacts not matching</span></div>
              <div className="flex items-center gap-1.5"><Merge className="h-3 w-3" /><span>Both branches merge back after completing</span></div>
            </div>
          </Card>
        </>
      )}

      {step.step_type === 'action' && (
        <>
          <div>
            <Label className="text-xs">Action Type</Label>
            <Select value={step.config.action_type || 'add_tag'} onValueChange={v => update('action_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Value</Label><Input value={step.config.value || ''} onChange={e => update('value', e.target.value)} placeholder="Tag name, list name, etc." className="mt-1" /></div>
        </>
      )}
    </div>
  );
}
