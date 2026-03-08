
-- Fix: just verify the tables exist (the previous migration partially succeeded)
-- Check if workflow_versions exists, if not create it
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_versions' AND table_schema = 'public') THEN
    CREATE TABLE public.workflow_versions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id uuid REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
      version_number integer NOT NULL,
      data jsonb NOT NULL,
      created_by uuid REFERENCES public.profiles(id),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      description text
    );
    ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_schedules' AND table_schema = 'public') THEN
    CREATE TABLE public.workflow_schedules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id uuid REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
      cron_expression text NOT NULL DEFAULT '0 * * * *',
      is_active boolean NOT NULL DEFAULT false,
      last_run_at timestamp with time zone,
      next_run_at timestamp with time zone,
      created_by uuid REFERENCES public.profiles(id),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      UNIQUE(workflow_id)
    );
    ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
