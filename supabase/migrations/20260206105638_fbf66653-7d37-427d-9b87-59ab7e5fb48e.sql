-- Add RLS policies for admin access to profiles table
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Add RLS policies for admin access to workflows table
CREATE POLICY "Admins can view all workflows" 
ON public.workflows 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Add RLS policies for admin access to executions table  
CREATE POLICY "Admins can view all executions" 
ON public.executions 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Add RLS policies for admin access to subscriptions (already has admin policy but adding explicit one)
-- Note: subscriptions already has "Admins can view all subscriptions" policy

-- Add RLS policies for admin access to workspaces table
CREATE POLICY "Admins can view all workspaces" 
ON public.workspaces 
FOR SELECT 
TO authenticated
USING (is_admin());