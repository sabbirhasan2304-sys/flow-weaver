import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription, Plan } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Zap, Check, Crown, Rocket, Building, 
  ArrowRight, Sparkles, Loader2, Radio, Package, Globe,
  Activity, Eye, Filter, Shield, MapPin, Cloud, Coins, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanCategory = 'workflow' | 'tracking' | 'bundle';

const getPlanIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('enterprise')) return Building;
  if (n.includes('business')) return Globe;
  if (n.includes('pro')) return Crown;
  if (n.includes('starter')) return Rocket;
  if (n.includes('bundle')) return Package;
  return Zap;
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

export default function SelectPlan() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { plans, subscription, loading: subscriptionLoading, refetch } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PlanCategory>('workflow');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
  }, [user, authLoading, navigate]);

  const getCategoryPlans = (category: PlanCategory) =>
    plans.filter(p => (p.features as any)?.plan_category === category);

  const handleSelectPlan = async (plan: Plan) => {
    if (!profile?.id) { toast.error('Please log in first'); return; }
    setSelectingPlan(plan.id);
    try {
      const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('profile_id', profile.id).maybeSingle();
      const subData = {
        plan_id: plan.id, status: 'active' as const, billing_cycle: billingCycle,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: null,
      };
      if (existingSub) {
        const { error } = await supabase.from('subscriptions').update(subData).eq('id', existingSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subscriptions').insert({ profile_id: profile.id, ...subData });
        if (error) throw error;
      }
      toast.success(`Successfully subscribed to ${plan.name}!`);
      await refetch();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      toast.error(error.message || 'Failed to select plan.');
    } finally { setSelectingPlan(null); }
  };

  const renderFeatures = (plan: Plan, category: PlanCategory) => {
    const limits = plan.limits as any;
    const features = plan.features as any;

    if (category === 'tracking') return (
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.events_per_month)} events/mo</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.destinations)} destinations</li>
        {limits.cookie_recovery && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />Cookie recovery</li>}
        {limits.bot_filter && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />Bot filtering</li>}
        {limits.pii_anonymizer && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />PII anonymizer</li>}
        {limits.dedicated_ip && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />Dedicated IP</li>}
        {features.white_label && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />White-label</li>}
      </ul>
    );

    if (category === 'bundle') return (
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.workflows_limit)} workflows</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.executions_per_month)} executions/mo</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.events_per_month)} events/mo</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.destinations)} destinations</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.ai_credits)} AI credits</li>
        {features.bundle_discount && (
          <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Save {features.bundle_discount}%</span>
          </li>
        )}
      </ul>
    );

    return (
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.workflows_limit)} workflows</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.executions_per_month)} executions/mo</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.ai_credits)} AI credits</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />{formatLimit(limits.team_members)} team members</li>
        {limits.custom_nodes && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />Custom nodes</li>}
        {features.priority_support && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary flex-shrink-0" />Priority support</li>}
      </ul>
    );
  };

  const getPopularName = (category: PlanCategory) => {
    if (category === 'workflow') return 'Pro';
    if (category === 'tracking') return 'Tracking Pro';
    return 'Pro Bundle';
  };

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  const renderPlanCards = (category: PlanCategory) => {
    const catPlans = getCategoryPlans(category);
    const cols = category === 'tracking' ? 'lg:grid-cols-5' : category === 'bundle' ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-6`}>
        {catPlans.map((plan, index) => {
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const isPopular = plan.name === getPopularName(category);
          const isFree = plan.price_monthly === 0;
          const PlanIcon = getPlanIcon(plan.name);

          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
              <Card className={cn('relative h-full flex flex-col', isPopular && 'border-primary ring-2 ring-primary/20')}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><PlanIcon className="h-6 w-6" /></div>
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <span className="text-4xl font-bold">{formatPrice(price, plan.currency)}</span>
                    {price > 0 && <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>}
                    {price > 0 && plan.currency === 'BDT' && (
                      <p className="text-xs text-muted-foreground mt-1">(~${Math.round(price / 127)}/{billingCycle === 'monthly' ? 'mo' : 'yr'})</p>
                    )}
                  </div>
                  {renderFeatures(plan, category)}
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" variant={isPopular ? 'default' : isFree ? 'secondary' : 'outline'} onClick={() => handleSelectPlan(plan)} disabled={selectingPlan !== null}>
                    {selectingPlan === plan.id ? (<><Loader2 className="h-4 w-4 animate-spin" />Selecting...</>) : (<>{isFree ? 'Get Started Free' : `Choose ${plan.name}`}<ArrowRight className="h-4 w-4" /></>)}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold text-foreground">BiztoriBD</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select a plan to start building powerful automation workflows or tracking infrastructure.
            </p>
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-4 mb-8">
          <Button variant={billingCycle === 'monthly' ? 'default' : 'outline'} onClick={() => setBillingCycle('monthly')}>Monthly</Button>
          <Button variant={billingCycle === 'yearly' ? 'default' : 'outline'} onClick={() => setBillingCycle('yearly')}>
            Yearly<Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </Button>
        </motion.div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlanCategory)} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger value="workflow" className="gap-2"><Zap className="h-4 w-4" />Workflows</TabsTrigger>
              <TabsTrigger value="tracking" className="gap-2"><Radio className="h-4 w-4" />Tracking</TabsTrigger>
              <TabsTrigger value="bundle" className="gap-2"><Package className="h-4 w-4" />Bundles</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="workflow">{renderPlanCards('workflow')}</TabsContent>
          <TabsContent value="tracking">{renderPlanCards('tracking')}</TabsContent>
          <TabsContent value="bundle">{renderPlanCards('bundle')}</TabsContent>
        </Tabs>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>All plans include a 14-day free trial. Cancel anytime.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
