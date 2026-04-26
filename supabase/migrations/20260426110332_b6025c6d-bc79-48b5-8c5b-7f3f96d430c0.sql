CREATE TABLE public.destination_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  destination_platform TEXT NOT NULL,
  event_name TEXT NOT NULL,
  http_status INTEGER,
  latency_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  recovered BOOLEAN NOT NULL DEFAULT false,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dest_delivery_logs_workspace_created
  ON public.destination_delivery_logs(workspace_id, created_at DESC);
CREATE INDEX idx_dest_delivery_logs_platform
  ON public.destination_delivery_logs(workspace_id, destination_platform, created_at DESC);

ALTER TABLE public.destination_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view delivery logs"
  ON public.destination_delivery_logs
  FOR SELECT
  USING (is_workspace_member(workspace_id, get_profile_id()));