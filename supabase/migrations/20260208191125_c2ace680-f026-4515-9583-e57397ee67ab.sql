-- Create API keys table for external integrations
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '["read", "execute"]'::jsonb,
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API usage logs table
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_profile_id ON public.api_keys(profile_id);
CREATE INDEX idx_api_usage_logs_api_key_id ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own API keys"
ON public.api_keys
FOR SELECT
USING (profile_id = get_profile_id());

CREATE POLICY "Users can create their own API keys"
ON public.api_keys
FOR INSERT
WITH CHECK (profile_id = get_profile_id());

CREATE POLICY "Users can update their own API keys"
ON public.api_keys
FOR UPDATE
USING (profile_id = get_profile_id());

CREATE POLICY "Users can delete their own API keys"
ON public.api_keys
FOR DELETE
USING (profile_id = get_profile_id());

CREATE POLICY "Admins can view all API keys"
ON public.api_keys
FOR SELECT
USING (is_admin());

-- RLS Policies for api_usage_logs
CREATE POLICY "Users can view their own API usage logs"
ON public.api_usage_logs
FOR SELECT
USING (api_key_id IN (SELECT id FROM public.api_keys WHERE profile_id = get_profile_id()));

CREATE POLICY "System can insert usage logs"
ON public.api_usage_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all usage logs"
ON public.api_usage_logs
FOR SELECT
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate API key (for edge functions)
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_prefix TEXT, p_key_hash TEXT)
RETURNS TABLE(
  api_key_id UUID,
  profile_id UUID,
  permissions JSONB,
  rate_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.profile_id,
    ak.permissions,
    ak.rate_limit
  FROM public.api_keys ak
  WHERE ak.key_prefix = p_key_prefix
    AND ak.key_hash = p_key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now());
END;
$$;

-- Function to log API usage
CREATE OR REPLACE FUNCTION public.log_api_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_body JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert usage log
  INSERT INTO public.api_usage_logs (
    api_key_id, endpoint, method, status_code, 
    response_time_ms, ip_address, user_agent, request_body
  ) VALUES (
    p_api_key_id, p_endpoint, p_method, p_status_code,
    p_response_time_ms, p_ip_address, p_user_agent, p_request_body
  );
  
  -- Update last_used_at on the API key
  UPDATE public.api_keys SET last_used_at = now() WHERE id = p_api_key_id;
END;
$$;