
CREATE POLICY "Users can view versions of accessible workflows" ON public.workflow_versions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workflows w
    WHERE w.id = workflow_versions.workflow_id
    AND (is_workspace_member(w.workspace_id, get_profile_id())
      OR EXISTS (SELECT 1 FROM public.workflow_shares ws WHERE ws.workflow_id = w.id AND ws.profile_id = get_profile_id()))
  ));

CREATE POLICY "Users can insert versions for editable workflows" ON public.workflow_versions
  FOR INSERT TO authenticated
  WITH CHECK (can_edit_workflow(workflow_id, get_profile_id()));

CREATE POLICY "Users can view schedules of accessible workflows" ON public.workflow_schedules
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workflows w
    WHERE w.id = workflow_schedules.workflow_id
    AND is_workspace_member(w.workspace_id, get_profile_id())
  ));

CREATE POLICY "Users can manage schedules for editable workflows" ON public.workflow_schedules
  FOR ALL TO authenticated
  USING (can_edit_workflow(workflow_id, get_profile_id()))
  WITH CHECK (can_edit_workflow(workflow_id, get_profile_id()));
