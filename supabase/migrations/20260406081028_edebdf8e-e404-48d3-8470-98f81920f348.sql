CREATE TABLE public.backend_provider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'lovable_cloud',
  display_name text NOT NULL DEFAULT 'Lovable Cloud',
  connection_url text,
  anon_key text,
  service_role_key text,
  is_active boolean NOT NULL DEFAULT true,
  migration_status text DEFAULT 'none',
  last_synced_at timestamptz,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.backend_provider_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own provider config"
  ON public.backend_provider_config FOR SELECT
  USING (user_id = get_profile_id());

CREATE POLICY "Users can create own provider config"
  ON public.backend_provider_config FOR INSERT
  WITH CHECK (user_id = get_profile_id());

CREATE POLICY "Users can update own provider config"
  ON public.backend_provider_config FOR UPDATE
  USING (user_id = get_profile_id());

CREATE POLICY "Users can delete own provider config"
  ON public.backend_provider_config FOR DELETE
  USING (user_id = get_profile_id());

CREATE POLICY "Admins can manage all provider configs"
  ON public.backend_provider_config FOR ALL
  USING (is_admin());

CREATE INDEX idx_backend_provider_user ON public.backend_provider_config(user_id);
CREATE INDEX idx_backend_provider_active ON public.backend_provider_config(user_id, is_active);