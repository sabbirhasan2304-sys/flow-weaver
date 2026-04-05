
-- 1. Custom dashboards
CREATE TABLE public.tracking_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  widgets JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_dashboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own dashboards" ON public.tracking_dashboards FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own dashboards" ON public.tracking_dashboards FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own dashboards" ON public.tracking_dashboards FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own dashboards" ON public.tracking_dashboards FOR DELETE USING (user_id = get_profile_id());
CREATE TRIGGER update_tracking_dashboards_updated_at BEFORE UPDATE ON public.tracking_dashboards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Privacy settings
CREATE TABLE public.tracking_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  consent_mode JSONB NOT NULL DEFAULT '{"google": false, "meta": false}',
  anonymizer_rules JSONB NOT NULL DEFAULT '{"ip_truncation": true, "ua_generalization": false, "masked_fields": []}',
  data_residency TEXT NOT NULL DEFAULT 'us',
  cmp_provider TEXT,
  cmp_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own privacy settings" ON public.tracking_privacy_settings FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own privacy settings" ON public.tracking_privacy_settings FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own privacy settings" ON public.tracking_privacy_settings FOR UPDATE USING (user_id = get_profile_id());
CREATE TRIGGER update_tracking_privacy_settings_updated_at BEFORE UPDATE ON public.tracking_privacy_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Identity config
CREATE TABLE public.tracking_identity_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  user_id_salt TEXT DEFAULT '',
  hashing_algorithm TEXT NOT NULL DEFAULT 'sha256',
  cookie_ttl_days INTEGER NOT NULL DEFAULT 365,
  cross_domains TEXT[] DEFAULT '{}',
  click_id_recovery JSONB NOT NULL DEFAULT '{"gclid": true, "fbclid": true, "ttclid": true}',
  bot_threshold NUMERIC NOT NULL DEFAULT 0.7,
  bot_action TEXT NOT NULL DEFAULT 'tag',
  seo_crawler_allowlist TEXT[] DEFAULT ARRAY['Googlebot', 'Bingbot', 'DuckDuckBot'],
  ad_blocker_bypass BOOLEAN DEFAULT false,
  custom_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_identity_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own identity config" ON public.tracking_identity_config FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own identity config" ON public.tracking_identity_config FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own identity config" ON public.tracking_identity_config FOR UPDATE USING (user_id = get_profile_id());
CREATE TRIGGER update_tracking_identity_config_updated_at BEFORE UPDATE ON public.tracking_identity_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
