import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a server-side tracking expert. Analyze the given website URL and recommend optimal tracking configuration. Return JSON with tool call.`,
          },
          {
            role: "user",
            content: `Analyze this website for server-side tracking setup: ${url}. Consider what e-commerce platform it uses, what ad platforms would benefit from server-side tracking, and what privacy/data transforms are needed.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_tracking",
              description: "Return tracking configuration recommendations",
              parameters: {
                type: "object",
                properties: {
                  sources: { type: "array", items: { type: "string" }, description: "Recommended data sources (e.g., Web Pixel, Shopify, WooCommerce)" },
                  transforms: { type: "array", items: { type: "string" }, description: "Recommended data transforms (e.g., PII Anonymizer, Geo Enrichment, Bot Filter)" },
                  destinations: { type: "array", items: { type: "string" }, description: "Recommended destinations (e.g., Meta CAPI, Google Ads, GA4)" },
                  summary: { type: "string", description: "Brief explanation of why these recommendations were made" },
                },
                required: ["sources", "transforms", "destinations", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_tracking" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      sources: ["Web Pixel"],
      transforms: ["PII Anonymizer", "Bot Filter"],
      destinations: ["GA4"],
      summary: "Basic tracking setup recommended. Connect more sources for better data.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tracking-setup error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
