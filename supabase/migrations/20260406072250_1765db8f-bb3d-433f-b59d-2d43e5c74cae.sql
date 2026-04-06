CREATE TABLE public.tracking_clarity_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL DEFAULT '',
  custom_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  identify_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  masking_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.tracking_clarity_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clarity config"
ON public.tracking_clarity_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clarity config"
ON public.tracking_clarity_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clarity config"
ON public.tracking_clarity_config FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clarity config"
ON public.tracking_clarity_config FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_tracking_clarity_config_updated_at
BEFORE UPDATE ON public.tracking_clarity_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();