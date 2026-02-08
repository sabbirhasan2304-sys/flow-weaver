import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSubscription, Plan } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useCredits, CREDIT_PACKAGES, AI_CREDIT_COSTS } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, Check, Zap, Crown, Rocket, 
  Clock, AlertCircle, Receipt, ArrowRight,
  Wallet, Building, Sparkles, TrendingUp,
  DollarSign, Activity, Cloud, Coins, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// AI pricing per 1K tokens (in BDT)
const AI_PRICE_PER_1K_TOKENS = 0.25; // ৳0.25 per 1K tokens
const EXECUTION_PRICE = 0.12; // ৳0.12 per execution
const STORAGE_PRICE_PER_MB = 0.012; // ৳0.012 per MB

interface UsageBilling {
  aiTokensUsed: number;
  aiCost: number;
  executionsCount: number;
  executionsCost: number;
  storageBytesUsed: number;
  storageCost: number;
  totalCost: number;
}

export default function Billing() {
  const { profile } = useAuth();
  const { subscription, plans, usage, loading, getDaysRemaining, getUsagePercentage, refetch } = useSubscription();
  const { credits, loading: creditsLoading, addCredits, refetch: refetchCredits } = useCredits();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [usageBilling, setUsageBilling] = useState<UsageBilling>({
    aiTokensUsed: 0,
    aiCost: 0,
    executionsCount: 0,
    executionsCost: 0,
    storageBytesUsed: 0,
    storageCost: 0,
    totalCost: 0,
  });

  const handleChangePlan = async (plan: Plan) => {
    if (!profile?.id) {
      toast.error('Please log in first');
      return;
    }

    setChangingPlan(plan.id);

    try {
      // Check if user already has a subscription in the database
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
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            trial_ends_at: null,
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

      toast.success(`Successfully changed to ${plan.name} plan!`);
      await refetch();
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast.error(error.message || 'Failed to change plan. Please try again.');
    } finally {
      setChangingPlan(null);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchUsageBilling();
    }
  }, [profile?.id]);

  const fetchUsageBilling = async () => {
    if (!profile?.id) return;

    // Fetch all usage data for this user
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('ai_tokens_used, executions_count, storage_bytes_used')
      .eq('profile_id', profile.id);

    let totalAiTokens = 0;
    let totalExecutions = 0;
    let totalStorage = 0;

    if (usageData) {
      usageData.forEach((u) => {
        totalAiTokens += u.ai_tokens_used || 0;
        totalExecutions += u.executions_count || 0;
        totalStorage += u.storage_bytes_used || 0;
      });
    }

    const aiCost = (totalAiTokens / 1000) * AI_PRICE_PER_1K_TOKENS;
    const executionsCost = totalExecutions * EXECUTION_PRICE;
    const storageMB = totalStorage / (1024 * 1024);
    const storageCost = storageMB * STORAGE_PRICE_PER_MB;
    const totalCost = aiCost + executionsCost + storageCost;

    setUsageBilling({
      aiTokensUsed: totalAiTokens,
      aiCost,
      executionsCount: totalExecutions,
      executionsCost,
      storageBytesUsed: totalStorage,
      storageCost,
      totalCost,
    });
  };

  const handlePurchaseCredits = async (packageId: string) => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return;

    setPurchasingPackage(packageId);
    try {
      // In production, this would go through payment gateway first
      const success = await addCredits(pkg.credits, `Purchased ${pkg.name} package (${pkg.credits} credits)`);
      if (success) {
        toast.success(`Successfully added ${pkg.credits} AI credits!`);
        refetchCredits();
      } else {
        toast.error('Failed to add credits. Please try again.');
      }
    } catch (error) {
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasingPackage(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      active: { variant: 'default', label: 'Active' },
      trial: { variant: 'secondary', label: 'Trial' },
      canceled: { variant: 'destructive', label: 'Canceled' },
      past_due: { variant: 'destructive', label: 'Past Due' },
      paused: { variant: 'outline', label: 'Paused' },
    };
    const { variant, label } = config[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading || creditsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Billing & Usage
          </h1>
          <p className="text-muted-foreground mt-1">
            Pay only for what you use - AI tokens, executions, and storage
          </p>
        </div>

        {/* AI Credits Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-amber-500/20">
                    <Coins className="h-10 w-10 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">AI Credits Balance</h3>
                    <p className="text-sm text-muted-foreground">
                      Use platform AI by adding credits to your account
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-amber-500">
                    {credits?.balance?.toFixed(1) || '0'}
                  </div>
                  <p className="text-sm text-muted-foreground">credits available</p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">Total Purchased:</span>
                    <span className="font-medium">{credits?.total_purchased?.toFixed(1) || '0'}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">Total Used:</span>
                    <span className="font-medium">{credits?.total_used?.toFixed(1) || '0'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Credit Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add AI Credits
              </h2>
              <p className="text-sm text-muted-foreground">
                Purchase credits to use platform AI features
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card 
                key={pkg.id}
                className={cn(
                  "relative transition-all hover:border-primary/50",
                  pkg.popular && "border-primary ring-2 ring-primary/20"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80">
                      Best Value
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.credits} AI Credits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    ৳{pkg.price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1">BDT</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ৳{(pkg.price / pkg.credits).toFixed(0)} per credit
                  </div>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {Math.floor(pkg.credits / AI_CREDIT_COSTS.chat)} AI chat messages
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {Math.floor(pkg.credits / AI_CREDIT_COSTS.workflow_generation)} workflow generations
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full gap-2" 
                    variant={pkg.popular ? "default" : "outline"}
                    onClick={() => handlePurchaseCredits(pkg.id)}
                    disabled={purchasingPackage === pkg.id}
                  >
                    {purchasingPackage === pkg.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4" />
                        Buy Credits
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Credit Usage Info */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium">How AI Credits Work</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>{AI_CREDIT_COSTS.chat}</strong> credits per AI chat message</li>
                    <li>• <strong>{AI_CREDIT_COSTS.workflow_generation}</strong> credit per AI-generated workflow</li>
                    <li>• <strong>{AI_CREDIT_COSTS.analysis}</strong> credits per AI analysis/debugging</li>
                    <li>• Credits never expire and can be used for any AI feature</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage-Based Billing Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* AI Usage Card */}
          <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Usage</CardTitle>
                  <CardDescription className="text-xs">Platform AI tokens</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                      {formatNumber(usageBilling.aiTokensUsed)}
                    </div>
                    <div className="text-xs text-muted-foreground">tokens used</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold">৳{usageBilling.aiCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">cost</div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <div className="text-xs text-muted-foreground">Rate: ৳{AI_PRICE_PER_1K_TOKENS} / 1K tokens</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executions Card */}
          <Card className="border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10">
                  <Activity className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Executions</CardTitle>
                  <CardDescription className="text-xs">Workflow runs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                      {formatNumber(usageBilling.executionsCount)}
                    </div>
                    <div className="text-xs text-muted-foreground">executions</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold">৳{usageBilling.executionsCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">cost</div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                  <div className="text-xs text-muted-foreground">Rate: ৳{EXECUTION_PRICE} / execution</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Card */}
          <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <Cloud className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Storage</CardTitle>
                  <CardDescription className="text-xs">Cloud storage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(usageBilling.storageBytesUsed)}
                    </div>
                    <div className="text-xs text-muted-foreground">used</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold">৳{usageBilling.storageCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">cost</div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-xs text-muted-foreground">Rate: ৳{STORAGE_PRICE_PER_MB} / MB</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Bill Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Current Usage Bill</h3>
                    <p className="text-sm text-muted-foreground">Based on your actual AI and Cloud usage</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-4xl font-bold text-primary">৳{usageBilling.totalCost.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">This billing period</p>
                </div>
                <Button size="lg" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </Button>
              </div>
              
              {/* Breakdown */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-muted-foreground">AI Tokens</span>
                    <span className="font-medium">৳{usageBilling.aiCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-muted-foreground">Executions</span>
                    <span className="font-medium">৳{usageBilling.executionsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium">৳{usageBilling.storageCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {subscription?.plan ? getPlanIcon(subscription.plan.name) : <Zap className="h-6 w-6" />}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {subscription?.plan?.name || 'No Plan'} Plan
                    {subscription && getStatusBadge(subscription.status)}
                  </CardTitle>
                  <CardDescription>
                    {subscription?.plan?.description || 'Select a plan for base features + pay for AI usage'}
                  </CardDescription>
                </div>
              </div>
              {subscription?.status === 'trial' && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{getDaysRemaining()} days left in trial</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Included Executions</span>
                  <span className="font-medium">
                    {usage?.executions_count || 0} / {subscription?.plan?.limits.executions_per_month === -1 ? '∞' : subscription?.plan?.limits.executions_per_month || 100}
                  </span>
                </div>
                <Progress value={getUsagePercentage('executions')} className="h-2" />
                <p className="text-xs text-muted-foreground">Extra executions billed at ${EXECUTION_PRICE}/each</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Included AI Credits</span>
                  <span className="font-medium">
                    {formatNumber(usage?.ai_tokens_used || 0)} / {formatNumber(subscription?.plan?.limits.ai_credits || 0)}
                  </span>
                </div>
                <Progress value={getUsagePercentage('ai_tokens')} className="h-2" />
                <p className="text-xs text-muted-foreground">Extra tokens billed at ${AI_PRICE_PER_1K_TOKENS}/1K</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Workflows</span>
                  <span className="font-medium">
                    - / {subscription?.plan?.limits.workflows_limit === -1 ? '∞' : subscription?.plan?.limits.workflows_limit || 5}
                  </span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>

            {/* Billing Info */}
            {subscription?.status === 'active' && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Next billing date</p>
                  <p className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <Button variant="outline">Manage Billing</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plans */}
        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Available Plans</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
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
            </div>

            {/* Credit-Based Pricing Note */}
            <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Credit-Based AI Pricing</p>
                <p className="text-sm text-muted-foreground">
                  Plans include base features + AI credits. Need more? Purchase credit packages above. 1 credit = 1 AI message.
                </p>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isCurrentPlan = subscription?.plan?.id === plan.id;
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={cn(
                      'relative',
                      isCurrentPlan && 'border-primary ring-2 ring-primary/20'
                    )}
                  >
                    {plan.name === 'Pro' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-primary to-primary/80">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getPlanIcon(plan.name)}
                        </div>
                        <CardTitle>{plan.name}</CardTitle>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-3xl font-bold">
                          {formatPrice(price, plan.currency)}
                        </span>
                        {price > 0 && (
                          <span className="text-muted-foreground">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">+ AI usage</p>
                      </div>

                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.limits.executions_per_month === -1 
                            ? 'Unlimited executions' 
                            : `${plan.limits.executions_per_month.toLocaleString()} free executions`}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.limits.ai_credits === 0 
                            ? 'Pay-per-use AI' 
                            : `${formatNumber(plan.limits.ai_credits)} free AI tokens`}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.limits.workflows_limit === -1 
                            ? 'Unlimited workflows' 
                            : `${plan.limits.workflows_limit} workflows`}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.limits.team_members === -1 
                            ? 'Unlimited team members' 
                            : `${plan.limits.team_members} team member${plan.limits.team_members > 1 ? 's' : ''}`}
                        </li>
                        {plan.limits.custom_nodes && (
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            Custom nodes
                          </li>
                        )}
                        {plan.features.priority_support && (
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            Priority support
                          </li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isCurrentPlan ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          variant={plan.name === 'Pro' ? 'default' : 'outline'}
                          onClick={() => handleChangePlan(plan)}
                          disabled={changingPlan !== null}
                        >
                          {changingPlan === plan.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              {price === 0 ? 'Downgrade' : 'Upgrade'}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>View your past invoices and usage payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-4" />
                  <p>No payment history yet</p>
                  <p className="text-sm">Your invoices will appear here after your first payment</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Manage your payment options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="w-16 h-16 bg-[#E2136E]/10 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-2xl font-bold text-[#E2136E]">bKash</span>
                      </div>
                      <p className="font-medium">bKash</p>
                      <p className="text-sm text-muted-foreground">Mobile wallet</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="w-16 h-16 bg-[#F6921E]/10 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-xl font-bold text-[#F6921E]">Nagad</span>
                      </div>
                      <p className="font-medium">Nagad</p>
                      <p className="text-sm text-muted-foreground">Mobile wallet</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                      <p className="font-medium">Card / Bank</p>
                      <p className="text-sm text-muted-foreground">SSLCommerz</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a payment method when upgrading your plan. We support bKash, Nagad, and cards via SSLCommerz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
