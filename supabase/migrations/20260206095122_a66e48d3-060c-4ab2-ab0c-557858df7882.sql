-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create workspace_members table for access control
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, profile_id)
);

-- Create workflows table
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{"nodes": [], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}'::jsonb NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1 NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create workflow_shares table
CREATE TABLE public.workflow_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workflow_id, profile_id)
);

-- Create credentials table
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create executions table
CREATE TABLE public.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'error', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  finished_at TIMESTAMPTZ,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  logs JSONB DEFAULT '[]'::jsonb,
  triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create node_plugins table for custom nodes
CREATE TABLE public.node_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  config_schema JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_system BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  version TEXT DEFAULT '1.0.0' NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create workflow_templates table
CREATE TABLE public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  use_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Helper function: Get profile ID from auth user
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Helper function: Check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID, p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND profile_id = p_profile_id
  )
$$;

-- Helper function: Get workspace role
CREATE OR REPLACE FUNCTION public.get_workspace_role(p_workspace_id UUID, p_profile_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND profile_id = p_profile_id
$$;

-- Helper function: Check if user can edit workflow
CREATE OR REPLACE FUNCTION public.can_edit_workflow(p_workflow_id UUID, p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workflows w
    JOIN public.workspace_members wm ON w.workspace_id = wm.workspace_id
    WHERE w.id = p_workflow_id 
    AND wm.profile_id = p_profile_id 
    AND wm.role IN ('owner', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.workflow_shares ws
    WHERE ws.workflow_id = p_workflow_id 
    AND ws.profile_id = p_profile_id 
    AND ws.role = 'editor'
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they are members of"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id, public.get_profile_id()));

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = public.get_profile_id());

CREATE POLICY "Owners can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (public.get_workspace_role(id, public.get_profile_id()) = 'owner');

CREATE POLICY "Owners can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (public.get_workspace_role(id, public.get_profile_id()) = 'owner');

-- RLS Policies for workspace_members
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

CREATE POLICY "Owners can manage workspace members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (public.get_workspace_role(workspace_id, public.get_profile_id()) = 'owner');

CREATE POLICY "Owners can update workspace members"
  ON public.workspace_members FOR UPDATE
  USING (public.get_workspace_role(workspace_id, public.get_profile_id()) = 'owner');

CREATE POLICY "Owners can delete workspace members"
  ON public.workspace_members FOR DELETE
  USING (public.get_workspace_role(workspace_id, public.get_profile_id()) = 'owner');

-- RLS Policies for workflows
CREATE POLICY "Users can view accessible workflows"
  ON public.workflows FOR SELECT
  USING (
    public.is_workspace_member(workspace_id, public.get_profile_id())
    OR EXISTS (
      SELECT 1 FROM public.workflow_shares 
      WHERE workflow_id = id AND profile_id = public.get_profile_id()
    )
  );

CREATE POLICY "Users can create workflows in their workspaces"
  ON public.workflows FOR INSERT
  WITH CHECK (
    public.get_workspace_role(workspace_id, public.get_profile_id()) IN ('owner', 'editor')
  );

CREATE POLICY "Users can update workflows they can edit"
  ON public.workflows FOR UPDATE
  USING (public.can_edit_workflow(id, public.get_profile_id()));

CREATE POLICY "Owners can delete workflows"
  ON public.workflows FOR DELETE
  USING (
    public.get_workspace_role(workspace_id, public.get_profile_id()) = 'owner'
  );

-- RLS Policies for workflow_shares
CREATE POLICY "Users can view workflow shares"
  ON public.workflow_shares FOR SELECT
  USING (
    profile_id = public.get_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_id 
      AND public.is_workspace_member(w.workspace_id, public.get_profile_id())
    )
  );

CREATE POLICY "Editors can create workflow shares"
  ON public.workflow_shares FOR INSERT
  WITH CHECK (
    public.can_edit_workflow(workflow_id, public.get_profile_id())
    AND invited_by = public.get_profile_id()
    AND profile_id != public.get_profile_id()
  );

CREATE POLICY "Editors can delete workflow shares"
  ON public.workflow_shares FOR DELETE
  USING (public.can_edit_workflow(workflow_id, public.get_profile_id()));

-- RLS Policies for credentials
CREATE POLICY "Users can view credentials in their workspaces"
  ON public.credentials FOR SELECT
  USING (public.is_workspace_member(workspace_id, public.get_profile_id()));

CREATE POLICY "Editors can create credentials"
  ON public.credentials FOR INSERT
  WITH CHECK (
    public.get_workspace_role(workspace_id, public.get_profile_id()) IN ('owner', 'editor')
  );

CREATE POLICY "Owners can update credentials"
  ON public.credentials FOR UPDATE
  USING (created_by = public.get_profile_id());

CREATE POLICY "Owners can delete credentials"
  ON public.credentials FOR DELETE
  USING (created_by = public.get_profile_id());

-- RLS Policies for executions
CREATE POLICY "Users can view executions for accessible workflows"
  ON public.executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows w
      WHERE w.id = workflow_id
      AND (
        public.is_workspace_member(w.workspace_id, public.get_profile_id())
        OR EXISTS (
          SELECT 1 FROM public.workflow_shares ws
          WHERE ws.workflow_id = w.id AND ws.profile_id = public.get_profile_id()
        )
      )
    )
  );

CREATE POLICY "Users can create executions for editable workflows"
  ON public.executions FOR INSERT
  WITH CHECK (public.can_edit_workflow(workflow_id, public.get_profile_id()));

-- RLS Policies for node_plugins (public read)
CREATE POLICY "Anyone can view active node plugins"
  ON public.node_plugins FOR SELECT
  USING (is_active = true);

-- RLS Policies for workflow_templates (public read)
CREATE POLICY "Anyone can view templates"
  ON public.workflow_templates FOR SELECT
  USING (true);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile_id UUID;
  new_workspace_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  RETURNING id INTO new_profile_id;
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, description, owner_id)
  VALUES ('My Workspace', 'Default workspace', new_profile_id)
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner of workspace
  INSERT INTO public.workspace_members (workspace_id, profile_id, role)
  VALUES (new_workspace_id, new_profile_id, 'owner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_node_plugins_updated_at
  BEFORE UPDATE ON public.node_plugins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for workflows
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.executions;