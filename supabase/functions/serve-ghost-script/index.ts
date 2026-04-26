// Phase 1: Polymorphic Ghost Loader
// Serves a per-workspace, per-variant tracking script with rotated identifiers,
// shuffled AST, decoy globals, and an aliased event endpoint.
// Path: /serve-ghost-script/<slug>/<token>.js OR /serve-ghost-script?ws=<id>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const ADJECTIVES = ["swift", "calm", "bright", "noble", "vivid", "quiet", "rapid", "lucid", "brave", "keen"];
const NOUNS = ["river", "flame", "echo", "stone", "ember", "tide", "field", "horizon", "spark", "harbor"];
const FN_PREFIXES = ["track", "log", "send", "push", "emit", "report", "record", "ping", "fire", "dispatch"];
const VAR_PREFIXES = ["_app", "_site", "_ctx", "_inst", "_run", "_obs", "_meas", "_trk"];

function pickFromSeed<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt * 31) % arr.length];
}

function generateIdentifier(seed: number, salt: number, suffix: string): string {
  const adj = pickFromSeed(ADJECTIVES, seed, salt);
  const noun = pickFromSeed(NOUNS, seed, salt + 7);
  const num = ((seed * (salt + 1)) % 9999).toString().padStart(2, "0");
  return `${adj}${noun.charAt(0).toUpperCase() + noun.slice(1)}${num}${suffix}`;
}

function randomToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface VariantSeed {
  fn_name: string;
  global_var: string;
  endpoint_alias: string;
  shuffle_seed: number;
}

function deriveVariant(secretSeed: string): VariantSeed {
  // Deterministic but unpredictable — convert hex seed to number, mix with time bucket
  const seedNum = parseInt(secretSeed.slice(0, 8), 16) >>> 0;
  const timeBucket = Math.floor(Date.now() / (60 * 60 * 1000)); // hourly bucket
  const mixed = (seedNum ^ timeBucket) >>> 0;

  const fnPrefix = pickFromSeed(FN_PREFIXES, mixed, 1);
  const fnSuffix = generateIdentifier(mixed, 2, "");
  const fn_name = `${fnPrefix}${fnSuffix.charAt(0).toUpperCase()}${fnSuffix.slice(1)}`;

  const varPrefix = pickFromSeed(VAR_PREFIXES, mixed, 3);
  const global_var = `${varPrefix}${(mixed % 9999).toString().padStart(4, "0")}`;

  const endpoint_alias = randomToken().slice(0, 10);

  return {
    fn_name,
    global_var,
    endpoint_alias,
    shuffle_seed: mixed,
  };
}

