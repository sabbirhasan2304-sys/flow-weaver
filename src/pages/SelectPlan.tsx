import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription, Plan } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Zap, Check, Crown, Rocket, Building, 
  ArrowRight, Sparkles, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SelectPlan() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { plans, subscription, loading: subscriptionLoading, refetch } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Don't redirect - always allow users to see the plan selection page
    // They can choose to change plans or go back to dashboard
  }, [user, authLoading, navigate]);

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Free': return <Zap className="h-6 w-6" />;
      case 'Starter': return <Rocket className="h-6 w-6" />;
      case 'Pro': return <Crown className="h-6 w-6" />;
      case 'Enterprise': return <Building className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    if (currency === 'BDT') return `৳${price.toLocaleString()}`;
    return `$${price}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!profile?.id) {
      toast.error('Please log in first');
      return;
    }

    setSelectingPlan(plan.id);

    try {
      // Check if user already has a subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (existingSub) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: plan.price_monthly === 0 ? 'active' : 'active', // Free plan is immediately active
            billing_cycle: billingCycle,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            trial_ends_at: null, // Clear trial since they selected a plan
          })
          .eq('id', existingSub.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            profile_id: profile.id,
            plan_id: plan.id,
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (error) throw error;
      }

      toast.success(`Successfully subscribed to ${plan.name} plan!`);
      await refetch();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      toast.error(error.message || 'Failed to select plan. Please try again.');
    } finally {
      setSelectingPlan(null);
    }
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

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold text-foreground">BiztoriBD</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select a plan to start building powerful automation workflows. 
              You can upgrade or change plans anytime.
            </p>
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save 17%</Badge>
          </Button>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const isPopular = plan.name === 'Pro';
            const isFree = plan.price_monthly === 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card 
                  className={cn(
                    'relative h-full flex flex-col',
                    isPopular && 'border-primary ring-2 ring-primary/20'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getPlanIcon(plan.name)}
                      </div>
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {plan.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div>
                      <span className="text-4xl font-bold">
                        {formatPrice(price, plan.currency)}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {plan.limits.workflows_limit === -1 
                            ? 'Unlimited workflows' 
                            : `${plan.limits.workflows_limit} workflows`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {plan.limits.executions_per_month === -1 
                            ? 'Unlimited executions' 
                            : `${plan.limits.executions_per_month.toLocaleString()} executions/mo`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {plan.limits.ai_credits === 0 
                            ? 'Pay-per-use AI' 
                            : `${formatNumber(plan.limits.ai_credits)} AI credits`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {plan.limits.team_members === -1 
                            ? 'Unlimited team members' 
                            : `${plan.limits.team_members} team member${plan.limits.team_members > 1 ? 's' : ''}`}
                        </span>
                      </li>
                      {plan.limits.custom_nodes && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>Custom nodes</span>
                        </li>
                      )}
                      {plan.features.priority_support && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>Priority support</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full gap-2" 
                      variant={isPopular ? 'default' : isFree ? 'secondary' : 'outline'}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={selectingPlan !== null}
                    >
                      {selectingPlan === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        <>
                          {isFree ? 'Get Started Free' : `Choose ${plan.name}`}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>All plans include a 14-day free trial. Cancel anytime.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
