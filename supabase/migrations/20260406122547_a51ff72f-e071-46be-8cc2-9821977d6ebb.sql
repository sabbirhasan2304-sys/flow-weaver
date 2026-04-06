
-- Allow admins to delete error_logs
CREATE POLICY "Admins can delete error logs"
ON public.error_logs
FOR DELETE
TO authenticated
USING (is_admin());

-- Allow admins to manage api_usage_logs (currently only SELECT)
CREATE POLICY "Admins can delete api usage logs"
ON public.api_usage_logs
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can insert api usage logs"
ON public.api_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Allow admins to delete credit_transactions
CREATE POLICY "Admins can delete credit transactions"
ON public.credit_transactions
FOR DELETE
TO authenticated
USING (is_admin());

-- Allow admins to delete executions
CREATE POLICY "Admins can delete executions"
ON public.executions
FOR DELETE
TO authenticated
USING (is_admin());

-- Allow admins to view and delete email_send_log (currently only service_role)
CREATE POLICY "Admins can view email send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete email send log"
ON public.email_send_log
FOR DELETE
TO authenticated
USING (is_admin());
