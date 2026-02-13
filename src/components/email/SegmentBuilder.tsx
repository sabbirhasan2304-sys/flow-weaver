import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Filter, Users, X, Layers } from 'lucide-react';

export interface SegmentRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface Segment {
  id: string;
  name: string;
  rules: SegmentRule[];
  logic: 'and' | 'or';
}

interface SegmentBuilderProps {
  contacts: any[];
  onApplySegment: (filteredContactIds: string[]) => void;
}

const FIELDS = [
  { value: 'status', label: 'Status', type: 'select', options: ['subscribed', 'unsubscribed', 'bounced'] },
  { value: 'source', label: 'Source', type: 'text' },
  { value: 'company', label: 'Company', type: 'text' },
  { value: 'total_emails_sent', label: 'Emails Sent', type: 'number' },
  { value: 'total_opens', label: 'Total Opens', type: 'number' },
  { value: 'total_clicks', label: 'Total Clicks', type: 'number' },
  { value: 'engagement', label: 'Engagement Level', type: 'select', options: ['Highly Engaged', 'Engaged', 'Low Engagement', 'At Risk', 'New'] },
  { value: 'created_days_ago', label: 'Days Since Added', type: 'number' },
  { value: 'last_emailed_days', label: 'Days Since Last Email', type: 'number' },
];

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
    { value: 'between', label: 'between' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
};

function getEngagementLevel(c: any) {
  const sent = c.total_emails_sent || 0;
  if (sent === 0) return 'New';
  const rate = ((c.total_opens || 0) / sent) * 0.6 + ((c.total_clicks || 0) / sent) * 0.4;
  const score = Math.min(100, Math.round(rate * 100));
  if (score >= 70) return 'Highly Engaged';
  if (score >= 40) return 'Engaged';
  if (score >= 15) return 'Low Engagement';
  return 'At Risk';
}

function evaluateRule(contact: any, rule: SegmentRule): boolean {
  const fieldDef = FIELDS.find(f => f.value === rule.field);
  if (!fieldDef) return true;

  let contactValue: any;

  if (rule.field === 'engagement') {
    contactValue = getEngagementLevel(contact);
  } else if (rule.field === 'created_days_ago') {
    contactValue = Math.floor((Date.now() - new Date(contact.created_at).getTime()) / 86400000);
  } else if (rule.field === 'last_emailed_days') {
    contactValue = contact.last_emailed_at
      ? Math.floor((Date.now() - new Date(contact.last_emailed_at).getTime()) / 86400000)
      : 9999;
  } else {
    contactValue = contact[rule.field];
  }

  const ruleValue = rule.value;

  switch (rule.operator) {
    case 'equals':
      return String(contactValue ?? '').toLowerCase() === ruleValue.toLowerCase();
    case 'not_equals':
      return String(contactValue ?? '').toLowerCase() !== ruleValue.toLowerCase();
    case 'contains':
      return String(contactValue ?? '').toLowerCase().includes(ruleValue.toLowerCase());
    case 'not_contains':
      return !String(contactValue ?? '').toLowerCase().includes(ruleValue.toLowerCase());
    case 'starts_with':
      return String(contactValue ?? '').toLowerCase().startsWith(ruleValue.toLowerCase());
    case 'is_empty':
      return !contactValue || String(contactValue).trim() === '';
    case 'is_not_empty':
      return !!contactValue && String(contactValue).trim() !== '';
    case 'greater_than':
      return Number(contactValue || 0) > Number(ruleValue);
    case 'less_than':
      return Number(contactValue || 0) < Number(ruleValue);
    default:
      return true;
  }
}

