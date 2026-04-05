import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShoppingBag, Globe, Code, Building2, Users, BarChart3, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Persona = 'merchant' | 'agency' | 'enterprise' | null;
type Platform = 'shopify' | 'woocommerce' | 'custom' | null;
type Goal = 'meta' | 'ga4' | 'both' | 'all' | null;

const personas = [
  { id: 'merchant' as const, label: 'Merchant', desc: 'I run an online store', icon: ShoppingBag },
  { id: 'agency' as const, label: 'Agency', desc: 'I manage clients', icon: Users },
  { id: 'enterprise' as const, label: 'Enterprise', desc: 'Large-scale tracking', icon: Building2 },
];

const platforms = [
  { id: 'shopify' as const, label: 'Shopify', desc: 'Shopify store integration', icon: ShoppingBag },
  { id: 'woocommerce' as const, label: 'WooCommerce', desc: 'WordPress + WooCommerce', icon: Globe },
  { id: 'custom' as const, label: 'Custom / Other', desc: 'Custom website or other CMS', icon: Code },
];

const goals = [
  { id: 'meta' as const, label: 'Meta CAPI', desc: 'Facebook & Instagram conversions' },
  { id: 'ga4' as const, label: 'GA4 Only', desc: 'Google Analytics 4' },
  { id: 'both' as const, label: 'Meta + GA4', desc: 'Both platforms' },
  { id: 'all' as const, label: 'All Platforms', desc: 'Meta, GA4, TikTok, & more' },
];

function buildWorkflowNodes(platform: Platform, goal: Goal) {
  const nodes: any[] = [];
  const edges: any[] = [];
  let y = 0;
  const xSource = 50, xTransform = 350, xDest = 650;

  // Source node
  const sourceType = platform === 'shopify' ? 'shopify_source' : platform === 'woocommerce' ? 'woocommerce_source' : 'web_pixel';
  const sourceLabel = platform === 'shopify' ? 'Shopify Source' : platform === 'woocommerce' ? 'WooCommerce Source' : 'Web Pixel';
  nodes.push({
    id: 'source-1',
    type: 'workflowNode',
    position: { x: xSource, y: 100 },
    data: { type: sourceType, label: sourceLabel, config: {}, category: 'tracking' },
  });

  // Transform nodes
  const transforms = [
    { id: 'transform-1', type: 'pii_anonymizer', label: 'PII Anonymizer', y: 50 },
    { id: 'transform-2', type: 'bot_filter', label: 'Bot Filter', y: 180 },
    { id: 'transform-3', type: 'cookie_recovery', label: 'Cookie Recovery', y: 310 },
  ];
  transforms.forEach((t) => {
    nodes.push({
      id: t.id,
      type: 'workflowNode',
      position: { x: xTransform, y: t.y },
      data: { type: t.type, label: t.label, config: {}, category: 'tracking' },
    });
  });

  // Chain: source → transform-1 → transform-2 → transform-3
  edges.push(
    { id: 'e-s1-t1', source: 'source-1', target: 'transform-1' },
    { id: 'e-t1-t2', source: 'transform-1', target: 'transform-2' },
    { id: 'e-t2-t3', source: 'transform-2', target: 'transform-3' },
  );

  // Destination nodes
  const dests: { id: string; type: string; label: string; y: number }[] = [];
  let dIdx = 0;
  const addDest = (type: string, label: string) => {
    dests.push({ id: `dest-${++dIdx}`, type, label, y: 50 + (dIdx - 1) * 130 });
  };

  if (goal === 'meta' || goal === 'both' || goal === 'all') addDest('meta_capi', 'Meta CAPI');
  if (goal === 'ga4' || goal === 'both' || goal === 'all') addDest('ga4', 'GA4');
  if (goal === 'all') {
    addDest('tiktok_events', 'TikTok Events');
    addDest('google_ads', 'Google Ads');
  }

  dests.forEach((d) => {
    nodes.push({
      id: d.id,
      type: 'workflowNode',
      position: { x: xDest, y: d.y },
      data: { type: d.type, label: d.label, config: {}, category: 'tracking' },
    });
    edges.push({ id: `e-t3-${d.id}`, source: 'transform-3', target: d.id });
  });

  return { nodes, edges };
}

