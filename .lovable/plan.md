

## Plan: Implement 4 Advanced Features for BiztoriBD

Based on your selection, here are the 4 features to implement in a single batch, along with testing for each.

---

### Feature 1: Real Webhook Triggers

**What it does:** Each workflow gets a unique webhook URL. External services can POST data to it, which triggers the workflow automatically.

**Implementation:**
- Create a `webhook-trigger` edge function that accepts POST requests at `/webhook-trigger?workflow_id=<id>`
- The function looks up the workflow, validates it's active, then calls `execute-workflow` internally
- Add a `webhook_url` column to the `workflows` table (or derive it from workflow ID)
- In the Workflow Editor UI, show a "Webhook URL" card when a webhook trigger node is selected, with a copy button
- Add a "Test Webhook" button that sends a sample POST request

**Database changes:**
- Add `webhook_secret` (text, nullable) column to `workflows` table for optional HMAC validation

---

### Feature 2: Workflow Version History & Rollback

**What it does:** Every time a workflow is saved, a snapshot is stored. Users can browse previous versions and restore any one.

**Implementation:**
- Create a `workflow_versions` table: `id`, `workflow_id`, `version_number`, `data` (jsonb), `created_by`, `created_at`, `description`
- Add RLS policies matching workflow access patterns
- Create a database trigger or application-level logic: on workflow UPDATE, insert the old `data` into `workflow_versions`
- Add a "Version History" panel in the Workflow Editor (sidebar drawer) showing a timeline of saves
- Each version entry has a "Restore" button that overwrites current workflow data

**Database changes:**
- New `workflow_versions` table with RLS

---

### Feature 3: Real-Time Execution Logs (Live Streaming)

**What it does:** When a workflow executes, node-by-node progress streams live to the UI instead of showing results only after completion.

**Implementation:**
- Enable Realtime on the `executions` table (`ALTER PUBLICATION supabase_realtime ADD TABLE public.executions`)
- Add an UPDATE RLS policy on `executions` so the edge function (via service role) can update logs mid-execution
- Modify the `execute-workflow` edge function to UPDATE the execution record's `logs` field after each node completes
- In the ExecutionPanel UI, subscribe to Realtime changes on the active execution ID and render logs as they arrive with animated node highlighting

**Database changes:**
- Add UPDATE policy on `executions` for service-role updates
- Enable realtime publication

---

### Feature 4: Scheduled Workflow Runs (Cron Jobs)

**What it does:** Users can set a workflow to run on a schedule (every 5 min, hourly, daily, weekly, custom cron).

**Implementation:**
- Create a `workflow_schedules` table: `id`, `workflow_id`, `cron_expression`, `is_active`, `last_run_at`, `next_run_at`, `created_at`
- Create a `process-scheduled-workflows` edge function that queries active schedules where `next_run_at <= now()`, executes each workflow, and updates `last_run_at`/`next_run_at`
- Use `pg_cron` + `pg_net` to call this edge function every minute
- Add a "Schedule" UI in the workflow editor toolbar (dialog with preset options: every 5 min, hourly, daily, weekly, custom cron expression)
- Show schedule status badge on dashboard workflow cards

**Database changes:**
- New `workflow_schedules` table with RLS
- Enable `pg_cron` and `pg_net` extensions
- Create cron job to invoke the processing function every minute

---

### Testing Plan

After implementation, each feature will be tested:
1. **Webhooks** -- copy the webhook URL and send a test POST via the API test panel
2. **Version History** -- save a workflow twice, open history, verify both versions appear, restore one
3. **Live Logs** -- execute a multi-node workflow and verify logs stream in real-time in the UI
4. **Schedules** -- create a 1-minute schedule, wait, verify an execution appears in the Executions page

---

### Technical Notes

- All new tables get RLS policies matching existing workspace-based access patterns
- Edge functions use `verify_jwt = false` with manual auth validation (matching existing pattern)
- The cron job SQL will be inserted via the insert tool (not migration) since it contains project-specific URLs
- Realtime subscription uses the existing Supabase client pattern

