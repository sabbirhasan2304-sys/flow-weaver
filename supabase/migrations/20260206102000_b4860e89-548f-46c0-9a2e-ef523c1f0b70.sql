-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view accessible workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can create workflows in their workspaces" ON public.workflows;
DROP POLICY IF EXISTS "Users can update workflows they can edit" ON public.workflows;
DROP POLICY IF EXISTS "Owners can delete workflows" ON public.workflows;

-- Create simpler, non-recursive policies
-- For SELECT: Users can view workflows in workspaces they're members of
CREATE POLICY "Users can view workflows in their workspaces" 
ON public.workflows 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- For INSERT: Users can create workflows in workspaces where they are owner or editor
CREATE POLICY "Users can create workflows in accessible workspaces" 
ON public.workflows 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND wm.role IN ('owner', 'editor')
  )
);

-- For UPDATE: Users can update workflows in workspaces where they are owner or editor
CREATE POLICY "Users can update workflows in their workspaces" 
ON public.workflows 
FOR UPDATE 
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND wm.role IN ('owner', 'editor')
  )
);

-- For DELETE: Only workspace owners can delete workflows
CREATE POLICY "Workspace owners can delete workflows" 
ON public.workflows 
FOR DELETE 
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND wm.role = 'owner'
  )
);