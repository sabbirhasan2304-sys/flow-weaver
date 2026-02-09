
-- Create table to track user plugin installations
CREATE TABLE public.user_plugin_installs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plugin_id UUID NOT NULL REFERENCES public.node_plugins(id) ON DELETE CASCADE,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, plugin_id)
);

-- Enable RLS
ALTER TABLE public.user_plugin_installs ENABLE ROW LEVEL SECURITY;

-- Users can view their own installs
CREATE POLICY "Users can view own installs" ON public.user_plugin_installs
  FOR SELECT USING (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Users can install plugins
CREATE POLICY "Users can install plugins" ON public.user_plugin_installs
  FOR INSERT WITH CHECK (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Users can uninstall plugins
CREATE POLICY "Users can uninstall plugins" ON public.user_plugin_installs
  FOR DELETE USING (profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
