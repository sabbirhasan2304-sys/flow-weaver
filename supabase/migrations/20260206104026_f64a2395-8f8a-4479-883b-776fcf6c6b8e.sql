-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'trial', 'canceled', 'past_due', 'paused');

-- Create enum for payment gateway
CREATE TYPE public.payment_gateway AS ENUM ('sslcommerz', 'bkash', 'nagad', 'stripe', 'manual');

-- Create enum for app roles (admin, user)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create plans table for subscription tiers
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits JSONB NOT NULL DEFAULT '{"executions_per_month": 100, "workflows_limit": 5, "ai_credits": 0, "custom_nodes": false, "team_members": 1}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trial',
  payment_gateway payment_gateway,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '14 days'),
  canceled_at TIMESTAMP WITH TIME ZONE,
  gateway_subscription_id TEXT,
  gateway_customer_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create payment_transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  payment_gateway payment_gateway NOT NULL,
  gateway_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create usage_tracking table for metering
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  executions_count INTEGER NOT NULL DEFAULT 0,
  ai_tokens_used INTEGER NOT NULL DEFAULT 0,
  storage_bytes_used BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (profile_id, period_start)
);

-- Enable RLS on usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin());

-- RLS Policies for plans (public read)
CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON public.plans FOR ALL
USING (public.is_admin());

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (profile_id = get_profile_id());

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (profile_id = get_profile_id());

CREATE POLICY "System can create subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (profile_id = get_profile_id());

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions FOR ALL
USING (public.is_admin());

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions FOR SELECT
USING (profile_id = get_profile_id());

CREATE POLICY "Admins can view all transactions"
ON public.payment_transactions FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage transactions"
ON public.payment_transactions FOR ALL
USING (public.is_admin());

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
ON public.usage_tracking FOR SELECT
USING (profile_id = get_profile_id());

CREATE POLICY "Admins can view all usage"
ON public.usage_tracking FOR SELECT
USING (public.is_admin());

-- Insert default plans
INSERT INTO public.plans (name, description, price_monthly, price_yearly, currency, features, limits, sort_order) VALUES
('Free', 'Get started with basic automation', 0, 0, 'BDT', 
  '{"basic_nodes": true, "community_support": true}'::jsonb,
  '{"executions_per_month": 100, "workflows_limit": 3, "ai_credits": 0, "custom_nodes": false, "team_members": 1}'::jsonb,
  1),
('Starter', 'For individuals and small projects', 499, 4990, 'BDT',
  '{"all_nodes": true, "email_support": true, "webhook_triggers": true}'::jsonb,
  '{"executions_per_month": 1000, "workflows_limit": 10, "ai_credits": 1000, "custom_nodes": false, "team_members": 1}'::jsonb,
  2),
('Pro', 'For professionals and growing teams', 1499, 14990, 'BDT',
  '{"all_nodes": true, "priority_support": true, "custom_nodes": true, "api_access": true}'::jsonb,
  '{"executions_per_month": 10000, "workflows_limit": 50, "ai_credits": 5000, "custom_nodes": true, "team_members": 5}'::jsonb,
  3),
('Enterprise', 'For large teams with advanced needs', 4999, 49990, 'BDT',
  '{"all_nodes": true, "dedicated_support": true, "custom_nodes": true, "api_access": true, "sso": true, "audit_logs": true, "custom_branding": true}'::jsonb,
  '{"executions_per_month": -1, "workflows_limit": -1, "ai_credits": 50000, "custom_nodes": true, "team_members": -1}'::jsonb,
  4);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user to also create a free subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_profile_id UUID;
  new_workspace_id UUID;
  free_plan_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  RETURNING id INTO new_profile_id;
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, description, owner_id)
  VALUES ('My Workspace', 'Default workspace', new_profile_id)
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner of workspace
  INSERT INTO public.workspace_members (workspace_id, profile_id, role)
  VALUES (new_workspace_id, new_profile_id, 'owner');
  
  -- Create user role (default: user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Get free plan ID
  SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;
  
  -- Create free subscription with 14-day trial
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (profile_id, plan_id, status, trial_ends_at, current_period_end)
    VALUES (new_profile_id, free_plan_id, 'trial', now() + INTERVAL '14 days', now() + INTERVAL '14 days');
  END IF;
  
  RETURN NEW;
END;
$function$;