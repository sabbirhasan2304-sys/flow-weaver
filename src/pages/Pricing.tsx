import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Zap, Check, ArrowRight, Sparkles, Crown,
  Users, Infinity, Bot, Headphones, Shield,
  Rocket, Building, Activity, Cloud, Coins,
  LayoutDashboard, Settings, X, Minus,
  Radio, Package, Globe, Eye, Filter, MapPin
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Record<string, any>;
  limits: Record<string, any>;
}

type PlanCategory = 'workflow' | 'tracking' | 'bundle';

const getCategoryPlans = (plans: Plan[], category: PlanCategory) =>
  plans.filter(p => p.features?.plan_category === category);

const getPlanIcon = (planName: string) => {
  const n = planName.toLowerCase();
  if (n.includes('enterprise')) return Building;
  if (n.includes('business')) return Globe;
  if (n.includes('pro')) return Crown;
  if (n.includes('starter')) return Rocket;
  if (n.includes('bundle')) return Package;
  return Zap;
};

const getPlanGradient = (planName: string) => {
  const n = planName.toLowerCase();
  if (n.includes('enterprise')) return 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20';
  if (n.includes('business')) return 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20';
  if (n.includes('pro')) return 'from-primary/10 via-primary/5 to-transparent border-primary/30';
  if (n.includes('starter')) return 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20';
  return 'from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20';
};

const getPlanIconColor = (planName: string) => {
  const n = planName.toLowerCase();
  if (n.includes('enterprise')) return 'text-amber-500 bg-amber-500/10';
  if (n.includes('business')) return 'text-purple-500 bg-purple-500/10';
  if (n.includes('pro')) return 'text-primary bg-primary/10';
  if (n.includes('starter')) return 'text-blue-500 bg-blue-500/10';
  return 'text-slate-500 bg-slate-500/10';
};

const formatPrice = (price: number, currency: string) => {
  if (price === 0) return 'Free';
  if (currency === 'BDT') return `৳${price.toLocaleString()}`;
  return `$${price}`;
};

const formatLimit = (value: number) => {
  if (value === -1) return 'Unlimited';
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
};

function WorkflowFeatureList({ plan }: { plan: Plan }) {
  return (
    <ul className="space-y-3">
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Activity className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.executions_per_month)} executions/mo</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Zap className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.workflows_limit)} workflows</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Coins className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.ai_credits)} AI credits</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.team_members)} team members</span>
      </li>
      {plan.limits.custom_nodes && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <span>Custom nodes</span>
        </li>
      )}
      {plan.features.priority_support && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Headphones className="h-3 w-3 text-primary" />
          </div>
          <span>Priority support</span>
        </li>
      )}
    </ul>
  );
}

function TrackingFeatureList({ plan }: { plan: Plan }) {
  return (
    <ul className="space-y-3">
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Radio className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.events_per_month)} events/mo</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Globe className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.destinations)} destinations</span>
      </li>
      {plan.limits.cookie_recovery && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Eye className="h-3 w-3 text-primary" />
          </div>
          <span>Cookie recovery</span>
        </li>
      )}
      {plan.limits.bot_filter && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Filter className="h-3 w-3 text-primary" />
          </div>
          <span>Bot filtering</span>
        </li>
      )}
      {plan.limits.pii_anonymizer && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-3 w-3 text-primary" />
          </div>
          <span>PII anonymizer</span>
        </li>
      )}
      {plan.limits.geo_enrichment && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-3 w-3 text-primary" />
          </div>
          <span>Geo enrichment</span>
        </li>
      )}
      {plan.limits.dedicated_ip && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Cloud className="h-3 w-3 text-primary" />
          </div>
          <span>Dedicated IP</span>
        </li>
      )}
      {plan.features.white_label && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <span>White-label</span>
        </li>
      )}
    </ul>
  );
}