function buildScript(opts: {
  variant: VariantSeed;
  workspaceId: string;
  injectDecoys: boolean;
  obfuscationLevel: string;
  apiBase: string;
  endpointAlias: string;
}): string {
  const { variant, workspaceId, injectDecoys, apiBase, endpointAlias } = opts;
  const { fn_name, global_var, shuffle_seed } = variant;

  // Decoy variable names (planted to confuse static analyzers / blocklists)
  const decoys = injectDecoys
    ? Array.from({ length: 4 }, (_, i) => generateIdentifier(shuffle_seed, i + 100, ""))
    : [];

  // Shuffled inline blocks — order varies per variant
  const blocks: string[] = [];

  // Block A: queue init
  blocks.push(`var ${global_var}=window.${global_var}||(window.${global_var}={q:[],id:"${workspaceId}",v:"${endpointAlias}"});`);

  // Block B: tracker function
  blocks.push(`window.${fn_name}=function(n,p){try{var d={n:n,p:p||{},t:Date.now(),u:location.href,r:document.referrer};${global_var}.q.push(d);_flush();}catch(e){}};`);

  // Block C: flush via fetch with keepalive
  blocks.push(`function _flush(){if(!${global_var}.q.length)return;var b=${global_var}.q.splice(0);try{fetch("${apiBase}/${endpointAlias}",{method:"POST",keepalive:true,headers:{"content-type":"application/json","x-site-id":"${workspaceId}"},body:JSON.stringify({events:b})}).catch(function(){});}catch(e){}}`);

  // Block D: auto pageview
  blocks.push(`setTimeout(function(){window.${fn_name}("page_view",{title:document.title});},10);`);

  // Block E: pagehide flush
  blocks.push(`window.addEventListener("pagehide",function(){_flush();});`);

  // Block F: decoys
  if (decoys.length) {
    blocks.push(decoys.map((d) => `var ${d}=${Math.floor(Math.random() * 1e6)};`).join(""));
  }

  // Block G: predictive recovery — session heartbeat with sendBeacon.
  // Maintains an in-memory intent object that merchants can update via
  // window.nx('intent', 'InitiateCheckout', { value, currency, user }).
  // Auto-detects checkout intent from URL path + clicks on [data-nx-intent].
  const HB_URL = `${apiBase.replace(/\/track-event-alias.*/, "")}/session-heartbeat`;
  blocks.push(`(function(){var WS="${workspaceId}";var SK="nx_sid_"+WS;var SID=sessionStorage.getItem(SK);if(!SID){SID=Math.random().toString(36).slice(2)+Date.now();sessionStorage.setItem(SK,SID);}window.NXIntent=window.NXIntent||{type:null,payload:{},user:{}};window.nx=window.nx||function(cmd,a,b){if(cmd==="intent"){window.NXIntent={type:a,payload:b||{},user:(b&&b.user)||window.NXIntent.user||{}};hb();}else if(cmd==="user"){window.NXIntent.user=Object.assign(window.NXIntent.user||{},a||{});}};function detect(){try{var p=location.pathname.toLowerCase();if(/checkout|payment/.test(p)&&!window.NXIntent.type){window.NXIntent.type="InitiateCheckout";}else if(/cart/.test(p)&&!window.NXIntent.type){window.NXIntent.type="AddToCart";}}catch(e){}}function hb(){detect();try{var body=JSON.stringify({workspace_id:WS,session_token:SID,page_url:location.href,intent_type:window.NXIntent.type,captured_payload:window.NXIntent.payload,hashed_user_data:window.NXIntent.user});if(navigator.sendBeacon){navigator.sendBeacon("${HB_URL}",new Blob([body],{type:"application/json"}));}else{fetch("${HB_URL}",{method:"POST",keepalive:true,headers:{"content-type":"application/json"},body:body}).catch(function(){});}}catch(e){}}document.addEventListener("click",function(e){var t=e.target&&e.target.closest&&e.target.closest("[data-nx-intent]");if(t){var it=t.getAttribute("data-nx-intent");window.nx("intent",it,{});}},true);document.addEventListener("visibilitychange",hb);window.addEventListener("pagehide",hb);setInterval(hb,20000);setTimeout(hb,2000);})();`);

  // Shuffle blocks deterministically by seed (Fisher-Yates with seeded PRNG)
  let s = shuffle_seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = blocks.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
  }

  // Wrap in IIFE; comment header looks like a generic library
  const headerNames = ["Layout helper", "UI utilities", "Component runtime", "Resize observer polyfill", "Media query helper"];
  const header = pickFromSeed(headerNames, shuffle_seed, 0);
  return `/*! ${header} v${(shuffle_seed % 9).toString()}.${(shuffle_seed % 99).toString()}.${(shuffle_seed % 999).toString()} */\n!function(){${blocks.join("")}}();`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Resolve workspace: prefer ?ws=, fallback to path token lookup
    let workspaceId = url.searchParams.get("ws");
    let token = url.searchParams.get("t");

    // Path style: /serve-ghost-script/<slug>/<token>.js
    if (!token) {
      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last.endsWith(".js")) {
        token = last.replace(/\.js$/, "");
      }
    }

    if (token && !workspaceId) {
      const { data: variant } = await supabase
        .from("script_variants")
        .select("workspace_id")
        .eq("token", token)
        .eq("is_active", true)
        .maybeSingle();
      if (variant) workspaceId = variant.workspace_id as string;
    }

    if (!workspaceId) {
      return new Response("// ghost: missing workspace", {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/javascript" },
      });
    }

    // Load config
    const { data: config } = await supabase
      .from("ghost_loader_configs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!config || !config.enabled) {
      return new Response("// ghost: disabled", {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/javascript" },
      });
    }

    // Find or mint an active variant for this hour
    const variantSeed = deriveVariant(config.secret_seed);
    const expiresAt = new Date(Date.now() + (config.rotation_interval_minutes || 60) * 60 * 1000);

    // Check for an existing active variant matching the current hourly seed
    let activeVariant: { id: string; token: string; endpoint_alias: string } | null = null;
    const { data: existing } = await supabase
      .from("script_variants")
      .select("id, token, endpoint_alias, fn_name, global_var, shuffle_seed, expires_at")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .eq("shuffle_seed", variantSeed.shuffle_seed)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      activeVariant = { id: existing.id, token: existing.token, endpoint_alias: existing.endpoint_alias };
      // Override variantSeed values with the persisted ones for consistency
      variantSeed.fn_name = existing.fn_name;
      variantSeed.global_var = existing.global_var;
      variantSeed.endpoint_alias = existing.endpoint_alias;
    } else {
      const newToken = randomToken();
      const { data: inserted } = await supabase
        .from("script_variants")
        .insert({
          workspace_id: workspaceId,
          token: newToken,
          fn_name: variantSeed.fn_name,
          global_var: variantSeed.global_var,
          endpoint_alias: variantSeed.endpoint_alias,
          shuffle_seed: variantSeed.shuffle_seed,
          is_active: true,
          expires_at: expiresAt.toISOString(),
        })
        .select("id, token, endpoint_alias")
        .single();
      activeVariant = inserted as typeof activeVariant;
    }

    // Build script. The endpoint_alias is appended to the public API base; the
    // ingest router (track-event-alias) maps it back to the standard track-event flow.
    const apiBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1/track-event-alias`;
    const script = buildScript({
      variant: variantSeed,
      workspaceId,
      injectDecoys: !!config.inject_decoys,
      obfuscationLevel: config.obfuscation_level || "medium",
      apiBase,
      endpointAlias: activeVariant!.endpoint_alias,
    });

    // Best-effort: increment served_count and log (non-blocking)
    if (activeVariant) {
      supabase
        .from("script_variants")
        .update({ served_count: (1 as unknown as number) })
        .eq("id", activeVariant.id)
        .then(() => {});
      // Sample 5% of serves to logs
      if (Math.random() < 0.05) {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
        const ipHash = ip ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip)))).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("") : null;
        supabase.from("script_serve_logs").insert({
          workspace_id: workspaceId,
          variant_id: activeVariant.id,
          user_agent: req.headers.get("user-agent")?.slice(0, 500),
          ip_hash: ipHash,
        }).then(() => {});
      }
    }

    return new Response(script, {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(`// ghost: error ${msg}`, {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/javascript" },
    });
  }
});
