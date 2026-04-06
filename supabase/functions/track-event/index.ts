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

function hashPII(value: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  return Array.from(new Uint8Array(data))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateFingerprint(event: TrackingEvent, ip: string): string {
  const raw = `${event.event_name}|${event.page_url || ""}|${ip}|${event.user_data?.email || ""}|${event.timestamp || ""}`;
  return hashPII(raw);
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

    // Validate each event
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

    // Look up the site owner
    let userId: string | null = null;

    if (apiKey) {
      // Validate API key
      const keyPrefix = apiKey.substring(0, 8);
      const { data: keyData } = await supabase
        .from("api_keys")
        .select("profile_id")
        .eq("key_prefix", keyPrefix)
        .eq("is_active", true)
        .maybeSingle();
      if (keyData) userId = keyData.profile_id;
    }

    if (!userId && siteId) {
      // siteId is the profile_id for simplicity
      userId = siteId;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";
    const ua = req.headers.get("user-agent") || "";
    const now = new Date().toISOString();

    const processedEvents = events.map((event) => {
      const fingerprint = generateFingerprint(event, ip);

      // Hash PII before storage
      const hashedUserData: Record<string, unknown> = {};
      if (event.user_data) {
        if (event.user_data.email) hashedUserData.em = hashPII(event.user_data.email);
        if (event.user_data.phone) hashedUserData.ph = hashPII(event.user_data.phone);
        if (event.user_data.external_id) hashedUserData.external_id = event.user_data.external_id;
        if (event.user_data.fbp) hashedUserData.fbp = event.user_data.fbp;
        if (event.user_data.fbc) hashedUserData.fbc = event.user_data.fbc;
      }

      // Determine consent status
      const consentGranted = !event.consent || (
        event.consent.ad_storage !== "denied" && 
        event.consent.analytics_storage !== "denied"
      );

      return {
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
          ip_address: ip,
          user_agent: ua,
          server_side: true,
          consent_granted: consentGranted,
          event_id: event.event_id || crypto.randomUUID(),
        },
        event_fingerprint: fingerprint,
        retry_count: 0,
        created_at: event.timestamp || now,
      };
    });

    // Deduplicate by fingerprint (within batch)
    const seen = new Set<string>();
    const uniqueEvents = processedEvents.filter((e) => {
      if (seen.has(e.fingerprint)) return false;
      seen.add(e.fingerprint);
      return true;
    });

    // Check for existing fingerprints in last 5 minutes (dedup window)
    const fingerprints = uniqueEvents.map((e) => e.fingerprint);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: existingEvents } = await supabase
      .from("tracking_events")
      .select("fingerprint")
      .in("fingerprint", fingerprints)
      .gte("created_at", fiveMinAgo);

    const existingFingerprints = new Set((existingEvents || []).map((e: any) => e.fingerprint));
    const newEvents = uniqueEvents.filter((e) => !existingFingerprints.has(e.fingerprint));
    const duplicateCount = uniqueEvents.length - newEvents.length;

    if (newEvents.length > 0) {
      const { error: insertError } = await supabase
        .from("tracking_events")
        .insert(newEvents);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to store events", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        accepted: newEvents.length,
        duplicates: duplicateCount,
        total: events.length,
        event_ids: newEvents.map((e) => e.event_id),
      }),
      {
        status: 200,
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
