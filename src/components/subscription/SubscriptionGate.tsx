import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Crown, Sparkles, Lock, Zap, 
  CheckCircle2, ArrowRight, Rocket
} from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
}

export function SubscriptionGate({ children, feature = 'this feature', fallback }: SubscriptionGateProps) {
  const { subscription, loading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  if (loading || adminLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // Admins bypass subscription check
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check if user has an active or trial subscription
  const hasActiveSubscription = subscription && 
    (subscription.status === 'active' || subscription.status === 'trial');

  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // Redirect to plan selection if no subscription at all
  if (!subscription) {
    // Use effect-like redirect
    setTimeout(() => navigate('/select-plan'), 0);
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to plan selection...</p>
        </div>
      </div>
    );
  }

  // Show upgrade prompt for expired/canceled subscriptions
  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradePrompt feature={feature} />;
}

function UpgradePrompt({ feature }: { feature: string }) {
  const features = [
    'Unlimited workflow executions',
    'AI-powered workflow builder',
    'Premium integrations',
    'Priority support',
    'Team collaboration',
    'Advanced analytics',
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <CardHeader className="relative text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Lock className="h-10 w-10 text-primary-foreground" />
              </div>
            </motion.div>
            
            <Badge variant="secondary" className="mx-auto mb-3 bg-primary/10 text-primary border-primary/20">
              <Crown className="h-3 w-3 mr-1" />
              Subscription Required
            </Badge>
            
            <CardTitle className="text-2xl md:text-3xl font-bold">
              Unlock {feature}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Subscribe to access powerful workflow automation tools and take your productivity to the next level.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative space-y-6">
            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild size="lg" className="flex-1 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                <Link to="/select-plan">
                  <Rocket className="h-4 w-4" />
                  Choose a Plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            
            {/* Trial info */}
            <p className="text-center text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Start with a 14-day free trial. No credit card required.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function SubscriptionBadge() {
  const { subscription, loading } = useSubscription();

  if (loading) return null;

  if (!subscription) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No Plan
      </Badge>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    trial: 'bg-primary/10 text-primary border-primary/20',
    canceled: 'bg-destructive/10 text-destructive border-destructive/20',
    past_due: 'bg-warning/10 text-warning border-warning/20',
    paused: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <Badge className={statusColors[subscription.status] || 'bg-muted'}>
      {subscription.status === 'trial' && <Sparkles className="h-3 w-3 mr-1" />}
      {subscription.status === 'active' && <Zap className="h-3 w-3 mr-1" />}
      {subscription.plan?.name || 'Unknown'} • {subscription.status}
    </Badge>
  );
}
