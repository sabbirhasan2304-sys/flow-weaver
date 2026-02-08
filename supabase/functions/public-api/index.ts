import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Hash function for API key validation
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key and return credentials
async function validateApiKey(supabase: any, apiKey: string): Promise<{
  valid: boolean;
  apiKeyId?: string;
  profileId?: string;
  permissions?: string[];
  rateLimit?: number;
  error?: string;
}> {
  if (!apiKey || !apiKey.startsWith('bz_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const prefix = apiKey.substring(0, 10);
  const keyHash = await hashApiKey(apiKey);

  const { data, error } = await supabase.rpc('validate_api_key', {
    p_key_prefix: prefix,
    p_key_hash: keyHash,
  });

  if (error || !data || data.length === 0) {
    return { valid: false, error: 'Invalid or expired API key' };
  }

  const keyData = data[0];
  return {
    valid: true,
    apiKeyId: keyData.api_key_id,
    profileId: keyData.profile_id,
    permissions: keyData.permissions,
    rateLimit: keyData.rate_limit,
  };
}

// Log API usage
async function logUsage(
  supabase: any,
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  req: Request
) {
  try {
    await supabase.rpc('log_api_usage', {
      p_api_key_id: apiKeyId,
      p_endpoint: endpoint,
      p_method: method,
      p_status_code: statusCode,
      p_response_time_ms: responseTimeMs,
      p_ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      p_user_agent: req.headers.get('user-agent') || 'unknown',
    });
  } catch (e) {
    console.error('Failed to log API usage:', e);
  }
}

serve(async (req) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get API key from header
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'API key required',
      message: 'Please provide an API key via x-api-key header or Authorization: Bearer <key>',
      docs: '/api/docs',
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate API key
  const validation = await validateApiKey(supabase, apiKey);
  if (!validation.valid) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: validation.error,
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { apiKeyId, profileId, permissions } = validation;

  // Parse URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Remove 'public-api' from path if present
  if (pathParts[0] === 'public-api') pathParts.shift();
  
  const resource = pathParts[0];
  const resourceId = pathParts[1];
  const action = pathParts[2];

  try {
    let response: Response;

    switch (resource) {
      case 'workflows':
        response = await handleWorkflows(supabase, req, profileId!, resourceId, action, permissions!);
        break;
      case 'executions':
        response = await handleExecutions(supabase, req, profileId!, resourceId, action, permissions!);
        break;
      case 'health':
        response = new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        break;
      default:
        response = new Response(JSON.stringify({
          error: 'Not Found',
          message: `Unknown resource: ${resource}`,
          availableResources: ['workflows', 'executions', 'health'],
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Log usage
    const responseTime = Date.now() - startTime;
    await logUsage(supabase, apiKeyId!, url.pathname, req.method, response.status, responseTime, req);

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await logUsage(supabase, apiKeyId!, url.pathname, req.method, 500, responseTime, req);

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle /workflows endpoints
async function handleWorkflows(
  supabase: any,
  req: Request,
  profileId: string,
  workflowId?: string,
  action?: string,
  permissions?: string[]
): Promise<Response> {
  // Check permissions
  if (!permissions?.includes('read') && req.method === 'GET') {
    return new Response(JSON.stringify({ error: 'Permission denied: read access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!permissions?.includes('execute') && action === 'execute') {
    return new Response(JSON.stringify({ error: 'Permission denied: execute access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get user's workspace IDs
  const { data: workspaceMembers } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', profileId);

  const workspaceIds = workspaceMembers?.map((wm: any) => wm.workspace_id) || [];

  if (action === 'execute' && workflowId) {
    // Execute workflow
    const body = await req.json().catch(() => ({}));
    
    // Verify workflow belongs to user
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .in('workspace_id', workspaceIds)
      .single();

    if (error || !workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute the workflow using internal function
    const executeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/execute-workflow`;
    const executeResponse = await fetch(executeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        inputData: body.input || body,
      }),
    });

    const result = await executeResponse.json();
    return new Response(JSON.stringify(result), {
      status: executeResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (workflowId) {
    // Get single workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('id, name, description, is_active, tags, version, created_at, updated_at')
      .eq('id', workflowId)
      .in('workspace_id', workspaceIds)
      .single();

    if (error || !workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: workflow }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // List workflows
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const { data: workflows, error, count } = await supabase
    .from('workflows')
    .select('id, name, description, is_active, tags, version, created_at, updated_at', { count: 'exact' })
    .in('workspace_id', workspaceIds)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch workflows' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    data: workflows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handle /executions endpoints
async function handleExecutions(
  supabase: any,
  req: Request,
  profileId: string,
  executionId?: string,
  action?: string,
  permissions?: string[]
): Promise<Response> {
  if (!permissions?.includes('read')) {
    return new Response(JSON.stringify({ error: 'Permission denied: read access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get user's workspace IDs
  const { data: workspaceMembers } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', profileId);

  const workspaceIds = workspaceMembers?.map((wm: any) => wm.workspace_id) || [];

  // Get workflows in user's workspaces
  const { data: workflows } = await supabase
    .from('workflows')
    .select('id')
    .in('workspace_id', workspaceIds);

  const workflowIds = workflows?.map((w: any) => w.id) || [];

  if (executionId) {
    // Get single execution
    const { data: execution, error } = await supabase
      .from('executions')
      .select('*')
      .eq('id', executionId)
      .in('workflow_id', workflowIds)
      .single();

    if (error || !execution) {
      return new Response(JSON.stringify({ error: 'Execution not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: execution }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // List executions
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const workflowIdFilter = url.searchParams.get('workflow_id');
  const statusFilter = url.searchParams.get('status');

  let query = supabase
    .from('executions')
    .select('id, workflow_id, status, started_at, finished_at, error_message', { count: 'exact' })
    .in('workflow_id', workflowIds);

  if (workflowIdFilter) {
    query = query.eq('workflow_id', workflowIdFilter);
  }
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: executions, error, count } = await query
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch executions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    data: executions,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
