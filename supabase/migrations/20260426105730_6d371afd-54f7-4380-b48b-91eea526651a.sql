-- Recovery rules (per workspace config)
CREATE TABLE public.recovery_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  heartbeat_timeout_seconds INTEGER NOT NULL DEFAULT 90,
  min_intent_score NUMERIC NOT NULL DEFAULT 0.6,
  eligible_event_types TEXT[] NOT NULL DEFAULT ARRAY['Purchase','InitiateCheckout','AddPaymentInfo','Lead','CompleteRegistration'],
  forward_to_destinations BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recovery_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view recovery rules" ON public.recovery_rules
  FOR SELECT USING (is_workspace_member(workspace_id, get_profile_id()));
CREATE POLICY "Editors can insert recovery rules" ON public.recovery_rules
  FOR INSERT WITH CHECK (get_workspace_role(workspace_id, get_profile_id()) IN ('owner','editor'));
CREATE POLICY "Editors can update recovery rules" ON public.recovery_rules
  FOR UPDATE USING (get_workspace_role(workspace_id, get_profile_id()) IN ('owner','editor'));
CREATE POLICY "Owners can delete recovery rules" ON public.recovery_rules
  FOR DELETE USING (get_workspace_role(workspace_id, get_profile_id()) = 'owner');

CREATE TRIGGER update_recovery_rules_updated_at
BEFORE UPDATE ON public.recovery_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Predictive sessions (visitor heartbeats + captured intent)
CREATE TABLE public.predictive_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  visitor_id TEXT,
  page_url TEXT,
  intent_type TEXT,
  intent_score NUMERIC NOT NULL DEFAULT 0,
  captured_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  hashed_user_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, session_token)
);

CREATE INDEX idx_predictive_sessions_workspace ON public.predictive_sessions(workspace_id);
CREATE INDEX idx_predictive_sessions_status_heartbeat ON public.predictive_sessions(status, last_heartbeat_at);

ALTER TABLE public.predictive_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view predictive sessions" ON public.predictive_sessions
  FOR SELECT USING (is_workspace_member(workspace_id, get_profile_id()));

CREATE TRIGGER update_predictive_sessions_updated_at
BEFORE UPDATE ON public.predictive_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recovered events (audit trail)
CREATE TABLE public.recovered_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  session_id UUID,
  event_name TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  recovery_reason TEXT NOT NULL,
  intent_score NUMERIC NOT NULL DEFAULT 0,
  destinations_forwarded TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  forwarded_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recovered_events_workspace_created ON public.recovered_events(workspace_id, created_at DESC);

ALTER TABLE public.recovered_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view recovered events" ON public.recovered_events
  FOR SELECT USING (is_workspace_member(workspace_id, get_profile_id()));