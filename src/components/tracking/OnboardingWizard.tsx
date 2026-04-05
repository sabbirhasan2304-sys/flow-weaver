import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShoppingBag, Globe, Code, Building2, Users, Briefcase, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

export function OnboardingWizard({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<Persona>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [goal, setGoal] = useState<Goal>(null);

  const progress = ((step - 1) / 3) * 100;

  const complete = () => {
    toast.success('Setup complete! Redirecting to workflow editor...');
    onOpenChange(false);
    setStep(1);
    navigate('/dashboard');
  };

  const getRecommendation = () => {
    const nodes: string[] = [];
    if (platform === 'shopify') nodes.push('Shopify Source');
    else if (platform === 'woocommerce') nodes.push('WooCommerce Source');
    else nodes.push('Web Pixel Source');

    nodes.push('PII Anonymizer', 'Bot Filter', 'Cookie Recovery');

    if (goal === 'meta' || goal === 'both' || goal === 'all') nodes.push('Meta CAPI Destination');
    if (goal === 'ga4' || goal === 'both' || goal === 'all') nodes.push('GA4 Destination');
    if (goal === 'all') { nodes.push('TikTok Events Destination', 'Google Ads Destination'); }

    return nodes;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  We'll create a workflow with these nodes pre-connected. You can customize it later in the workflow editor.
                </p>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
              <Button className="flex-1" onClick={complete}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Create Workflow
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
