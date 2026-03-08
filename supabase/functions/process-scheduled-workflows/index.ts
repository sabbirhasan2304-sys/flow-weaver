import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple cron next-run calculator
function getNextRun(cronExpression: string, from: Date): Date {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return new Date(from.getTime() + 3600000); // default 1hr

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const next = new Date(from);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Simple presets
  if (cronExpression === '*/5 * * * *') {
    next.setMinutes(next.getMinutes() + 5 - (next.getMinutes() % 5));
    if (next <= from) next.setMinutes(next.getMinutes() + 5);
    return next;
  }
  if (cronExpression === '0 * * * *') {
    next.setMinutes(0);
    next.setHours(next.getHours() + 1);
    return next;
  }
  if (cronExpression === '0 0 * * *') {
    next.setMinutes(0);
    next.setHours(0);
    next.setDate(next.getDate() + 1);
    return next;
  }
  if (cronExpression === '0 0 * * 1') {
    next.setMinutes(0);
    next.setHours(0);
    const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
    next.setDate(next.getDate() + daysUntilMonday);
    return next;
  }

  // Fallback: add 1 hour
  next.setHours(next.getHours() + 1);
  return next;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();

    // Get due schedules
    const { data: dueSchedules, error } = await supabase
      .from('workflow_schedules')
      .select('*, workflows!inner(id, is_active)')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString());

    if (error) {
      console.error('Error fetching schedules:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const schedule of (dueSchedules || [])) {
      // Only run active workflows
      if (!schedule.workflows?.is_active) continue;

      try {
        // Execute workflow
        const executeResponse = await fetch(`${supabaseUrl}/functions/v1/execute-workflow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            workflowId: schedule.workflow_id,
            inputData: { _scheduled: true, scheduledAt: now.toISOString(), cronExpression: schedule.cron_expression },
            testMode: false,
          }),
        });

        const result = await executeResponse.json();

        // Update schedule
        const nextRun = getNextRun(schedule.cron_expression, now);
        await supabase
          .from('workflow_schedules')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', schedule.id);

        results.push({ scheduleId: schedule.id, workflowId: schedule.workflow_id, success: true, executionId: result.executionId });
      } catch (err) {
        results.push({ scheduleId: schedule.id, workflowId: schedule.workflow_id, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
