import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSubscription, Plan } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, Check, Zap, Crown, Rocket, 
  Clock, AlertCircle, Receipt, ArrowRight,
  Wallet, Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Billing() {
  const { subscription, plans, usage, loading, getDaysRemaining, getUsagePercentage } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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

  if (loading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription plan and payment methods
          </p>
        </div>

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
                    {subscription?.plan?.description || 'Select a plan to get started'}
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
                  <span className="text-muted-foreground">Executions</span>
                  <span className="font-medium">
                    {usage?.executions_count || 0} / {subscription?.plan?.limits.executions_per_month === -1 ? '∞' : subscription?.plan?.limits.executions_per_month || 100}
                  </span>
                </div>
                <Progress value={getUsagePercentage('executions')} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Credits</span>
                  <span className="font-medium">
                    {usage?.ai_tokens_used || 0} / {subscription?.plan?.limits.ai_credits || 0}
                  </span>
                </div>
                <Progress value={getUsagePercentage('ai_tokens')} className="h-2" />
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
                      </div>

                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.limits.executions_per_month === -1 
                            ? 'Unlimited executions' 
                            : `${plan.limits.executions_per_month.toLocaleString()} executions/mo`}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.limits.workflows_limit === -1 
                            ? 'Unlimited workflows' 
                            : `${plan.limits.workflows_limit} workflows`}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plan.limits.ai_credits === 0 
                            ? 'No AI credits' 
                            : `${plan.limits.ai_credits.toLocaleString()} AI credits`}
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
                        {plan.features.sso && (
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            SSO / SAML
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
                        >
                          {price === 0 ? 'Downgrade' : 'Upgrade'}
                          <ArrowRight className="ml-2 h-4 w-4" />
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
                <CardDescription>View your past invoices and payments</CardDescription>
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
