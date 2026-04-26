
-- Polymorphic Ghost Loader: per-workspace script variants and serve logs

-- Workspace-level Ghost config (variant naming + secret seed)
CREATE TABLE public.ghost_loader_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  -- Display name and slug used to build the polymorphic path: /<slug>/<token>.js
  script_slug TEXT NOT NULL DEFAULT 'analytics',
  -- Rotation interval in minutes (how often a new variant is minted)
  rotation_interval_minutes INTEGER NOT NULL DEFAULT 60,
  -- Obfuscation level: 'low' | 'medium' | 'high'
  obfuscation_level TEXT NOT NULL DEFAULT 'medium',
  -- Secret seed (used to derive deterministic but unpredictable identifiers)
  secret_seed TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  -- Optional decoy globals to plant
  inject_decoys BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Active variants (rotated periodically). Multiple may be valid at once during overlap.
CREATE TABLE public.script_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- Token used in path: /<slug>/<token>.js
  token TEXT NOT NULL UNIQUE,
  -- Polymorphism inputs: function name, global var, event endpoint alias
  fn_name TEXT NOT NULL,
  global_var TEXT NOT NULL,
  endpoint_alias TEXT NOT NULL,
  -- AST shuffling seed (numeric)
  shuffle_seed BIGINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  served_count BIGINT NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_script_variants_workspace ON public.script_variants(workspace_id, is_active);
CREATE INDEX idx_script_variants_token ON public.script_variants(token);
CREATE INDEX idx_script_variants_expires ON public.script_variants(expires_at);

-- Lightweight serve log (sampled, not every request, for analytics)
CREATE TABLE public.script_serve_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.script_variants(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_hash TEXT,
  blocked_hint BOOLEAN NOT NULL DEFAULT false,
  served_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_script_serve_logs_workspace_time ON public.script_serve_logs(workspace_id, served_at DESC);

-- RLS
ALTER TABLE public.ghost_loader_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_serve_logs ENABLE ROW LEVEL SECURITY;

-- ghost_loader_configs: workspace members can view, owners/editors can manage
CREATE POLICY "Members can view ghost configs"
  ON public.ghost_loader_configs FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

CREATE POLICY "Owners/editors can insert ghost configs"
  ON public.ghost_loader_configs FOR INSERT
  WITH CHECK (public.get_workspace_role(workspace_id, public.get_profile_id()) IN ('owner','editor'));

CREATE POLICY "Owners/editors can update ghost configs"
  ON public.ghost_loader_configs FOR UPDATE
  USING (public.get_workspace_role(workspace_id, public.get_profile_id()) IN ('owner','editor'));

CREATE POLICY "Owners can delete ghost configs"
  ON public.ghost_loader_configs FOR DELETE
  USING (public.get_workspace_role(workspace_id, public.get_profile_id()) = 'owner');

-- script_variants: members can view, edge functions write via service role
CREATE POLICY "Members can view script variants"
  ON public.script_variants FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

-- script_serve_logs: members can view (admin observability)
CREATE POLICY "Members can view serve logs"
  ON public.script_serve_logs FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

-- Update trigger for ghost_loader_configs
CREATE TRIGGER update_ghost_loader_configs_updated_at
  BEFORE UPDATE ON public.ghost_loader_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
