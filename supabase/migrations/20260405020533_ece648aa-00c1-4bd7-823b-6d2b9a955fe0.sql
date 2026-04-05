-- Create tracking_pipelines table
CREATE TABLE public.tracking_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  pipeline_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pipelines" ON public.tracking_pipelines
  FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own pipelines" ON public.tracking_pipelines
  FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own pipelines" ON public.tracking_pipelines
  FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own pipelines" ON public.tracking_pipelines
  FOR DELETE USING (user_id = get_profile_id());

CREATE TRIGGER update_tracking_pipelines_updated_at
  BEFORE UPDATE ON public.tracking_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create tracking_events table
CREATE TABLE public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES public.tracking_pipelines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}',
  response JSONB,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.tracking_events
  FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own events" ON public.tracking_events
  FOR INSERT WITH CHECK (user_id = get_profile_id());

CREATE INDEX idx_tracking_events_pipeline ON public.tracking_events(pipeline_id);
CREATE INDEX idx_tracking_events_status ON public.tracking_events(status);
CREATE INDEX idx_tracking_events_created ON public.tracking_events(created_at DESC);

-- Create tracking_alerts table
CREATE TABLE public.tracking_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  condition JSONB NOT NULL DEFAULT '{}',
  notify_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.tracking_alerts
  FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own alerts" ON public.tracking_alerts
  FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own alerts" ON public.tracking_alerts
  FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own alerts" ON public.tracking_alerts
  FOR DELETE USING (user_id = get_profile_id());

-- Create tracking_destinations table
CREATE TABLE public.tracking_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own destinations" ON public.tracking_destinations
  FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own destinations" ON public.tracking_destinations
  FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own destinations" ON public.tracking_destinations
  FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own destinations" ON public.tracking_destinations
  FOR DELETE USING (user_id = get_profile_id());