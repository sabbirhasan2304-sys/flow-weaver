// Phase 0: track-event now enqueues to pgmq for sub-20ms response.
// The process-tracking-queue worker handles dedup, hashing, and DB inserts async.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-site-id, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TrackingEvent {
  event_name: string;
  event_id?: string;
  source?: string;
  destination?: string;
  payload?: Record<string, unknown>;
  user_data?: {
    email?: string;
    phone?: string;
    ip_address?: string;
    user_agent?: string;
    fbp?: string;
    fbc?: string;
    external_id?: string;
  };
  consent?: {
    ad_storage?: "granted" | "denied";
    analytics_storage?: "granted" | "denied";
    ad_user_data?: "granted" | "denied";
    ad_personalization?: "granted" | "denied";
  };
  page_url?: string;
  page_referrer?: string;
  timestamp?: string;
  server_side?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const siteId = req.headers.get("x-site-id");
    const apiKey = req.headers.get("x-api-key");

    if (!siteId && !apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing x-site-id or x-api-key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const events: TrackingEvent[] = Array.isArray(body) ? body : body.events ? body.events : [body];

    if (events.length === 0 || events.length > 100) {
      return new Response(
        JSON.stringify({ error: "Batch size must be 1-100 events" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Quick validation only — heavy lifting happens in worker
    for (const event of events) {
      if (!event.event_name || typeof event.event_name !== "string") {
        return new Response(
          JSON.stringify({ error: "Each event must have a valid event_name" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("cf-connecting-ip") ||
               "unknown";
    const ua = req.headers.get("user-agent") || "";
    const receivedAt = new Date().toISOString();

    // Enqueue each event for async processing — sub-20ms hot path
    const enqueueResults = await Promise.allSettled(
      events.map((event) =>
        supabase.rpc("enqueue_message", {
          queue_name: "tracking_events_queue",
          payload: {
            event,
            auth: { siteId, apiKey: apiKey ? apiKey.substring(0, 8) : null },
            request_meta: { ip, ua, received_at: receivedAt },
          },
        })
      )
    );

    const enqueued = enqueueResults.filter((r) => r.status === "fulfilled").length;
    const failed = enqueueResults.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      console.error("Enqueue failures:", failed);
    }

    return new Response(
      JSON.stringify({
        success: true,
        accepted: enqueued,
        failed,
        total: events.length,
        queued: true,
      }),
      {
        status: 202, // Accepted — processing async
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Track event error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
