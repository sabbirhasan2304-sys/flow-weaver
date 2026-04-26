// Phase 0: Worker that drains tracking_events_queue.
// Dedups by fingerprint, hashes PII, inserts to tracking_events table.
// Triggered by pg_cron every minute (also can be triggered manually).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUEUE_NAME = "tracking_events_queue";
const DLQ_NAME = "tracking_events_dlq";
const BATCH_SIZE = 50;
const VISIBILITY_TIMEOUT = 60; // seconds
const MAX_RETRIES = 5;

interface QueuedEvent {
  event: {
    event_name: string;
    event_id?: string;
    source?: string;
    destination?: string;
    payload?: Record<string, unknown>;
    user_data?: Record<string, string>;
    consent?: Record<string, string>;
    page_url?: string;
    page_referrer?: string;
    timestamp?: string;
  };
  auth: { siteId: string | null; apiKey: string | null };
  request_meta: { ip: string; ua: string; received_at: string };
}

async function hashPII(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateFingerprint(eventName: string, pageUrl: string, ip: string, email: string, ts: string): Promise<string> {
  return await hashPII(`${eventName}|${pageUrl}|${ip}|${email}|${ts}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let totalProcessed = 0;
  let totalFailed = 0;
  let totalDuplicates = 0;
  let totalDlq = 0;

  try {
    // Drain in loops until queue is empty (or batch limit reached)
    for (let round = 0; round < 10; round++) {
      const { data: messages, error: readErr } = await supabase.rpc("read_message_batch", {
        queue_name: QUEUE_NAME,
        batch_size: BATCH_SIZE,
        vt: VISIBILITY_TIMEOUT,
      });

      if (readErr) {
        console.error("Read error:", readErr);
        break;
      }

      if (!messages || messages.length === 0) {
        break;
      }

      // Process each message
      const inserts: Array<Record<string, unknown>> = [];
      const messageIdsToDelete: number[] = [];
      const dlqCandidates: Array<{ msg_id: number; payload: unknown; reason: string }> = [];

      for (const msg of messages as Array<{ msg_id: number; read_ct: number; message: QueuedEvent }>) {
        try {
          // Retry-cap check
          if (msg.read_ct > MAX_RETRIES) {
            dlqCandidates.push({ msg_id: msg.msg_id, payload: msg.message, reason: "Max retries exceeded" });
            continue;
          }

          const { event, auth, request_meta } = msg.message;

          // Resolve user_id from auth
          let userId: string | null = null;
          if (auth.apiKey) {
            const { data: keyData } = await supabase
              .from("api_keys")
              .select("profile_id")
              .eq("key_prefix", auth.apiKey)
              .eq("is_active", true)
              .maybeSingle();
            if (keyData) userId = keyData.profile_id;
          }
          if (!userId && auth.siteId) {
            userId = auth.siteId;
          }

          if (!userId) {
            dlqCandidates.push({ msg_id: msg.msg_id, payload: msg.message, reason: "Invalid credentials" });
            continue;
          }

          // Hash PII
          const hashedUserData: Record<string, unknown> = {};
          const ud = event.user_data || {};
          if (ud.email) hashedUserData.em = await hashPII(ud.email);
          if (ud.phone) hashedUserData.ph = await hashPII(ud.phone);
          if (ud.external_id) hashedUserData.external_id = ud.external_id;
          if (ud.fbp) hashedUserData.fbp = ud.fbp;
          if (ud.fbc) hashedUserData.fbc = ud.fbc;

          const consentGranted = !event.consent || (
            event.consent.ad_storage !== "denied" &&
            event.consent.analytics_storage !== "denied"
          );

          const fingerprint = await generateFingerprint(
            event.event_name,
            event.page_url || "",
            request_meta.ip,
            ud.email || "",
            event.timestamp || request_meta.received_at
          );

          inserts.push({
            user_id: userId,
            event_name: event.event_name,
            source: event.source || "web",
            destination: event.destination || "server",
            status: "pending",
            payload: {
              ...event.payload,
              user_data: hashedUserData,
              consent: event.consent || {},
              page_url: event.page_url,
              page_referrer: event.page_referrer,
              ip_address: request_meta.ip,
              user_agent: request_meta.ua,
              server_side: true,
              consent_granted: consentGranted,
              event_id: event.event_id || crypto.randomUUID(),
            },
            event_fingerprint: fingerprint,
            retry_count: 0,
            created_at: event.timestamp || request_meta.received_at,
          });

          messageIdsToDelete.push(msg.msg_id);
        } catch (e) {
          console.error("Process error for msg", msg.msg_id, e);
          // Don't delete — let visibility timeout retry it
          totalFailed++;
        }
      }

      // Dedupe within batch + DB
      if (inserts.length > 0) {
        const fingerprints = inserts.map((i) => i.event_fingerprint as string);
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data: existing } = await supabase
          .from("tracking_events")
          .select("event_fingerprint")
          .in("event_fingerprint", fingerprints)
          .gte("created_at", fiveMinAgo);

        const existingSet = new Set((existing || []).map((e: { event_fingerprint: string }) => e.event_fingerprint));
        const newOnes = inserts.filter((i) => !existingSet.has(i.event_fingerprint as string));
        totalDuplicates += inserts.length - newOnes.length;

        if (newOnes.length > 0) {
          const { error: insertErr } = await supabase.from("tracking_events").insert(newOnes);
          if (insertErr) {
            console.error("Insert error:", insertErr);
            // Don't delete messages — they'll be retried
            continue;
          }
        }

        totalProcessed += newOnes.length;
      }

      // Delete successfully processed messages
      for (const id of messageIdsToDelete) {
        await supabase.rpc("delete_message", { queue_name: QUEUE_NAME, message_id: id });
      }

      // Move bad messages to DLQ
      for (const c of dlqCandidates) {
        await supabase.rpc("move_message_to_dlq", {
          source_queue: QUEUE_NAME,
          dlq_name: DLQ_NAME,
          message_id: c.msg_id,
          payload: { original: c.payload, reason: c.reason, dlq_at: new Date().toISOString() },
        });
        totalDlq++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        duplicates: totalDuplicates,
        failed: totalFailed,
        dlq: totalDlq,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Worker fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
