import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

// Admin gets unlimited premium plan
const ADMIN_PLAN: Plan = {
  id: 'admin-unlimited',
  name: 'Admin Unlimited',
  description: 'Unlimited access for administrators',
  price_monthly: 0,
  price_yearly: 0,
  currency: 'BDT',
  features: {
    ai_assistant: true,
    custom_nodes: true,
    priority_support: true,
    team_collaboration: true,
    advanced_analytics: true,
    api_access: true,
    white_label: true,
  },
  limits: {
    executions_per_month: -1, // Unlimited
    workflows_limit: -1, // Unlimited
    ai_credits: -1, // Unlimited
    custom_nodes: true,
    team_members: -1, // Unlimited
  },
  is_active: true,
  sort_order: 0,
};

const ADMIN_SUBSCRIPTION: Subscription = {
  id: 'admin-subscription',
  profile_id: 'admin',
  plan_id: 'admin-unlimited',
  status: 'active',
  payment_gateway: null,
  billing_cycle: 'lifetime',
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(2099, 11, 31).toISOString(),
  trial_ends_at: null,
  canceled_at: null,
  plan: ADMIN_PLAN,
};

export interface Plan {
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
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  profile_id: string;
  plan_id: string;
  status: 'active' | 'trial' | 'canceled' | 'past_due' | 'paused';
  payment_gateway: string | null;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  canceled_at: string | null;
  plan?: Plan;
}

export interface UsageData {
  executions_count: number;
  ai_tokens_used: number;
  storage_bytes_used: number;
  period_start: string;
  period_end: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for admin check to complete
    if (adminLoading) return;

    if (user) {
      // Always fetch plans (for plan selection page)
      fetchPlans();
      
      // If admin, set unlimited subscription immediately and skip subscription fetch
      if (isAdmin) {
        setSubscription(ADMIN_SUBSCRIPTION);
        setLoading(false);
        return;
      }

      fetchSubscriptionData();
    }
  }, [user, isAdmin, adminLoading]);

  const fetchPlans = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (plansError) throw plansError;
      
      // Transform plans data
      const transformedPlans: Plan[] = (plansData || []).map((p) => ({
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
        is_active: p.is_active,
        sort_order: p.sort_order,
      }));
      setPlans(transformedPlans);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (plansError) throw plansError;
      
      // Transform plans data
      const transformedPlans: Plan[] = (plansData || []).map((p) => ({
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
        is_active: p.is_active,
        sort_order: p.sort_order,
      }));
      setPlans(transformedPlans);

      // Fetch user's subscription (scoped to current user)
      const { data: profileId, error: profileIdError } = await supabase.rpc('get_profile_id');
      if (profileIdError) throw profileIdError;

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(
          `
          *,
          plan:plans(*)
        `
        )
        .eq('profile_id', profileId)
        .maybeSingle();

      if (subError) throw subError;

      if (subData) {
        const planData = subData.plan as Record<string, unknown> | null;
        const transformedSub: Subscription = {
          id: subData.id,
          profile_id: subData.profile_id,
          plan_id: subData.plan_id,
          status: subData.status as Subscription['status'],
          payment_gateway: subData.payment_gateway,
          billing_cycle: subData.billing_cycle,
          current_period_start: subData.current_period_start,
          current_period_end: subData.current_period_end,
          trial_ends_at: subData.trial_ends_at,
          canceled_at: subData.canceled_at,
          plan: planData
            ? {
                id: planData.id as string,
                name: planData.name as string,
                description: planData.description as string | null,
                price_monthly: planData.price_monthly as number,
                price_yearly: planData.price_yearly as number,
                currency: planData.currency as string,
                features: (planData.features as Record<string, boolean>) || {},
                limits: (planData.limits as Plan['limits']) || {
                  executions_per_month: 100,
                  workflows_limit: 5,
                  ai_credits: 0,
                  custom_nodes: false,
                  team_members: 1,
                },
                is_active: planData.is_active as boolean,
                sort_order: planData.sort_order as number,
              }
            : undefined,
        };
        setSubscription(transformedSub);
      } else {
        setSubscription(null);
      }

      // Fetch current usage (scoped to current user)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('profile_id', profileId)
        .gte('period_start', periodStart)
        .maybeSingle();

      if (usageError && usageError.code !== 'PGRST116') throw usageError;

      if (usageData) {
        setUsage(usageData as UsageData);
      } else {
        setUsage(null);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const isTrialExpired = (): boolean => {
    if (!subscription?.trial_ends_at) return false;
    return new Date(subscription.trial_ends_at) < new Date();
  };

  const getDaysRemaining = (): number => {
    if (!subscription?.current_period_end) return 0;
    const end = new Date(subscription.current_period_end);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getUsagePercentage = (type: 'executions' | 'ai_tokens'): number => {
    if (!subscription?.plan || !usage) return 0;
    const limits = subscription.plan.limits;
    
    if (type === 'executions') {
      if (limits.executions_per_month === -1) return 0; // Unlimited
      return Math.min(100, (usage.executions_count / limits.executions_per_month) * 100);
    }
    
    if (type === 'ai_tokens') {
      if (limits.ai_credits === 0) return 100; // No credits
      return Math.min(100, (usage.ai_tokens_used / limits.ai_credits) * 100);
    }
    
    return 0;
  };

  const canUseFeature = (feature: string): boolean => {
    // Admins can use all features
    if (isAdmin) return true;
    if (!subscription?.plan) return false;
    return subscription.plan.features[feature] === true;
  };

  const isWithinLimits = (type: 'executions' | 'workflows' | 'team_members', currentCount: number): boolean => {
    // Admins have no limits
    if (isAdmin) return true;
    if (!subscription?.plan) return false;
    const limits = subscription.plan.limits;
    
    switch (type) {
      case 'executions':
        return limits.executions_per_month === -1 || currentCount < limits.executions_per_month;
      case 'workflows':
        return limits.workflows_limit === -1 || currentCount < limits.workflows_limit;
      case 'team_members':
        return limits.team_members === -1 || currentCount < limits.team_members;
      default:
        return true;
    }
  };

  return {
    subscription,
    plans,
    usage,
    loading,
    error,
    isTrialExpired,
    getDaysRemaining,
    getUsagePercentage,
    canUseFeature,
    isWithinLimits,
    refetch: fetchSubscriptionData,
  };
}
