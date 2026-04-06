-- Indexes for tracking_events (most queried table)
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_id ON public.tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON public.tracking_events(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON public.tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_destination ON public.tracking_events(destination);
CREATE INDEX IF NOT EXISTS idx_tracking_events_source ON public.tracking_events(source);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_status ON public.tracking_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_created ON public.tracking_events(user_id, created_at DESC);

-- Indexes for email tables
CREATE INDEX IF NOT EXISTS idx_email_contacts_profile_id ON public.email_contacts(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_profile_id ON public.email_campaigns(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign ON public.email_campaign_recipients(campaign_id);

-- Indexes for executions
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON public.executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON public.executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created_at ON public.executions(created_at DESC);

-- Indexes for workflows
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON public.workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON public.workflows(is_active);

-- Indexes for tracking destinations & pipelines
CREATE INDEX IF NOT EXISTS idx_tracking_destinations_user_id ON public.tracking_destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_pipelines_user_id ON public.tracking_pipelines(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_marketing_dest_user ON public.tracking_marketing_destinations(user_id);