export function SegmentBuilder({ contacts, onApplySegment }: SegmentBuilderProps) {
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [logic, setLogic] = useState<'and' | 'or'>('and');
  const [segmentName, setSegmentName] = useState('');
  const [savedSegments, setSavedSegments] = useState<Segment[]>([]);

  const addRule = () => {
    setRules(prev => [...prev, {
      id: `rule_${Date.now()}`,
      field: 'status',
      operator: 'equals',
      value: 'subscribed',
    }]);
  };

  const updateRule = (id: string, updates: Partial<SegmentRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const matchingContacts = useMemo(() => {
    if (rules.length === 0) return contacts;
    return contacts.filter(contact => {
      const results = rules.map(rule => evaluateRule(contact, rule));
      return logic === 'and' ? results.every(Boolean) : results.some(Boolean);
    });
  }, [contacts, rules, logic]);

  const applySegment = () => {
    onApplySegment(matchingContacts.map(c => c.id));
    toast.success(`Segment applied: ${matchingContacts.length} contacts`);
  };

  const saveSegment = () => {
    if (!segmentName.trim()) {
      toast.error('Enter a segment name');
      return;
    }
    const segment: Segment = {
      id: `seg_${Date.now()}`,
      name: segmentName,
      rules: [...rules],
      logic,
    };
    setSavedSegments(prev => [...prev, segment]);
    setSegmentName('');
    toast.success('Segment saved locally');
  };

  const loadSegment = (segment: Segment) => {
    setRules([...segment.rules]);
    setLogic(segment.logic);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Segment Builder
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {matchingContacts.length} / {contacts.length} contacts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Saved segments */}
        {savedSegments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {savedSegments.map(seg => (
              <button
                key={seg.id}
                onClick={() => loadSegment(seg)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center gap-1"
              >
                <Filter className="h-2.5 w-2.5" />
                {seg.name}
                <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">{seg.rules.length}</Badge>
              </button>
            ))}
          </div>
        )}

        {/* Logic toggle */}
        {rules.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Match</span>
            <div className="flex border rounded-md">
              <button
                onClick={() => setLogic('and')}
                className={`text-[11px] px-3 py-1 transition-colors ${logic === 'and' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
              >
                ALL rules
              </button>
              <button
                onClick={() => setLogic('or')}
                className={`text-[11px] px-3 py-1 transition-colors ${logic === 'or' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
              >
                ANY rule
              </button>
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const fieldDef = FIELDS.find(f => f.value === rule.field);
            const fieldType = fieldDef?.type || 'text';
            const operators = OPERATORS[fieldType] || OPERATORS.text;

            return (
              <div key={rule.id} className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-2">
                {idx > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium uppercase w-8 text-center shrink-0">
                    {logic}
                  </span>
                )}

                <Select value={rule.field} onValueChange={v => updateRule(rule.id, { field: v, operator: 'equals', value: '' })}>
                  <SelectTrigger className="h-7 text-[11px] w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELDS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={rule.operator} onValueChange={v => updateRule(rule.id, { operator: v })}>
                  <SelectTrigger className="h-7 text-[11px] w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {operators.map(op => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                  fieldDef?.type === 'select' && fieldDef.options ? (
                    <Select value={rule.value} onValueChange={v => updateRule(rule.id, { value: v })}>
                      <SelectTrigger className="h-7 text-[11px] flex-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {fieldDef.options.map(opt => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={rule.value}
                      onChange={e => updateRule(rule.id, { value: e.target.value })}
                      placeholder="Value..."
                      type={fieldType === 'number' ? 'number' : 'text'}
                      className="h-7 text-[11px] flex-1"
                    />
                  )
                )}

                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRule(rule.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add rule */}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addRule}>
          <Plus className="h-3 w-3 mr-1" />
          Add Rule
        </Button>

        {/* Actions */}
        {rules.length > 0 && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 text-xs" onClick={applySegment}>
              <Users className="h-3 w-3 mr-1" />
              Apply ({matchingContacts.length})
            </Button>
            <div className="flex gap-1">
              <Input
                value={segmentName}
                onChange={e => setSegmentName(e.target.value)}
                placeholder="Segment name..."
                className="h-8 text-xs w-32"
              />
              <Button size="sm" variant="outline" className="text-xs" onClick={saveSegment}>
                <Save className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
