
-- Phase 2: Cookieless Identity Stitching

-- Unified person/profile
CREATE TABLE public.identity_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  display_label TEXT,
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.500,
  signal_count INTEGER NOT NULL DEFAULT 0,
  -- When two profiles merge, the loser points at the winner so legacy refs still resolve
  merged_into_id UUID REFERENCES public.identity_profiles(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_identity_profiles_workspace ON public.identity_profiles(workspace_id);
CREATE INDEX idx_identity_profiles_merged ON public.identity_profiles(merged_into_id) WHERE merged_into_id IS NOT NULL;

-- Signatures: any signal that identifies someone (hashed)
-- types: cookie_id, email_hash, phone_hash, fingerprint, ip_subnet_ua
CREATE TABLE public.identity_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.identity_profiles(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL,
  signature_value TEXT NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  seen_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, signature_type, signature_value)
);

CREATE INDEX idx_identity_signatures_profile ON public.identity_signatures(profile_id);
CREATE INDEX idx_identity_signatures_lookup ON public.identity_signatures(workspace_id, signature_type, signature_value);

-- Audit decisions
CREATE TABLE public.identity_match_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_profile_id UUID,
  target_profile_id UUID,
  method TEXT NOT NULL, -- 'rules' | 'ai' | 'manual'
  decision TEXT NOT NULL, -- 'merged' | 'rejected' | 'created'
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.000,
  reason TEXT,
  ai_model TEXT,
  ambiguous_features JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_identity_match_decisions_workspace ON public.identity_match_decisions(workspace_id, created_at DESC);

-- RLS
ALTER TABLE public.identity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_match_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view identity profiles"
  ON public.identity_profiles FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

CREATE POLICY "Members can view identity signatures"
  ON public.identity_signatures FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

CREATE POLICY "Members can view match decisions"
  ON public.identity_match_decisions FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

-- Updated_at trigger
CREATE TRIGGER update_identity_profiles_updated_at
  BEFORE UPDATE ON public.identity_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