export function OnboardingWizard({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<Persona>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [goal, setGoal] = useState<Goal>(null);
  const [creating, setCreating] = useState(false);

  const progress = ((step - 1) / 3) * 100;

  const complete = async () => {
    if (!profile?.id || !platform || !goal) return;
    setCreating(true);
    try {
      // Get user's active workspace
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('profile_id', profile.id)
        .limit(1)
        .single();

      if (!memberData) throw new Error('No workspace found. Please create a workspace first.');

      const { nodes, edges } = buildWorkflowNodes(platform, goal);
      const workflowName = `${platform === 'shopify' ? 'Shopify' : platform === 'woocommerce' ? 'WooCommerce' : 'Web'} → ${goal === 'meta' ? 'Meta CAPI' : goal === 'ga4' ? 'GA4' : goal === 'both' ? 'Meta + GA4' : 'All Platforms'} Pipeline`;

      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name: workflowName,
          description: `Auto-generated by Setup Wizard (${persona} • ${platform} • ${goal})`,
          workspace_id: memberData.workspace_id,
          created_by: profile.id,
          is_active: true,
          data: { nodes, edges } as unknown as Json,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Tracking workflow created successfully!');
      onOpenChange(false);
      resetState();
      navigate(`/workflow/${data.id}`);
    } catch (err: any) {
      console.error('Wizard create error:', err);
      toast.error(err.message || 'Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setPersona(null);
    setPlatform(null);
    setGoal(null);
  };

  const getRecommendation = () => {
    const list: string[] = [];
    if (platform === 'shopify') list.push('Shopify Source');
    else if (platform === 'woocommerce') list.push('WooCommerce Source');
    else list.push('Web Pixel Source');

    list.push('PII Anonymizer', 'Bot Filter', 'Cookie Recovery');

    if (goal === 'meta' || goal === 'both' || goal === 'all') list.push('Meta CAPI Destination');
    if (goal === 'ga4' || goal === 'both' || goal === 'all') list.push('GA4 Destination');
    if (goal === 'all') list.push('TikTok Events Destination', 'Google Ads Destination');

    return list;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!creating) { onOpenChange(v); if (!v) resetState(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>NexusTrack Setup Wizard</DialogTitle>
          <DialogDescription>We'll help you set up the perfect tracking configuration</DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">What best describes you?</p>
            {personas.map((p) => {
              const Icon = p.icon;
              return (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-colors ${persona === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setPersona(p.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    {persona === p.id && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                  </CardContent>
                </Card>
              );
            })}
            <Button className="w-full mt-2" onClick={() => setStep(2)} disabled={!persona}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">What platform are you tracking?</p>
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-colors ${platform === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setPlatform(p.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    {platform === p.id && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!platform}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Where do you want to send events?</p>
            {goals.map((g) => (
              <Card
                key={g.id}
                className={`cursor-pointer transition-colors ${goal === g.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                onClick={() => setGoal(g.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{g.label}</p>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </div>
                  {goal === g.id && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(4)} disabled={!goal}>See Recommendation</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-3">Recommended Tracking Pipeline</h4>
                <div className="flex flex-wrap gap-1.5">
                  {getRecommendation().map((node, i) => (
                    <Badge key={i} variant="outline" className="bg-primary/10 text-primary">{node}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  We'll create a workflow with these nodes pre-connected and open it in the editor for you.
                </p>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)} disabled={creating}>Back</Button>
              <Button className="flex-1" onClick={complete} disabled={creating}>
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-1" /> Create Workflow</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
