
-- Alert rules table
CREATE TABLE public.tracking_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT '>',
  threshold NUMERIC NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  webhook_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all alert rules" ON public.tracking_alert_rules FOR ALL USING (is_admin());
CREATE POLICY "Users can view own alert rules" ON public.tracking_alert_rules FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own alert rules" ON public.tracking_alert_rules FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own alert rules" ON public.tracking_alert_rules FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own alert rules" ON public.tracking_alert_rules FOR DELETE USING (user_id = get_profile_id());

CREATE TRIGGER update_tracking_alert_rules_updated_at
  BEFORE UPDATE ON public.tracking_alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add event_fingerprint for dedup
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS event_fingerprint TEXT;
CREATE INDEX IF NOT EXISTS idx_tracking_events_fingerprint ON public.tracking_events (event_fingerprint) WHERE event_fingerprint IS NOT NULL;

-- Add retry_config per destination
ALTER TABLE public.tracking_destinations ADD COLUMN IF NOT EXISTS retry_config JSONB DEFAULT '{"max_retries": 10, "backoff": "exponential_jitter"}'::jsonb;
