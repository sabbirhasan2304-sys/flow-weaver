import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Bot, Plus, Play, Pause, Settings, Sparkles, Target, Zap, TrendingUp, Clock, Mail, Users, Brain, Loader2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  goal: string;
  type: 'nurture' | 'winback' | 'upsell' | 'onboarding' | 'custom';
  status: 'active' | 'paused' | 'learning' | 'draft';
  metrics: { sent: number; opens: number; clicks: number; conversions: number };
  lastAction: string;
}

const AGENT_TYPES = [
  { value: 'nurture', label: 'Lead Nurture', icon: Users, description: 'Automatically warm leads with personalized content', color: 'text-blue-600 bg-blue-500/10' },
  { value: 'winback', label: 'Win-Back', icon: TrendingUp, description: 'Re-engage inactive subscribers with targeted offers', color: 'text-orange-600 bg-orange-500/10' },
  { value: 'upsell', label: 'Upsell / Cross-sell', icon: Target, description: 'Suggest related products based on purchase history', color: 'text-green-600 bg-green-500/10' },
  { value: 'onboarding', label: 'Onboarding', icon: Zap, description: 'Guide new users through product adoption', color: 'text-purple-600 bg-purple-500/10' },
  { value: 'custom', label: 'Custom Agent', icon: Brain, description: 'Define your own AI agent with custom goals', color: 'text-pink-600 bg-pink-500/10' },
];

const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Lead Nurture Bot', goal: 'Convert free users to paid within 30 days', type: 'nurture', status: 'active', metrics: { sent: 1250, opens: 450, clicks: 89, conversions: 12 }, lastAction: '2 hours ago' },
  { id: '2', name: 'Re-Engagement Agent', goal: 'Re-activate users who haven\'t opened in 60 days', type: 'winback', status: 'learning', metrics: { sent: 340, opens: 78, clicks: 23, conversions: 5 }, lastAction: '1 day ago' },
  { id: '3', name: 'Upsell Recommender', goal: 'Increase average order value by 20%', type: 'upsell', status: 'paused', metrics: { sent: 560, opens: 201, clicks: 67, conversions: 15 }, lastAction: '3 days ago' },
];

export function AICampaignAgents() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', goal: '', type: 'nurture' as Agent['type'] });

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a;
      const newStatus = a.status === 'active' ? 'paused' : 'active';
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'paused'}`);
      return { ...a, status: newStatus };
    }));
  };

  const createAgent = () => {
    if (!form.name || !form.goal) { toast.error('Fill in all fields'); return; }
    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: form.name,
      goal: form.goal,
      type: form.type,
      status: 'learning',
      metrics: { sent: 0, opens: 0, clicks: 0, conversions: 0 },
      lastAction: 'Just created',
    };
    setAgents(prev => [newAgent, ...prev]);
    setDialogOpen(false);
    setForm({ name: '', goal: '', type: 'nurture' });
    toast.success('AI Agent created! It will start learning from your data.');
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-500', label: 'Active' },
    paused: { color: 'bg-muted', label: 'Paused' },
    learning: { color: 'bg-amber-500', label: 'Learning' },
    draft: { color: 'bg-muted', label: 'Draft' },
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Campaign Agents
          </h2>
          <p className="text-sm text-muted-foreground">Autonomous AI agents that manage campaigns based on goals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Create AI Agent</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Agent Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Lead Nurture Bot" /></div>
              <div>
                <Label>Agent Type</Label>
                <Select value={form.type} onValueChange={(v: Agent['type']) => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Goal</Label>
                <Textarea value={form.goal} onChange={e => setForm({...form, goal: e.target.value})} placeholder="Describe what you want the agent to achieve..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createAgent}><Sparkles className="h-4 w-4 mr-1" />Create Agent</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent Types Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {AGENT_TYPES.map(t => {
          const Icon = t.icon;
          const count = agents.filter(a => a.type === t.value).length;
          return (
            <Card key={t.value} className="cursor-pointer hover:border-primary/30 transition-colors">
              <CardContent className="pt-4 pb-3 text-center">
                <div className={`h-10 w-10 rounded-lg mx-auto flex items-center justify-center ${t.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium mt-2">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{count} agent{count !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agent Cards */}
      <div className="space-y-3">
        {agents.map(agent => {
          const typeInfo = AGENT_TYPES.find(t => t.value === agent.type) || AGENT_TYPES[4];
          const TypeIcon = typeInfo.icon;
          const status = statusConfig[agent.status];
          const convRate = agent.metrics.clicks > 0 ? ((agent.metrics.conversions / agent.metrics.clicks) * 100).toFixed(1) : '0';

          return (
            <Card key={agent.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                    <TypeIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                        {status.label}
                      </Badge>
                      {agent.status === 'learning' && <Loader2 className="h-3 w-3 animate-spin text-amber-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{agent.goal}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />Last action: {agent.lastAction}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm shrink-0">
                    <div className="text-center hidden md:block">
                      <p className="font-semibold">{agent.metrics.sent}</p>
                      <p className="text-[10px] text-muted-foreground">Sent</p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="font-semibold">{agent.metrics.opens}</p>
                      <p className="text-[10px] text-muted-foreground">Opens</p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="font-semibold">{convRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Conv.</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleAgent(agent.id)}>
                      {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
