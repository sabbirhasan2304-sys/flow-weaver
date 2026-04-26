// Phase 1: Ghost Loader ingest alias
// Receives polymorphic events at /track-event-alias/<endpoint_alias> and forwards
// them to the standard tracking queue. Each batch may contain multiple events.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const alias = parts[parts.length - 1];
    const siteId = req.headers.get("x-site-id");

    if (!alias || !siteId) {
      return new Response(JSON.stringify({ error: "Missing alias or site id" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate alias maps to an active variant for the workspace
    const { data: variant } = await supabase
      .from("script_variants")
      .select("workspace_id, is_active, expires_at")
      .eq("endpoint_alias", alias)
      .eq("workspace_id", siteId)
      .eq("is_active", true)
      .maybeSingle();

    if (!variant) {
      // Reject silently with 204 to avoid leaking endpoint validity to scrapers
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const body = await req.json().catch(() => null) as { events?: Array<Record<string, unknown>> } | null;
    const events = Array.isArray(body?.events) ? body!.events : [];

    if (!events.length) {
      return new Response(JSON.stringify({ accepted: 0 }), {
        status: 202,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const requestMeta = {
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: req.headers.get("user-agent") || null,
      received_at: new Date().toISOString(),
      via: "ghost",
    };

    let enqueued = 0;
    for (const ev of events) {
      const payload = {
        event: {
          event_name: String((ev as { n?: unknown }).n ?? "unknown"),
          payload: (ev as { p?: unknown }).p ?? {},
          page_url: (ev as { u?: unknown }).u ?? null,
          page_referrer: (ev as { r?: unknown }).r ?? null,
          timestamp: (ev as { t?: unknown }).t ?? Date.now(),
          source: "ghost-loader",
        },
        auth: { site_id: siteId },
        request_meta: requestMeta,
      };
      const { error } = await supabase.rpc("enqueue_message", {
        queue_name: "tracking_events_queue",
        payload,
      });
      if (!error) enqueued++;
    }

    return new Response(JSON.stringify({ accepted: enqueued }), {
      status: 202,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
