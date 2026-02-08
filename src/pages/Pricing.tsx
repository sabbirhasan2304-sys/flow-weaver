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
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Zap, Check, ArrowRight, Sparkles, Crown,
  Users, Infinity, Bot, Headphones, Shield,
  Rocket, Building, Activity, Cloud, Coins,
  LayoutDashboard, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Record<string, boolean>;
  limits: {
    executions_per_month: number;
    workflows_limit: number;
    ai_credits: number;
    custom_nodes: boolean;
    team_members: number;
  };
}

const getPlanIcon = (planName: string) => {
  switch (planName.toLowerCase()) {
    case 'free': return Zap;
    case 'starter': return Rocket;
    case 'pro': return Crown;
    case 'enterprise': return Building;
    default: return Zap;
  }
};

const getPlanGradient = (planName: string) => {
  switch (planName.toLowerCase()) {
    case 'free': return 'from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20';
    case 'starter': return 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20';
    case 'pro': return 'from-primary/10 via-primary/5 to-transparent border-primary/30';
    case 'enterprise': return 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20';
    default: return 'from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20';
  }
};

const getPlanIconColor = (planName: string) => {
  switch (planName.toLowerCase()) {
    case 'free': return 'text-slate-500 bg-slate-500/10';
    case 'starter': return 'text-blue-500 bg-blue-500/10';
    case 'pro': return 'text-primary bg-primary/10';
    case 'enterprise': return 'text-amber-500 bg-amber-500/10';
    default: return 'text-slate-500 bg-slate-500/10';
  }
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      const transformedPlans: Plan[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        currency: p.currency,
        features: (p.features as Record<string, boolean>) || {},
        limits: (p.limits as Plan['limits']) || {
          executions_per_month: 100,
          workflows_limit: 5,
          ai_credits: 0,
          custom_nodes: false,
          team_members: 1,
        },
      }));
      setPlans(transformedPlans);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    if (currency === 'BDT') return `৳${price.toLocaleString()}`;
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  };

  const handleSelectPlan = (plan: Plan) => {
    if (user) {
      navigate('/billing');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">BiztoriBD</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/docs">Documentation</Link>
            </Button>
            {authLoading ? (
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" asChild>
                    <Link to="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 border-b border-border">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Choose the Right Plan for Your Business
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Start free, scale as you grow. Pay only for what you use with our flexible pricing.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <Label htmlFor="billing-toggle" className={cn("transition-colors", !isYearly ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <Label htmlFor="billing-toggle" className={cn("transition-colors flex items-center gap-2", isYearly ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                Yearly
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  Save 20%
                </Badge>
              </Label>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Usage-Based Summary */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-semibold">AI Usage</p>
                    <p className="text-xs text-muted-foreground">৳0.25 / 1K tokens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10">
                    <Activity className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Executions</p>
                    <p className="text-xs text-muted-foreground">৳0.12 / execution</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <Cloud className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Storage</p>
                    <p className="text-xs text-muted-foreground">৳0.012 / MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const isPopular = plan.name.toLowerCase() === 'pro';
                const price = isYearly ? plan.price_yearly : plan.price_monthly;
                const PlanIcon = getPlanIcon(plan.name);
                const gradient = getPlanGradient(plan.name);
                const iconColor = getPlanIconColor(plan.name);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
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
                          <span className="text-4xl font-bold">
                            {formatPrice(price, plan.currency)}
                          </span>
                          {price > 0 && (
                            <span className="text-muted-foreground text-sm ml-1">
                              /{isYearly ? 'year' : 'month'}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2 text-sm">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Activity className="h-3 w-3 text-primary" />
                            </div>
                            <span>{formatLimit(plan.limits.executions_per_month)} executions/month</span>
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
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full gap-2"
                          variant={isPopular ? 'default' : 'outline'}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {price === 0 ? 'Start Free' : 'Get Started'}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
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
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
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

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Business?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of businesses in Bangladesh using BiztoriBD to streamline their operations.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/docs">
                  Read Documentation
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 BiztoriBD. All rights reserved. | <Link to="/docs" className="hover:text-foreground">Documentation</Link> | <Link to="/pricing" className="hover:text-foreground">Pricing</Link></p>
        </div>
      </footer>
    </div>
  );
}
