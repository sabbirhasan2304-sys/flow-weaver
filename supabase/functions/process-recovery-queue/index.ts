// Predictive Recovery Worker
// Scans predictive_sessions for stalled high-intent sessions whose
// heartbeat has expired (browser crashed / tab closed / network drop).
// For eligible ones, synthesises the conversion event server-side and
// forwards it to the workspace's marketing destinations via the existing
// tracking pipeline.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_TIMEOUT_SEC = 90;
const DEFAULT_MIN_INTENT = 0.6;
const BATCH_LIMIT = 50;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const startedAt = Date.now();

  // 1. Find stalled active sessions across all workspaces.
  // Worst-case heartbeat timeout — per-workspace rules refine this below.
  const cutoff = new Date(Date.now() - DEFAULT_TIMEOUT_SEC * 1000).toISOString();

  const { data: stalledSessions, error: fetchErr } = await supabase
    .from("predictive_sessions")
    .select("*")
    .eq("status", "active")
    .lt("last_heartbeat_at", cutoff)
    .gte("intent_score", DEFAULT_MIN_INTENT)
    .order("intent_score", { ascending: false })
    .limit(BATCH_LIMIT);

  if (fetchErr) {
    console.error("recovery: fetch stalled error", fetchErr);
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sessions = stalledSessions ?? [];
  let recoveredCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Cache rules per workspace
  const rulesCache = new Map<string, any>();

  for (const session of sessions) {
    try {
      // Fetch (and cache) recovery rules for this workspace
      let rules = rulesCache.get(session.workspace_id);
      if (!rules) {
        const { data: r } = await supabase
          .from("recovery_rules")
          .select("*")
          .eq("workspace_id", session.workspace_id)
          .maybeSingle();
        rules = r ?? {
          enabled: true,
          heartbeat_timeout_seconds: DEFAULT_TIMEOUT_SEC,
          min_intent_score: DEFAULT_MIN_INTENT,
          eligible_event_types: [
            "Purchase",
            "InitiateCheckout",
            "AddPaymentInfo",
            "Lead",
            "CompleteRegistration",
          ],
          forward_to_destinations: true,
        };
        rulesCache.set(session.workspace_id, rules);
      }

      if (!rules.enabled) {
        skippedCount++;
        continue;
      }

      // Re-check using workspace-specific timeout
      const sessionAge =
        (Date.now() - new Date(session.last_heartbeat_at).getTime()) / 1000;
      if (sessionAge < rules.heartbeat_timeout_seconds) {
        skippedCount++;
        continue;
      }

      // Eligible event type?
      const eventName = session.intent_type;
      if (!eventName || !rules.eligible_event_types.includes(eventName)) {
        // Mark as abandoned (not eligible) so we don't keep scanning it.
        await supabase
          .from("predictive_sessions")
          .update({ status: "abandoned" })
          .eq("id", session.id);
        skippedCount++;
        continue;
      }

      // Synthesise the conversion event from captured payload
      const recoveredEvent = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: session.page_url,
        user_data: session.hashed_user_data ?? {},
        custom_data: session.captured_payload ?? {},
        recovered: true,
        recovery_reason: "client_heartbeat_lost",
      };

      // 1. Insert the audit-trail row (status=pending)
      const { data: recoveredRow, error: insertErr } = await supabase
        .from("recovered_events")
        .insert({
          workspace_id: session.workspace_id,
          session_id: session.id,
          event_name: eventName,
          event_payload: recoveredEvent,
          recovery_reason: "client_heartbeat_lost",
          intent_score: session.intent_score,
          status: "pending",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 2. Forward to active marketing destinations (Meta, TikTok, GA4, Google Ads).
      let deliveredPlatforms: string[] = ["tracking_pipeline"];
      let forwardError: string | null = null;
      if (rules.forward_to_destinations) {
        try {
          const { data: forwardRes, error: fwdErr } = await supabase.functions.invoke(
            "forward-to-destinations",
            {
              body: {
                workspace_id: session.workspace_id,
                event: recoveredEvent,
                recovered: true,
              },
            },
          );
          if (fwdErr) throw fwdErr;
          const delivered = (forwardRes as { delivered?: string[] } | null)?.delivered ?? [];
          deliveredPlatforms = delivered.length > 0 ? delivered : ["no_active_destinations"];
        } catch (e) {
          forwardError = e instanceof Error ? e.message : "forward failed";
          deliveredPlatforms = [];
        }

        // Also push into the tracking pipeline so the event gets recorded
        // and re-sent to any newly-added destinations later.
        await supabase.rpc("enqueue_message", {
          queue_name: "tracking_events_queue",
          payload: {
            event: recoveredEvent,
            auth: { workspace_id: session.workspace_id, source: "recovery", siteId: session.workspace_id },
            request_meta: {
              ip: null,
              ua: session.user_agent,
              recovered: true,
              session_id: session.id,
            },
          },
        });

        await supabase
          .from("recovered_events")
          .update({
            status: forwardError ? "failed" : "forwarded",
            forwarded_at: new Date().toISOString(),
            destinations_forwarded: deliveredPlatforms,
            error_message: forwardError,
          })
          .eq("id", recoveredRow.id);
      }

      // 3. Mark session as recovered
      await supabase
        .from("predictive_sessions")
        .update({
          status: "recovered",
          recovered_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      recoveredCount++;
    } catch (e) {
      failedCount++;
      const msg = e instanceof Error ? e.message : "unknown";
      console.error("recovery: session failed", session.id, msg);
      await supabase
        .from("predictive_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);
    }
  }

  const result = {
    scanned: sessions.length,
    recovered: recoveredCount,
    skipped: skippedCount,
    failed: failedCount,
    duration_ms: Date.now() - startedAt,
  };
  console.log("recovery batch complete", result);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
