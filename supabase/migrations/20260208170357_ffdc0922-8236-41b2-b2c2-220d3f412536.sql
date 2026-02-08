-- Create user_credits table to track AI credits
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12, 4) NOT NULL DEFAULT 0,
  total_purchased DECIMAL(12, 4) NOT NULL DEFAULT 0,
  total_used DECIMAL(12, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Create credit_transactions table for credit history
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12, 4) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  description TEXT,
  reference_id UUID,
  balance_after DECIMAL(12, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (profile_id = public.get_profile_id());

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (profile_id = public.get_profile_id());

CREATE POLICY "System can insert credits" ON public.user_credits
  FOR INSERT WITH CHECK (profile_id = public.get_profile_id());

-- RLS policies for credit_transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (profile_id = public.get_profile_id());

CREATE POLICY "System can insert transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (profile_id = public.get_profile_id());

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_profile_id UUID,
  p_amount DECIMAL,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS public.user_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits public.user_credits;
BEGIN
  -- Upsert user_credits
  INSERT INTO public.user_credits (profile_id, balance, total_purchased)
  VALUES (p_profile_id, p_amount, CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END)
  ON CONFLICT (profile_id) DO UPDATE SET
    balance = user_credits.balance + p_amount,
    total_purchased = CASE WHEN p_type = 'purchase' 
      THEN user_credits.total_purchased + p_amount 
      ELSE user_credits.total_purchased END,
    updated_at = now()
  RETURNING * INTO v_credits;

  -- Record transaction
  INSERT INTO public.credit_transactions (profile_id, amount, type, description, balance_after)
  VALUES (p_profile_id, p_amount, p_type, p_description, v_credits.balance);

  RETURN v_credits;
END;
$$;

-- Function to deduct credits (for AI usage)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_profile_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'AI usage'
)
RETURNS public.user_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits public.user_credits;
  v_current_balance DECIMAL;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM public.user_credits
  WHERE profile_id = p_profile_id;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct credits
  UPDATE public.user_credits SET
    balance = balance - p_amount,
    total_used = total_used + p_amount,
    updated_at = now()
  WHERE profile_id = p_profile_id
  RETURNING * INTO v_credits;

  -- Record transaction
  INSERT INTO public.credit_transactions (profile_id, amount, type, description, balance_after)
  VALUES (p_profile_id, -p_amount, 'usage', p_description, v_credits.balance);

  RETURN v_credits;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();