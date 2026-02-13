
-- Atomic increment functions for campaign stats
CREATE OR REPLACE FUNCTION public.increment_campaign_opens(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.email_campaigns
  SET total_opens = COALESCE(total_opens, 0) + 1
  WHERE id = p_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_campaign_clicks(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.email_campaigns
  SET total_clicks = COALESCE(total_clicks, 0) + 1
  WHERE id = p_campaign_id;
END;
$$;
