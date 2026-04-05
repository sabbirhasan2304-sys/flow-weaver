
-- 1. Product feeds for POAS dashboard
CREATE TABLE public.tracking_product_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking_product_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feeds" ON public.tracking_product_feeds FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own feeds" ON public.tracking_product_feeds FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own feeds" ON public.tracking_product_feeds FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own feeds" ON public.tracking_product_feeds FOR DELETE USING (user_id = get_profile_id());
CREATE INDEX idx_tracking_product_feeds_user ON public.tracking_product_feeds(user_id);
CREATE INDEX idx_tracking_product_feeds_sku ON public.tracking_product_feeds(sku);

-- 2. NexusStore collections
CREATE TABLE public.nexus_store_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_ttl_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nexus_store_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collections" ON public.nexus_store_collections FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own collections" ON public.nexus_store_collections FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own collections" ON public.nexus_store_collections FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own collections" ON public.nexus_store_collections FOR DELETE USING (user_id = get_profile_id());

-- 3. NexusStore documents
CREATE TABLE public.nexus_store_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.nexus_store_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  ttl_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nexus_store_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON public.nexus_store_documents FOR SELECT USING (user_id = get_profile_id());
CREATE POLICY "Users can create own documents" ON public.nexus_store_documents FOR INSERT WITH CHECK (user_id = get_profile_id());
CREATE POLICY "Users can update own documents" ON public.nexus_store_documents FOR UPDATE USING (user_id = get_profile_id());
CREATE POLICY "Users can delete own documents" ON public.nexus_store_documents FOR DELETE USING (user_id = get_profile_id());
CREATE INDEX idx_nexus_store_documents_collection ON public.nexus_store_documents(collection_id);
CREATE INDEX idx_nexus_store_documents_data ON public.nexus_store_documents USING GIN(data);

-- 4. Agency clients
CREATE TABLE public.agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_profile_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  workspace_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  brand_color TEXT DEFAULT '#3b82f6',
  logo_url TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clients" ON public.agency_clients FOR SELECT USING (agency_profile_id = get_profile_id());
CREATE POLICY "Users can create own clients" ON public.agency_clients FOR INSERT WITH CHECK (agency_profile_id = get_profile_id());
CREATE POLICY "Users can update own clients" ON public.agency_clients FOR UPDATE USING (agency_profile_id = get_profile_id());
CREATE POLICY "Users can delete own clients" ON public.agency_clients FOR DELETE USING (agency_profile_id = get_profile_id());

-- 5. Agency reports
CREATE TABLE public.agency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_profile_id UUID NOT NULL,
  client_id UUID REFERENCES public.agency_clients(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL DEFAULT '{}',
  report_type TEXT NOT NULL DEFAULT 'performance',
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.agency_reports FOR SELECT USING (agency_profile_id = get_profile_id());
CREATE POLICY "Users can create own reports" ON public.agency_reports FOR INSERT WITH CHECK (agency_profile_id = get_profile_id());
CREATE POLICY "Users can delete own reports" ON public.agency_reports FOR DELETE USING (agency_profile_id = get_profile_id());

-- Add update triggers
CREATE TRIGGER update_tracking_product_feeds_updated_at BEFORE UPDATE ON public.tracking_product_feeds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nexus_store_collections_updated_at BEFORE UPDATE ON public.nexus_store_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nexus_store_documents_updated_at BEFORE UPDATE ON public.nexus_store_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agency_clients_updated_at BEFORE UPDATE ON public.agency_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add UPDATE policy for tracking_events so replay can work
CREATE POLICY "Users can update own events" ON public.tracking_events FOR UPDATE USING (user_id = get_profile_id());
