-- Fix the overly permissive RLS policy for api_usage_logs
-- Drop the existing policy
DROP POLICY IF EXISTS "System can insert usage logs" ON public.api_usage_logs;

-- The log_api_usage function already uses SECURITY DEFINER, so it bypasses RLS
-- We don't need a permissive insert policy since only the function inserts logs