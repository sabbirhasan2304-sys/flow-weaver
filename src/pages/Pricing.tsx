import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Zap, Check, ArrowRight, Sparkles, Crown,
  Users, Infinity, Bot, Headphones, Shield
} from 'lucide-react';

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

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const getPopularPlan = () => plans.find(p => p.name.toLowerCase() === 'pro');

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
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
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
              Start free, scale as you grow. All plans include a 14-day free trial.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
                Yearly
                <Badge variant="secondary" className="ml-2 bg-success/10 text-success">
                  Save 20%
                </Badge>
              </Label>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex justify-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const isPopular = plan.name.toLowerCase() === 'pro';
                const price = isYearly ? plan.price_yearly : plan.price_monthly;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`relative h-full flex flex-col ${isPopular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">
                            <Crown className="h-3 w-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="pt-4">
                          <span className="text-4xl font-bold">
                            {formatPrice(price, plan.currency)}
                          </span>
                          {price > 0 && (
                            <span className="text-muted-foreground">
                              /{isYearly ? 'year' : 'month'}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2 text-sm">
                            <Zap className="h-4 w-4 text-primary" />
                            <span>{formatLimit(plan.limits.executions_per_month)} executions/month</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            <span>{formatLimit(plan.limits.workflows_limit)} workflows</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Bot className="h-4 w-4 text-primary" />
                            <span>{formatLimit(plan.limits.ai_credits)} AI credits</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-primary" />
                            <span>{formatLimit(plan.limits.team_members)} team members</span>
                          </li>
                          {plan.limits.custom_nodes && (
                            <li className="flex items-center gap-2 text-sm">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span>Custom nodes</span>
                            </li>
                          )}
                          {plan.features.priority_support && (
                            <li className="flex items-center gap-2 text-sm">
                              <Headphones className="h-4 w-4 text-primary" />
                              <span>Priority support</span>
                            </li>
                          )}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          variant={isPopular ? 'default' : 'outline'}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {price === 0 ? 'Start Free' : 'Get Started'}
                          <ArrowRight className="h-4 w-4 ml-2" />
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
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">All Plans Include</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Secure & Reliable', description: 'Enterprise-grade security with 99.9% uptime guarantee' },
              { icon: Bot, title: 'AI-Powered', description: 'Built-in AI assistant to help build workflows faster' },
              { icon: Infinity, title: '200+ Integrations', description: 'Connect with popular apps and services' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Business?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of businesses in Bangladesh using BiztoriBD to streamline their operations.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">
              Start Your Free Trial
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 BiztoriBD. All rights reserved. | <Link to="/docs" className="hover:text-foreground">Documentation</Link></p>
        </div>
      </footer>
    </div>
  );
}