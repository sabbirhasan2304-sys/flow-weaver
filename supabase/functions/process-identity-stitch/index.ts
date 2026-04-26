// Phase 2: Cookieless Identity Stitching Worker
// Drains identity_stitch_queue. For each event, extracts signatures, looks up
// matching profiles using rules first; falls back to Gemini Flash Lite for ambiguous cases.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUEUE_NAME = "identity_stitch_queue";
const DLQ_NAME = "identity_stitch_dlq";
const BATCH_SIZE = 25;
const VISIBILITY_TIMEOUT = 60;
const MAX_RETRIES = 3;

// Hard signals that auto-merge with 1.0 confidence
const HARD_SIGNAL_TYPES = new Set(["email_hash", "phone_hash", "external_id", "cookie_id"]);
// Soft signals — used only when no hard match
const SOFT_SIGNAL_TYPES = new Set(["fingerprint", "ip_subnet_ua"]);

interface StitchTask {
  workspace_id: string;
  signatures: Array<{ type: string; value: string }>;
  context: {
    event_name?: string;
    page_url?: string;
    user_agent?: string;
    ip_subnet?: string;
    timestamp?: string;
  };
}

interface ProfileRow {
  id: string;
  workspace_id: string;
  display_label: string | null;
  confidence_score: number;
  signal_count: number;
  merged_into_id: string | null;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Resolve a profile to its canonical "head" (follow merged_into_id chain)
async function resolveCanonical(supabase: SupabaseClient, profileId: string): Promise<string> {
  let current = profileId;
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("identity_profiles")
      .select("id, merged_into_id")
      .eq("id", current)
      .maybeSingle();
    if (!data) return current;
    if (!data.merged_into_id) return data.id;
    current = data.merged_into_id;
  }
  return current;
}

// Look up which profiles match each signature (via signature lookup table)
async function findMatchingProfiles(
  supabase: SupabaseClient,
  workspaceId: string,
  signatures: Array<{ type: string; value: string }>
): Promise<Map<string, { profileId: string; signalType: string }[]>> {
  const result = new Map<string, { profileId: string; signalType: string }[]>();
  if (signatures.length === 0) return result;

  // Batch query all sig values
  const orConds = signatures
    .map((s) => `and(signature_type.eq.${s.type},signature_value.eq.${s.value})`)
    .join(",");

  const { data } = await supabase
    .from("identity_signatures")
    .select("profile_id, signature_type, signature_value")
    .eq("workspace_id", workspaceId)
    .or(orConds);

  for (const row of (data || []) as Array<{ profile_id: string; signature_type: string; signature_value: string }>) {
    const key = `${row.signature_type}:${row.signature_value}`;
    if (!result.has(key)) result.set(key, []);
    result.get(key)!.push({ profileId: row.profile_id, signalType: row.signature_type });
  }
  return result;
}

// Call Gemini Flash Lite for ambiguous cases
async function aiResolveAmbiguity(args: {
  candidates: Array<{ profile_id: string; matched_signals: string[]; signal_count: number }>;
  current_signatures: Array<{ type: string; value_preview: string }>;
  context: StitchTask["context"];
}): Promise<{ decision: "merge_all" | "merge_top" | "create_new"; targetProfileId?: string; confidence: number; reason: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    // Conservative fallback: don't merge, create new
    return { decision: "create_new", confidence: 0.3, reason: "AI unavailable; conservative new profile" };
  }

  const prompt = `You are an identity resolution expert. Decide whether observed signals belong to one of the candidate profiles or a new person.

Current observed signals:
${JSON.stringify(args.current_signatures, null, 2)}

Context:
${JSON.stringify(args.context, null, 2)}

Candidate profiles (each shows which of the current signals matched):
${JSON.stringify(args.candidates, null, 2)}

Rules:
- If multiple candidates clearly match the same person (signal overlap), respond merge_all and pick the candidate with the highest signal_count as target.
- If exactly one candidate has a strong soft-signal match (fingerprint or ip_subnet_ua), respond merge_top with that candidate.
- If signals are too weak or conflicting (e.g. same IP but very different fingerprints across distant times), respond create_new.

Respond ONLY with JSON: {"decision":"merge_all"|"merge_top"|"create_new","target_profile_id":"<uuid or null>","confidence":0.0-1.0,"reason":"short explanation"}`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You output ONLY valid JSON. No markdown, no commentary." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!r.ok) {
      console.error("AI ambiguity resolver HTTP", r.status);
      return { decision: "create_new", confidence: 0.3, reason: `AI HTTP ${r.status}` };
    }

    const json = await r.json();
    const text = json?.choices?.[0]?.message?.content || "{}";
    // Extract JSON if wrapped
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text);
    return {
      decision: parsed.decision === "merge_all" || parsed.decision === "merge_top" ? parsed.decision : "create_new",
      targetProfileId: parsed.target_profile_id || undefined,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      reason: parsed.reason || "ai resolved",
    };
  } catch (e) {
    console.error("AI parse failed", e);
    return { decision: "create_new", confidence: 0.3, reason: "AI parse failed" };
  }
}

