
-- Admin policies for tracking_events
CREATE POLICY "Admins can view all events" ON public.tracking_events FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all events" ON public.tracking_events FOR UPDATE USING (public.is_admin());

-- Admin policies for tracking_pipelines
CREATE POLICY "Admins can manage all pipelines" ON public.tracking_pipelines FOR ALL USING (public.is_admin());

-- Admin policies for tracking_alerts
CREATE POLICY "Admins can manage all alerts" ON public.tracking_alerts FOR ALL USING (public.is_admin());

-- Admin policies for tracking_destinations
CREATE POLICY "Admins can manage all destinations" ON public.tracking_destinations FOR ALL USING (public.is_admin());

-- Admin policies for tracking_dashboards
CREATE POLICY "Admins can manage all dashboards" ON public.tracking_dashboards FOR ALL USING (public.is_admin());

-- Admin policies for tracking_privacy_settings
CREATE POLICY "Admins can manage all privacy settings" ON public.tracking_privacy_settings FOR ALL USING (public.is_admin());

-- Admin policies for tracking_identity_config
CREATE POLICY "Admins can manage all identity config" ON public.tracking_identity_config FOR ALL USING (public.is_admin());

-- Admin policies for tracking_product_feeds
CREATE POLICY "Admins can manage all product feeds" ON public.tracking_product_feeds FOR ALL USING (public.is_admin());

-- Admin policies for nexus_store_collections
CREATE POLICY "Admins can manage all collections" ON public.nexus_store_collections FOR ALL USING (public.is_admin());

-- Admin policies for nexus_store_documents
CREATE POLICY "Admins can manage all documents" ON public.nexus_store_documents FOR ALL USING (public.is_admin());

-- Admin policies for agency_clients
CREATE POLICY "Admins can manage all agency clients" ON public.agency_clients FOR ALL USING (public.is_admin());

-- Admin policies for agency_reports
CREATE POLICY "Admins can manage all agency reports" ON public.agency_reports FOR ALL USING (public.is_admin());
