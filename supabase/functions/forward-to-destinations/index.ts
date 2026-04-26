// Forward server-side conversion events to active marketing destinations.
// Currently supports: Meta CAPI, TikTok Events API, GA4 Measurement Protocol,
// Google Ads Enhanced Conversions for Web. Other platforms can be added by
// implementing a new handler that returns a {ok, status, error} record.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ForwardEvent {
  event_name: string;
  event_time?: number;
  event_id?: string;
  event_source_url?: string;
  action_source?: string;
  user_data?: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
  recovered?: boolean;
}

interface DestinationRow {
  id: string;
  user_id: string;
  platform: string;
  display_name: string;
  credentials: Record<string, string>;
  is_active: boolean;
}

interface DeliveryResult {
  platform: string;
  ok: boolean;
  status?: number;
  latency_ms: number;
  error?: string;
  request_id?: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - start };
}

// ────────────────────────────────────────────────────────────
// Meta Conversions API
// ────────────────────────────────────────────────────────────
async function sendMetaCAPI(event: ForwardEvent, creds: Record<string, string>): Promise<Omit<DeliveryResult, "platform" | "latency_ms">> {
  const pixelId = creds.pixel_id || creds.pixelId;
  const accessToken = creds.access_token || creds.accessToken;
  if (!pixelId || !accessToken) return { ok: false, error: "Missing pixel_id or access_token" };

  const payload = {
    data: [
      {
        event_name: event.event_name,
        event_time: event.event_time ?? Math.floor(Date.now() / 1000),
        event_id: event.event_id,
        action_source: event.action_source ?? "website",
        event_source_url: event.event_source_url,
        user_data: event.user_data ?? {},
        custom_data: event.custom_data ?? {},
      },
    ],
    ...(creds.test_event_code ? { test_event_code: creds.test_event_code } : {}),
  };

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const text = await res.text();
  let request_id: string | undefined;
  try { request_id = JSON.parse(text)?.fbtrace_id; } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, error: res.ok ? undefined : text.slice(0, 500), request_id };
}

// ────────────────────────────────────────────────────────────
// TikTok Events API v1.3
// ────────────────────────────────────────────────────────────
async function sendTikTok(event: ForwardEvent, creds: Record<string, string>): Promise<Omit<DeliveryResult, "platform" | "latency_ms">> {
  const pixelCode = creds.pixel_code || creds.pixelCode;
  const accessToken = creds.access_token || creds.accessToken;
  if (!pixelCode || !accessToken) return { ok: false, error: "Missing pixel_code or access_token" };

  const payload = {
    event_source: "web",
    event_source_id: pixelCode,
    data: [
      {
        event: event.event_name,
        event_time: event.event_time ?? Math.floor(Date.now() / 1000),
        event_id: event.event_id,
        user: event.user_data ?? {},
        properties: event.custom_data ?? {},
        page: { url: event.event_source_url },
      },
    ],
    ...(creds.test_event_code ? { test_event_code: creds.test_event_code } : {}),
  };

  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Access-Token": accessToken },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let request_id: string | undefined;
  try { request_id = JSON.parse(text)?.request_id; } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, error: res.ok ? undefined : text.slice(0, 500), request_id };
}

