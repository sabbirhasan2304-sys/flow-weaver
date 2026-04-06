CREATE TABLE public.tracking_marketing_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT DEFAULT 'untested',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.tracking_marketing_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketing destinations"
ON public.tracking_marketing_destinations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marketing destinations"
ON public.tracking_marketing_destinations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketing destinations"
ON public.tracking_marketing_destinations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own marketing destinations"
ON public.tracking_marketing_destinations FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_tracking_marketing_destinations_updated_at
BEFORE UPDATE ON public.tracking_marketing_destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();