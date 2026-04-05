import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rawEvent, destination } = await req.json();
    if (!rawEvent || !destination) {
      return new Response(JSON.stringify({ error: "rawEvent and destination are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const destinationSchemas: Record<string, string> = {
      meta_capi: `Meta Conversions API schema: event_name (string, e.g. Purchase/Lead/ViewContent), event_time (unix timestamp), user_data (em, ph, fn, ln, ct, st, zp, country, external_id, client_ip_address, client_user_agent, fbc, fbp), custom_data (value, currency, content_name, content_category, content_ids, content_type, contents, num_items, order_id), action_source (website/app/email), event_source_url`,
      ga4: `GA4 Measurement Protocol schema: client_id, user_id (optional), events[].name, events[].params (items[], value, currency, transaction_id, engagement_time_msec, session_id)`,
      tiktok: `TikTok Events API schema: event (e.g. CompletePayment/ViewContent/AddToCart), event_time (ISO 8601), user (email, phone, external_id, ip, user_agent, ttp), properties (contents[].content_id/content_name/price/quantity, value, currency, order_id)`,
      google_ads: `Google Ads Enhanced Conversions schema: conversion_action, conversion_date_time, conversion_value, currency_code, user_identifiers (hashed_email, hashed_phone_number, address_info)`,
      snapchat: `Snapchat CAPI schema: event_type, event_conversion_type, timestamp, hashed_email, hashed_phone, item_ids, price, currency, transaction_id, event_tag`,
      pinterest: `Pinterest CAPI schema: event_name (checkout/add_to_cart/page_visit/lead), action_source, event_time, user_data (em, hashed_maids), custom_data (value, currency, content_ids, num_items, order_id)`,
      linkedin: `LinkedIn CAPI schema: conversion (name), conversionHappenedAt, user (userIds, userInfo.firstName/lastName/companyName/countryCode), eventId`,
      klaviyo: `Klaviyo Track API schema: event (string), customer_properties ($email, $phone_number, $first_name, $last_name), properties (value, items[], $event_id), time (unix timestamp)`,
    };

    const schemaDesc = destinationSchemas[destination] || `${destination} API — map fields to the most logical structure`;

    const systemPrompt = `You are an expert data engineer specializing in marketing event tracking. Your job is to map raw dataLayer/webhook event JSON to destination-specific schemas.

Given a raw event payload and a target destination schema, produce a field mapping configuration.

Rules:
- Map every relevant field from the source to the destination schema
- Use dot notation for nested fields (e.g., "user_data.em" or "payload.items[0].id")
- If a source field needs transformation (hashing, type conversion, renaming), note it
- Include confidence score (0-1) for each mapping
- Flag any required destination fields that have no source match
- Suggest default values where appropriate

Target destination: ${schemaDesc}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Map this raw event to ${destination}:\n\n${JSON.stringify(rawEvent, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_field_mapping",
            description: "Create a structured field mapping from source event to destination schema",
            parameters: {
              type: "object",
              properties: {
                mappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      source_field: { type: "string", description: "Dot-notation path in source event" },
                      destination_field: { type: "string", description: "Dot-notation path in destination schema" },
                      transform: { type: "string", description: "Transformation needed: none, sha256_hash, to_unix_timestamp, to_lowercase, to_cents, to_string, to_number, default_value" },
                      default_value: { type: "string", description: "Default value if source is missing" },
                      confidence: { type: "number", description: "Confidence score 0-1" },
                      notes: { type: "string", description: "Any notes about this mapping" },
                    },
                    required: ["source_field", "destination_field", "transform", "confidence"],
                    additionalProperties: false,
                  },
                },
                unmapped_required: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      suggestion: { type: "string" },
                    },
                    required: ["field", "suggestion"],
                    additionalProperties: false,
                  },
                },
                detected_event_type: { type: "string", description: "The detected event type (e.g. Purchase, PageView)" },
                summary: { type: "string", description: "Brief summary of the mapping" },
              },
              required: ["mappings", "unmapped_required", "detected_event_type", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_field_mapping" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No mapping result returned");

    const mapping = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(mapping), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-event-mapper error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