async function processTask(supabase: SupabaseClient, task: StitchTask): Promise<void> {
  const { workspace_id, signatures, context } = task;
  if (!workspace_id || !signatures?.length) return;

  // 1. Find which profiles already match any of these signatures
  const matchMap = await findMatchingProfiles(supabase, workspace_id, signatures);

  // Group: distinct profiles found, separated by hard vs soft matches
  const profileMatches = new Map<string, { hard: number; soft: number; signals: string[] }>();
  for (const [_key, hits] of matchMap.entries()) {
    for (const h of hits) {
      const canonical = await resolveCanonical(supabase, h.profileId);
      if (!profileMatches.has(canonical)) profileMatches.set(canonical, { hard: 0, soft: 0, signals: [] });
      const slot = profileMatches.get(canonical)!;
      if (HARD_SIGNAL_TYPES.has(h.signalType)) slot.hard++;
      else slot.soft++;
      slot.signals.push(h.signalType);
    }
  }

  let targetProfileId: string | null = null;
  let method: "rules" | "ai" | "manual" = "rules";
  let confidence = 0.5;
  let reason = "";
  let aiModel: string | null = null;

  // 2. Rules engine
  const profilesArr = Array.from(profileMatches.entries()).map(([id, info]) => ({ id, ...info }));
  const hardMatches = profilesArr.filter((p) => p.hard > 0);

  if (hardMatches.length === 1) {
    // Single profile matched by a strong identifier → confident merge
    targetProfileId = hardMatches[0].id;
    confidence = 1.0;
    reason = `hard signal: ${hardMatches[0].signals.join(",")}`;
  } else if (hardMatches.length > 1) {
    // Multiple profiles share strong identifiers → merge them all into the most-signal-rich one
    const sorted = await Promise.all(
      hardMatches.map(async (p) => {
        const { data } = await supabase
          .from("identity_profiles")
          .select("id, signal_count")
          .eq("id", p.id)
          .maybeSingle();
        return { ...p, signal_count: data?.signal_count || 0 };
      })
    );
    sorted.sort((a, b) => b.signal_count - a.signal_count);
    targetProfileId = sorted[0].id;
    confidence = 0.95;
    reason = `merged ${sorted.length} profiles by hard signal overlap`;

    // Merge the others into target
    for (const loser of sorted.slice(1)) {
      await supabase
        .from("identity_profiles")
        .update({ merged_into_id: targetProfileId })
        .eq("id", loser.id);
      // Repoint signatures
      await supabase
        .from("identity_signatures")
        .update({ profile_id: targetProfileId })
        .eq("profile_id", loser.id);
      await supabase.from("identity_match_decisions").insert({
        workspace_id,
        source_profile_id: loser.id,
        target_profile_id: targetProfileId,
        method: "rules",
        decision: "merged",
        confidence: 0.95,
        reason,
      });
    }
  } else {
    // No hard matches — check soft
    const softMatches = profilesArr.filter((p) => p.soft > 0);
    if (softMatches.length === 1 && softMatches[0].soft >= 2) {
      // Single profile with multiple soft hits — confident enough
      targetProfileId = softMatches[0].id;
      confidence = 0.85;
      reason = `multi-soft signal: ${softMatches[0].signals.join(",")}`;
    } else if (softMatches.length === 1 && softMatches[0].soft === 1) {
      // Single profile with one soft hit — borderline, accept with medium confidence
      targetProfileId = softMatches[0].id;
      confidence = 0.7;
      reason = `single soft signal: ${softMatches[0].signals.join(",")}`;
    } else if (softMatches.length > 1) {
      // AMBIGUOUS — multiple profiles claim soft signals → ask Gemini
      method = "ai";
      aiModel = "google/gemini-2.5-flash-lite";
      const ai = await aiResolveAmbiguity({
        candidates: await Promise.all(
          softMatches.map(async (p) => {
            const { data } = await supabase
              .from("identity_profiles")
              .select("signal_count")
              .eq("id", p.id)
              .maybeSingle();
            return {
              profile_id: p.id,
              matched_signals: p.signals,
              signal_count: data?.signal_count || 0,
            };
          })
        ),
        current_signatures: signatures.map((s) => ({ type: s.type, value_preview: s.value.slice(0, 8) })),
        context,
      });
      reason = `ai: ${ai.reason}`;
      confidence = ai.confidence;

      if (ai.decision === "merge_top" && ai.targetProfileId) {
        targetProfileId = ai.targetProfileId;
      } else if (ai.decision === "merge_all") {
        // Merge all soft candidates into the AI-chosen target (or top by signal_count)
        const target = ai.targetProfileId || softMatches.sort((a, b) => b.soft - a.soft)[0].id;
        targetProfileId = target;
        for (const loser of softMatches.filter((p) => p.id !== target)) {
          await supabase
            .from("identity_profiles")
            .update({ merged_into_id: target })
            .eq("id", loser.id);
          await supabase
            .from("identity_signatures")
            .update({ profile_id: target })
            .eq("profile_id", loser.id);
          await supabase.from("identity_match_decisions").insert({
            workspace_id,
            source_profile_id: loser.id,
            target_profile_id: target,
            method: "ai",
            decision: "merged",
            confidence,
            reason,
            ai_model: aiModel,
            ambiguous_features: { matched_profiles: softMatches.map((p) => p.id) },
          });
        }
      }
      // else: create_new → fall through to create
    }
  }

  // 3. Create new profile if no target
  if (!targetProfileId) {
    const { data: newProf } = await supabase
      .from("identity_profiles")
      .insert({
        workspace_id,
        display_label: null,
        confidence_score: confidence || 0.5,
        signal_count: signatures.length,
      })
      .select("id")
      .single();
    targetProfileId = newProf!.id as string;
    await supabase.from("identity_match_decisions").insert({
      workspace_id,
      target_profile_id: targetProfileId,
      method,
      decision: "created",
      confidence: confidence || 0.5,
      reason: reason || "no matches; new profile",
      ai_model: aiModel,
    });
  } else {
    // Log the merge/match decision (for non-merge_all paths above)
    await supabase.from("identity_match_decisions").insert({
      workspace_id,
      target_profile_id: targetProfileId,
      method,
      decision: "merged",
      confidence,
      reason,
      ai_model: aiModel,
    });
  }

  // 4. Upsert all signatures onto the target profile
  for (const sig of signatures) {
    // Try update first (increment seen_count)
    const { data: existing } = await supabase
      .from("identity_signatures")
      .select("id, seen_count")
      .eq("workspace_id", workspace_id)
      .eq("signature_type", sig.type)
      .eq("signature_value", sig.value)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("identity_signatures")
        .update({
          profile_id: targetProfileId,
          seen_count: (existing.seen_count || 0) + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("identity_signatures").insert({
        workspace_id,
        profile_id: targetProfileId,
        signature_type: sig.type,
        signature_value: sig.value,
      });
    }
  }

  // 5. Bump profile signal_count + last_seen
  const { data: prof } = await supabase
    .from("identity_profiles")
    .select("signal_count")
    .eq("id", targetProfileId)
    .single();

  await supabase
    .from("identity_profiles")
    .update({
      signal_count: (prof?.signal_count || 0) + signatures.length,
      last_seen_at: new Date().toISOString(),
      confidence_score: Math.max(0.5, confidence),
    })
    .eq("id", targetProfileId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let processed = 0;
  let dlq = 0;
  let failed = 0;

  try {
    for (let round = 0; round < 5; round++) {
      const { data: messages, error } = await supabase.rpc("read_message_batch", {
        queue_name: QUEUE_NAME,
        batch_size: BATCH_SIZE,
        vt: VISIBILITY_TIMEOUT,
      });
      if (error) {
        console.error("read error", error);
        break;
      }
      if (!messages || messages.length === 0) break;

      for (const msg of messages as Array<{ msg_id: number; read_ct: number; message: StitchTask }>) {
        try {
          if (msg.read_ct > MAX_RETRIES) {
            await supabase.rpc("move_message_to_dlq", {
              source_queue: QUEUE_NAME,
              dlq_name: DLQ_NAME,
              message_id: msg.msg_id,
              payload: { original: msg.message, reason: "max retries", dlq_at: new Date().toISOString() },
            });
            dlq++;
            continue;
          }
          await processTask(supabase, msg.message);
          await supabase.rpc("delete_message", { queue_name: QUEUE_NAME, message_id: msg.msg_id });
          processed++;
        } catch (e) {
          console.error("stitch task failed", msg.msg_id, e);
          failed++;
          // Don't delete; visibility timeout will retry
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, dlq }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
