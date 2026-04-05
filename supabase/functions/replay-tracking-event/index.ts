import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { event_ids } = await req.json();
    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return new Response(JSON.stringify({ error: "event_ids array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch the failed events
    const { data: events, error: fetchError } = await supabase
      .from("tracking_events")
      .select("*")
      .in("id", event_ids)
      .eq("status", "failed");

    if (fetchError) throw fetchError;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ error: "No eligible events found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Simulate replay: mark events as retried
    const { error: updateError } = await supabase
      .from("tracking_events")
      .update({ status: "retried", retry_count: events[0].retry_count + 1 })
      .in("id", event_ids);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ replayed: events.length, message: `${events.length} event(s) queued for replay` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
