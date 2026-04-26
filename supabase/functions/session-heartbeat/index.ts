// Predictive Recovery — Session Heartbeat ingestion
// Receives lightweight pings from the browser carrying captured intent
// (cart contents, checkout step, lead form data). If the browser later
// crashes or the user leaves before the conversion fires, the recovery
// worker can rescue this data server-side.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Score how "rescue-worthy" this session is (0..1).
// Higher = more likely to convert, more revenue at stake.
function scoreIntent(intent_type: string | null, payload: any): number {
  if (!intent_type) return 0.1;
  let score = 0;
  switch (intent_type) {
    case "Purchase":
    case "AddPaymentInfo":
      score = 0.95;
      break;
    case "InitiateCheckout":
      score = 0.8;
      break;
    case "Lead":
    case "CompleteRegistration":
      score = 0.7;
      break;
    case "AddToCart":
      score = 0.5;
      break;
    case "ViewContent":
      score = 0.25;
      break;
    default:
      score = 0.3;
  }
  // Bonus for high-value carts
  const value = Number(payload?.value ?? payload?.custom_data?.value ?? 0);
  if (value >= 100) score = Math.min(1, score + 0.05);
  return score;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      workspace_id,
      session_token,
      visitor_id,
      page_url,
      intent_type,
      captured_payload,
      hashed_user_data,
    } = body ?? {};

    if (!workspace_id || !session_token) {
      return new Response(
        JSON.stringify({ error: "workspace_id and session_token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const ip_hash = await sha256(ip);
    const intent_score = scoreIntent(intent_type ?? null, captured_payload ?? {});

    // Upsert by (workspace_id, session_token); refresh heartbeat + payload
    const { error } = await supabase.from("predictive_sessions").upsert(
      {
        workspace_id,
        session_token,
        visitor_id: visitor_id ?? null,
        page_url: page_url ?? null,
        intent_type: intent_type ?? null,
        intent_score,
        captured_payload: captured_payload ?? {},
        hashed_user_data: hashed_user_data ?? {},
        user_agent: ua,
        ip_hash,
        status: "active",
        last_heartbeat_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,session_token" },
    );

    if (error) {
      console.error("session-heartbeat upsert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, intent_score }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
