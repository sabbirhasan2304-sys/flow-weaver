
-- A/B test variants for campaigns
CREATE TABLE public.email_ab_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL DEFAULT 'A',
  subject TEXT,
  html_content TEXT,
  weight INTEGER NOT NULL DEFAULT 50,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_opens INTEGER NOT NULL DEFAULT 0,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_bounces INTEGER NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add A/B test config columns to campaigns
ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS is_ab_test BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ab_test_metric TEXT DEFAULT 'opens',
  ADD COLUMN IF NOT EXISTS ab_test_duration_hours INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS ab_test_sample_percent INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS ab_winner_selected_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.email_ab_variants ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage variants of their own campaigns
CREATE POLICY "Users can manage own campaign variants"
  ON public.email_ab_variants
  FOR ALL
  USING (campaign_id IN (
    SELECT id FROM public.email_campaigns WHERE profile_id = get_profile_id()
  ));

CREATE POLICY "Admins can manage all variants"
  ON public.email_ab_variants
  FOR ALL
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_email_ab_variants_updated_at
  BEFORE UPDATE ON public.email_ab_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
