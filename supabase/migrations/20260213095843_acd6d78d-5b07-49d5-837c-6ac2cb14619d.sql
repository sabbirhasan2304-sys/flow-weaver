
-- Email Automations (journeys)
CREATE TABLE public.email_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'welcome', -- welcome, abandoned_cart, date_based, tag_added, list_joined, manual
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, archived
  stats JSONB NOT NULL DEFAULT '{"entered": 0, "completed": 0, "active": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automation Steps (nodes in the journey)
CREATE TABLE public.email_automation_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.email_automations(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL, -- send_email, wait, condition, split, action
  step_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- For branching: parent_step_id + branch label
  parent_step_id UUID REFERENCES public.email_automation_steps(id) ON DELETE SET NULL,
  branch_label TEXT, -- 'yes', 'no', 'default', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_automation_steps ENABLE ROW LEVEL SECURITY;

-- RLS for automations
CREATE POLICY "Users can manage own automations"
  ON public.email_automations FOR ALL
  USING (profile_id = get_profile_id());

CREATE POLICY "Admins can manage all automations"
  ON public.email_automations FOR ALL
  USING (is_admin());

-- RLS for steps
CREATE POLICY "Users can manage steps of own automations"
  ON public.email_automation_steps FOR ALL
  USING (automation_id IN (
    SELECT id FROM public.email_automations WHERE profile_id = get_profile_id()
  ));

CREATE POLICY "Admins can manage all steps"
  ON public.email_automation_steps FOR ALL
  USING (is_admin());

-- Indexes
CREATE INDEX idx_automation_steps_automation ON public.email_automation_steps(automation_id);
CREATE INDEX idx_automations_profile ON public.email_automations(profile_id);
CREATE INDEX idx_automations_status ON public.email_automations(status);

-- Updated_at triggers
CREATE TRIGGER update_email_automations_updated_at
  BEFORE UPDATE ON public.email_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_automation_steps_updated_at
  BEFORE UPDATE ON public.email_automation_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
