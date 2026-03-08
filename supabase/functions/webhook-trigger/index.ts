import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const workflowId = url.searchParams.get('workflow_id');

    if (!workflowId) {
      return new Response(JSON.stringify({ error: 'Missing workflow_id parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get workflow
    const { data: workflow, error: wfError } = await supabase
      .from('workflows')
      .select('id, is_active, webhook_secret')
      .eq('id', workflowId)
      .single();

    if (wfError || !workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!workflow.is_active) {
      return new Response(JSON.stringify({ error: 'Workflow is not active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate webhook secret if configured
    if (workflow.webhook_secret) {
      const providedSecret = req.headers.get('x-webhook-secret');
      if (providedSecret !== workflow.webhook_secret) {
        return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Parse body
    let inputData = {};
    try {
      if (req.method === 'POST' || req.method === 'PUT') {
        inputData = await req.json();
      }
    } catch {
      // body might not be JSON
      inputData = { rawBody: await req.text() };
    }

    // Add webhook metadata
    const webhookPayload = {
      ...inputData as object,
      _webhook: {
        method: req.method,
        headers: Object.fromEntries(req.headers),
        query: Object.fromEntries(url.searchParams),
        timestamp: new Date().toISOString(),
      },
    };

    // Call execute-workflow
    const executeResponse = await fetch(`${supabaseUrl}/functions/v1/execute-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        workflowId,
        inputData: webhookPayload,
        testMode: false,
      }),
    });

    const result = await executeResponse.json();

    return new Response(JSON.stringify({
      success: true,
      executionId: result.executionId,
      message: 'Webhook received and workflow triggered',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