function BundleFeatureList({ plan }: { plan: Plan }) {
  return (
    <ul className="space-y-3">
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Zap className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.workflows_limit)} workflows</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Activity className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.executions_per_month)} executions/mo</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Radio className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.events_per_month)} events/mo</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Globe className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.destinations)} destinations</span>
      </li>
      <li className="flex items-center gap-2 text-sm">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Coins className="h-3 w-3 text-primary" />
        </div>
        <span>{formatLimit(plan.limits.ai_credits)} AI credits</span>
      </li>
      {plan.features.bundle_discount && (
        <li className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3 w-3 text-emerald-500" />
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Save {plan.features.bundle_discount}% vs separate plans</span>
        </li>
      )}
    </ul>
  );
}

function PlanCard({ plan, isYearly, isPopular, onSelect, FeatureList }: {
  plan: Plan;
  isYearly: boolean;
  isPopular: boolean;
  onSelect: (plan: Plan) => void;
  FeatureList: React.FC<{ plan: Plan }>;
}) {
  const price = isYearly ? plan.price_yearly : plan.price_monthly;
  const PlanIcon = getPlanIcon(plan.name);
  const gradient = getPlanGradient(plan.name);
  const iconColor = getPlanIconColor(plan.name);

  return (
    <Card className={cn(
      "relative h-full flex flex-col bg-gradient-to-br transition-all hover:shadow-lg",
      gradient,
      isPopular && "ring-2 ring-primary shadow-lg shadow-primary/10"
    )}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <Crown className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-2.5 rounded-xl", iconColor)}>
            <PlanIcon className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
        </div>
        <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
        <div className="pt-4">
          <span className="text-4xl font-bold">{formatPrice(price, plan.currency)}</span>
          {price > 0 && (
            <span className="text-muted-foreground text-sm ml-1">/{isYearly ? 'year' : 'month'}</span>
          )}
          {price > 0 && plan.currency === 'BDT' && (
            <p className="text-xs text-muted-foreground mt-1">
              (~${Math.round(price / 127)}/{ isYearly ? 'yr' : 'mo'})
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <FeatureList plan={plan} />
      </CardContent>
      <CardFooter>
        <Button className="w-full gap-2" variant={isPopular ? 'default' : 'outline'} onClick={() => onSelect(plan)}>
          {price === 0 ? 'Start Free' : 'Get Started'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  const [activeTab, setActiveTab] = useState<PlanCategory>('workflow');

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order');
        if (error) throw error;
        setPlans((data || []).map(p => ({
          id: p.id, name: p.name, description: p.description,
          price_monthly: p.price_monthly, price_yearly: p.price_yearly, currency: p.currency,
          features: (p.features as Record<string, any>) || {},
          limits: (p.limits as Record<string, any>) || {},
        })));
      } catch (err) { console.error('Failed to fetch plans:', err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSelectPlan = (plan: Plan) => navigate(user ? '/billing' : '/auth');

  const workflowPlans = getCategoryPlans(plans, 'workflow');
  const trackingPlans = getCategoryPlans(plans, 'tracking');
  const bundlePlans = getCategoryPlans(plans, 'bundle');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">BiztoriBD</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild><Link to="/docs">Documentation</Link></Button>
            {authLoading ? (
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <>
                <Button variant="ghost" asChild><Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Link></Button>
                {isAdmin && <Button variant="outline" asChild><Link to="/admin"><Settings className="h-4 w-4 mr-2" />Admin</Link></Button>}
              </>
            ) : (
              <Button asChild><Link to="/auth">Get Started</Link></Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 border-b border-border">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />Simple, Transparent Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Choose the Right Plan for Your Business</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Workflow automation, server-side tracking, or both — pay only for what you use.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Label htmlFor="billing-toggle" className={cn("transition-colors", !isYearly ? 'font-semibold text-foreground' : 'text-muted-foreground')}>Monthly</Label>
              <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
              <Label htmlFor="billing-toggle" className={cn("transition-colors flex items-center gap-2", isYearly ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                Yearly
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Save 20%</Badge>
              </Label>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Usage-Based Summary */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: Sparkles, color: 'violet', label: 'AI Usage', sub: '৳0.25 / 1K tokens' },
              { icon: Activity, color: 'cyan', label: 'Executions', sub: '৳0.12 / execution' },
              { icon: Radio, color: 'orange', label: 'Tracking Events', sub: '৳0.0005 / event' },
              { icon: Cloud, color: 'emerald', label: 'Storage', sub: '৳0.012 / MB' },
            ].map(({ icon: Icon, color, label, sub }) => (
              <Card key={label} className={`border border-${color}-500/20 bg-gradient-to-br from-${color}-500/10 via-${color}-500/5 to-transparent`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-${color}-500/10`}><Icon className={`h-5 w-5 text-${color}-500`} /></div>
                    <div><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tabs */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlanCategory)} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-3 w-full max-w-lg">
                <TabsTrigger value="workflow" className="gap-2"><Zap className="h-4 w-4" />Workflows</TabsTrigger>
                <TabsTrigger value="tracking" className="gap-2"><Radio className="h-4 w-4" />Tracking</TabsTrigger>
                <TabsTrigger value="bundle" className="gap-2"><Package className="h-4 w-4" />Bundles</TabsTrigger>
              </TabsList>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="workflow">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">Workflow Automation</h2>
                    <p className="text-muted-foreground">Visual workflow builder with 200+ integrations — like n8n, but made for Bangladesh</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {workflowPlans.map((plan, i) => (
                      <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <PlanCard plan={plan} isYearly={isYearly} isPopular={plan.name === 'Pro'} onSelect={handleSelectPlan} FeatureList={WorkflowFeatureList} />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tracking">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">NexusTrack — Server-Side Tracking</h2>
                    <p className="text-muted-foreground">First-party data collection like Stape.io — 10x more events at similar price</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
                    {trackingPlans.map((plan, i) => (
                      <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <PlanCard plan={plan} isYearly={isYearly} isPopular={plan.name === 'Tracking Pro'} onSelect={handleSelectPlan} FeatureList={TrackingFeatureList} />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="bundle">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">All-in-One Bundles</h2>
                    <p className="text-muted-foreground">Workflow automation + server-side tracking together — save 20-30%</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {bundlePlans.map((plan, i) => (
                      <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <PlanCard plan={plan} isYearly={isYearly} isPopular={plan.name === 'Pro Bundle'} onSelect={handleSelectPlan} FeatureList={BundleFeatureList} />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">All Plans Include</h2>
          <p className="text-center text-muted-foreground mb-12">Everything you need to automate your business</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Secure & Reliable', description: 'Enterprise-grade security with 99.9% uptime guarantee' },
              { icon: Bot, title: 'AI-Powered', description: 'Built-in AI assistant to help build workflows faster' },
              { icon: Infinity, title: '200+ Integrations', description: 'Connect with popular apps and services worldwide' },
            ].map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card className="text-center h-full">
                  <CardContent className="pt-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison — Workflow */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20"><Sparkles className="h-3 w-3 mr-1" />Why BiztoriBD?</Badge>
            <h2 className="text-3xl font-bold mb-3">Workflow Automation Comparison</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">See why BiztoriBD is the best value automation platform for South Asian businesses.</p>
          </motion.div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px] font-semibold">Feature</TableHead>
                    <TableHead className="text-center"><span className="font-bold text-primary">BiztoriBD</span></TableHead>
                    <TableHead className="text-center"><span className="font-semibold text-muted-foreground">Zapier</span></TableHead>
                    <TableHead className="text-center"><span className="font-semibold text-muted-foreground">Make</span></TableHead>
                    <TableHead className="text-center"><span className="font-semibold text-muted-foreground">n8n</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { feature: "Starter price", biz: "৳1,905/mo (~$15)", zapier: "$29.99/mo", make: "$10.59/mo", n8n: "$24/mo" },
                    { feature: "Pro price", biz: "৳5,080/mo (~$40)", zapier: "$73.50/mo", make: "$18.82/mo", n8n: "$60/mo" },
                    { feature: "Bangladesh payments", biz: true, zapier: false, make: false, n8n: false },
                    { feature: "bKash / Nagad nodes", biz: true, zapier: false, make: false, n8n: false },
                    { feature: "AI workflow builder", biz: true, zapier: "Limited", make: false, n8n: false },
                    { feature: "Server-side tracking", biz: true, zapier: false, make: false, n8n: false },
                    { feature: "Email marketing built-in", biz: true, zapier: false, make: false, n8n: false },
                    { feature: "Agency dashboard", biz: true, zapier: false, make: "Enterprise", n8n: false },
                    { feature: "BDT pricing", biz: true, zapier: false, make: false, n8n: false },
                  ].map((row, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                      <TableCell className="font-medium text-sm">{row.feature}</TableCell>
                      {[row.biz, row.zapier, row.make, row.n8n].map((val, j) => (
                        <TableCell key={j} className="text-center">
                          {val === true ? <Check className={`h-5 w-5 mx-auto ${j === 0 ? 'text-primary' : 'text-green-500'}`} />
                          : val === false ? <X className="h-5 w-5 mx-auto text-muted-foreground/40" />
                          : <span className={`text-xs font-medium ${j === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{val}</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </section>

      {/* Competitor Comparison — Tracking */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20"><Radio className="h-3 w-3 mr-1" />Tracking Comparison</Badge>
            <h2 className="text-3xl font-bold mb-3">NexusTrack vs Competitors</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">10x more tracking events at competitive prices.</p>
          </motion.div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px] font-semibold">Feature</TableHead>
                    <TableHead className="text-center"><span className="font-bold text-primary">NexusTrack</span></TableHead>
                    <TableHead className="text-center"><span className="font-semibold text-muted-foreground">Stape.io</span></TableHead>
                    <TableHead className="text-center"><span className="font-semibold text-muted-foreground">Addingwell</span></TableHead>
                    <TableHead className="text-center"><span className="font-semibold text-muted-foreground">Self-host GTM</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { feature: "Free tier events", biz: "10K/mo", stape: "10K/mo", adding: "None", self: "Unlimited*" },
                    { feature: "Pro price", biz: "৳2,540/mo (~$20)", stape: "$17/mo", adding: "€58/mo", self: "~$30/mo" },
                    { feature: "Pro events", biz: "5M/mo", stape: "500K/mo", adding: "5M/mo", self: "Depends on infra" },
                    { feature: "Cookie recovery", biz: true, stape: true, adding: true, self: false },
                    { feature: "Bot filtering", biz: true, stape: true, adding: true, self: false },
                    { feature: "PII anonymizer", biz: true, stape: "Enterprise", adding: true, self: false },
                    { feature: "Meta CAPI", biz: true, stape: "$8/pixel", adding: true, self: "Manual" },
                    { feature: "No DevOps required", biz: true, stape: true, adding: true, self: false },
                    { feature: "BDT pricing", biz: true, stape: false, adding: false, self: false },
                    { feature: "Workflow integration", biz: true, stape: false, adding: false, self: false },
                  ].map((row, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                      <TableCell className="font-medium text-sm">{row.feature}</TableCell>
                      {[row.biz, row.stape, row.adding, row.self].map((val, j) => (
                        <TableCell key={j} className="text-center">
                          {val === true ? <Check className={`h-5 w-5 mx-auto ${j === 0 ? 'text-primary' : 'text-green-500'}`} />
                          : val === false ? <X className="h-5 w-5 mx-auto text-muted-foreground/40" />
                          : <span className={`text-xs font-medium ${j === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{val}</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 bg-primary/5 border-t text-center">
              <p className="text-sm text-muted-foreground">
                * Self-hosted GTM requires Cloud Run / GCP setup and ongoing DevOps. Prices as of April 2026.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Business?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of businesses in Bangladesh using BiztoriBD to streamline their operations.</p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild><Link to="/auth">Start Your Free Trial<ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/docs">Read Documentation</Link></Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 BiztoriBD. All rights reserved. | <Link to="/docs" className="hover:text-foreground">Documentation</Link> | <Link to="/pricing" className="hover:text-foreground">Pricing</Link></p>
        </div>
      </footer>
    </div>
  );
}