// ────────────────────────────────────────────────────────────
// GA4 Measurement Protocol
// ────────────────────────────────────────────────────────────
async function sendGA4(event: ForwardEvent, creds: Record<string, string>): Promise<Omit<DeliveryResult, "platform" | "latency_ms">> {
  const measurementId = creds.measurement_id || creds.measurementId;
  const apiSecret = creds.api_secret || creds.apiSecret;
  if (!measurementId || !apiSecret) return { ok: false, error: "Missing measurement_id or api_secret" };

  // Need a stable client_id; fall back to event_id or random
  const clientId =
    (event.user_data as Record<string, string> | undefined)?.client_id ||
    event.event_id ||
    `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;

  // Map our event names to GA4 conventions
  const ga4EventMap: Record<string, string> = {
    Purchase: "purchase",
    InitiateCheckout: "begin_checkout",
    AddPaymentInfo: "add_payment_info",
    AddToCart: "add_to_cart",
    Lead: "generate_lead",
    CompleteRegistration: "sign_up",
    ViewContent: "view_item",
  };
  const ga4Event = ga4EventMap[event.event_name] ?? event.event_name.toLowerCase();

  const payload = {
    client_id: String(clientId),
    events: [
      {
        name: ga4Event,
        params: { ...(event.custom_data ?? {}), page_location: event.event_source_url, recovered: event.recovered ? 1 : 0 },
      },
    ],
  };

  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
  );
  // GA4 returns 204 on success with empty body
  return { ok: res.status === 204 || res.ok, status: res.status, error: res.ok || res.status === 204 ? undefined : (await res.text()).slice(0, 500) };
}

// ────────────────────────────────────────────────────────────
// Google Ads Enhanced Conversions (Click Conversions API)
// ────────────────────────────────────────────────────────────
async function sendGoogleAds(event: ForwardEvent, creds: Record<string, string>): Promise<Omit<DeliveryResult, "platform" | "latency_ms">> {
  const developerToken = creds.developer_token;
  const customerId = creds.customer_id;
  const conversionActionId = creds.conversion_action_id;
  const oauthToken = creds.oauth_access_token;
  if (!developerToken || !customerId || !conversionActionId || !oauthToken) {
    return { ok: false, error: "Missing developer_token, customer_id, conversion_action_id or oauth_access_token" };
  }

  const userIdentifiers: Array<Record<string, string>> = [];
  const ud = event.user_data ?? {};
  if (ud.em) userIdentifiers.push({ hashedEmail: String(ud.em) });
  if (ud.ph) userIdentifiers.push({ hashedPhoneNumber: String(ud.ph) });

  const payload = {
    conversions: [
      {
        conversionAction: `customers/${customerId}/conversionActions/${conversionActionId}`,
        conversionDateTime: new Date((event.event_time ?? Math.floor(Date.now() / 1000)) * 1000)
          .toISOString()
          .replace("T", " ")
          .replace("Z", "+00:00"),
        conversionValue: Number((event.custom_data as Record<string, unknown> | undefined)?.value ?? 0),
        currencyCode: String((event.custom_data as Record<string, unknown> | undefined)?.currency ?? "USD"),
        userIdentifiers,
      },
    ],
    partialFailure: true,
  };

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}:uploadClickConversions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "developer-token": developerToken,
        Authorization: `Bearer ${oauthToken}`,
      },
      body: JSON.stringify(payload),
    },
  );
  const text = await res.text();
  return { ok: res.ok, status: res.status, error: res.ok ? undefined : text.slice(0, 500) };
}

// ────────────────────────────────────────────────────────────
// Dispatcher
// ────────────────────────────────────────────────────────────
const HANDLERS: Record<
  string,
  (event: ForwardEvent, creds: Record<string, string>) => Promise<Omit<DeliveryResult, "platform" | "latency_ms">>
> = {
  meta_capi: sendMetaCAPI,
  meta: sendMetaCAPI,
  facebook: sendMetaCAPI,
  tiktok: sendTikTok,
  tiktok_events: sendTikTok,
  ga4: sendGA4,
  google_analytics: sendGA4,
  google_ads: sendGoogleAds,
  googleads: sendGoogleAds,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workspace_id, event, recovered = false } = (await req.json()) as {
      workspace_id: string;
      event: ForwardEvent;
      recovered?: boolean;
    };

    if (!workspace_id || !event?.event_name) {
      return new Response(JSON.stringify({ error: "workspace_id and event.event_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Look up workspace owner — destinations are stored per auth user
    const { data: ws } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspace_id)
      .maybeSingle();

    const ownerProfileId = ws?.owner_id;
    if (!ownerProfileId) {
      return new Response(JSON.stringify({ error: "workspace owner not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", ownerProfileId)
      .maybeSingle();

    const ownerUserId = ownerProfile?.user_id;
    if (!ownerUserId) {
      return new Response(JSON.stringify({ error: "owner user_id not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: destinations } = await supabase
      .from("tracking_marketing_destinations")
      .select("id,user_id,platform,display_name,credentials,is_active")
      .eq("user_id", ownerUserId)
      .eq("is_active", true);

    const dests = (destinations ?? []) as DestinationRow[];

    const results: DeliveryResult[] = [];
    for (const dest of dests) {
      const handler = HANDLERS[dest.platform.toLowerCase()];
      if (!handler) {
        results.push({ platform: dest.platform, ok: false, latency_ms: 0, error: "No handler for platform" });
        continue;
      }
      try {
        const { value, ms } = await timed(() => handler(event, dest.credentials ?? {}));
        results.push({ platform: dest.platform, latency_ms: ms, ...value });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        results.push({ platform: dest.platform, ok: false, latency_ms: 0, error: msg });
      }
    }

    // Audit log — best effort, never fail the request on log error
    if (results.length > 0) {
      const logRows = results.map((r) => ({
        workspace_id,
        destination_platform: r.platform,
        event_name: event.event_name,
        http_status: r.status ?? null,
        latency_ms: r.latency_ms,
        success: r.ok,
        error_message: r.error ?? null,
        recovered,
        request_id: r.request_id ?? null,
      }));
      await supabase.from("destination_delivery_logs").insert(logRows);
    }

    const delivered = results.filter((r) => r.ok).map((r) => r.platform);
    const failed = results.filter((r) => !r.ok).map((r) => ({ platform: r.platform, error: r.error }));

    return new Response(
      JSON.stringify({ delivered, failed, total: results.length, recovered }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
