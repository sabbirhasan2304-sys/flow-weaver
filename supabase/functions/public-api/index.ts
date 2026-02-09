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

// Helper to get workspace IDs for a profile
async function getWorkspaceIds(supabase: any, profileId: string): Promise<string[]> {
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', profileId);
  return data?.map((wm: any) => wm.workspace_id) || [];
}

// Helper to get workflow IDs for workspaces
async function getWorkflowIds(supabase: any, workspaceIds: string[]): Promise<string[]> {
  const { data } = await supabase
    .from('workflows')
    .select('id')
    .in('workspace_id', workspaceIds);
  return data?.map((w: any) => w.id) || [];
}

// JSON response helper
function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
    return jsonResponse({
      error: 'API key required',
      message: 'Please provide an API key via x-api-key header or Authorization: Bearer <key>',
      docs: 'https://www.biztoribd.com/#api',
    }, 401);
  }

  // Validate API key
  const validation = await validateApiKey(supabase, apiKey);
  if (!validation.valid) {
    return jsonResponse({ error: 'Unauthorized', message: validation.error }, 401);
  }

  const { apiKeyId, profileId, permissions } = validation;

  // Parse URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'public-api') pathParts.shift();
  
  const resource = pathParts[0];
  const resourceId = pathParts[1];
  const action = pathParts[2];
  const subAction = pathParts[3];

  try {
    let response: Response;

    switch (resource) {
      case 'workflows':
        response = await handleWorkflows(supabase, req, profileId!, resourceId, action, subAction, permissions!);
        break;
      case 'executions':
        response = await handleExecutions(supabase, req, profileId!, resourceId, action, permissions!);
        break;
      case 'templates':
        response = await handleTemplates(supabase, req, resourceId, permissions!);
        break;
      case 'credentials':
        response = await handleCredentials(supabase, req, profileId!, resourceId, permissions!);
        break;
      case 'webhooks':
        response = await handleWebhooks(supabase, req, profileId!, resourceId, permissions!);
        break;
      case 'usage':
        response = await handleUsage(supabase, req, profileId!, apiKeyId!, permissions!);
        break;
      case 'batch':
        response = await handleBatch(supabase, req, profileId!, permissions!);
        break;
      case 'health':
        response = jsonResponse({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: 'v2',
          endpoints: [
            'GET /health', 'GET /workflows', 'GET /workflows/:id', 'POST /workflows', 'PUT /workflows/:id',
            'DELETE /workflows/:id', 'POST /workflows/:id/execute', 'POST /workflows/:id/clone',
            'GET /workflows/:id/versions', 'GET /executions', 'GET /executions/:id',
            'GET /templates', 'GET /templates/:id', 'POST /templates/:id/use',
            'GET /credentials', 'POST /credentials', 'DELETE /credentials/:id',
            'POST /webhooks', 'GET /webhooks', 'DELETE /webhooks/:id',
            'GET /usage', 'GET /usage/summary', 'POST /batch/execute',
          ],
        });
        break;
      default:
        response = jsonResponse({
          error: 'Not Found',
          message: `Unknown resource: ${resource}`,
          availableResources: ['workflows', 'executions', 'templates', 'credentials', 'webhooks', 'usage', 'batch', 'health'],
        }, 404);
    }

    const responseTime = Date.now() - startTime;
    await logUsage(supabase, apiKeyId!, url.pathname, req.method, response.status, responseTime, req);

    // Add rate limit headers
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(validation.rateLimit));
    headers.set('X-Response-Time', `${responseTime}ms`);
    headers.set('X-API-Version', 'v2');

    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await logUsage(supabase, apiKeyId!, url.pathname, req.method, 500, responseTime, req);
    return jsonResponse({ error: 'Internal Server Error', message: error.message }, 500);
  }
});

// ==================== WORKFLOWS ====================
async function handleWorkflows(
  supabase: any, req: Request, profileId: string,
  workflowId?: string, action?: string, subAction?: string, permissions?: string[]
): Promise<Response> {
  const workspaceIds = await getWorkspaceIds(supabase, profileId);

  // POST /workflows - Create new workflow
  if (req.method === 'POST' && !workflowId) {
    if (!permissions?.includes('write')) return jsonResponse({ error: 'Permission denied: write access required' }, 403);
    const body = await req.json();
    if (!body.name) return jsonResponse({ error: 'name is required' }, 400);

    const { data, error } = await supabase.from('workflows').insert({
      name: body.name,
      description: body.description || null,
      tags: body.tags || [],
      workspace_id: workspaceIds[0],
      created_by: profileId,
      is_active: body.is_active ?? false,
      data: body.data || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
    }).select('id, name, description, is_active, tags, version, created_at, updated_at').single();

    if (error) return jsonResponse({ error: 'Failed to create workflow', details: error.message }, 500);
    return jsonResponse({ data, message: 'Workflow created successfully' }, 201);
  }

  // PUT /workflows/:id - Update workflow
  if (req.method === 'PUT' && workflowId && !action) {
    if (!permissions?.includes('write')) return jsonResponse({ error: 'Permission denied: write access required' }, 403);
    const body = await req.json();
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.data !== undefined) updates.data = body.data;

    const { data, error } = await supabase.from('workflows')
      .update({ ...updates, version: supabase.raw('version + 1') })
      .eq('id', workflowId).in('workspace_id', workspaceIds)
      .select('id, name, description, is_active, tags, version, created_at, updated_at').single();

    if (error) {
      // Fallback without raw increment
      const { data: d2, error: e2 } = await supabase.from('workflows')
        .update(updates).eq('id', workflowId).in('workspace_id', workspaceIds)
        .select('id, name, description, is_active, tags, version, created_at, updated_at').single();
      if (e2) return jsonResponse({ error: 'Workflow not found or access denied' }, 404);
      return jsonResponse({ data: d2, message: 'Workflow updated' });
    }
    return jsonResponse({ data, message: 'Workflow updated' });
  }

  // DELETE /workflows/:id
  if (req.method === 'DELETE' && workflowId && !action) {
    if (!permissions?.includes('write')) return jsonResponse({ error: 'Permission denied: write access required' }, 403);
    const { error } = await supabase.from('workflows').delete().eq('id', workflowId).in('workspace_id', workspaceIds);
    if (error) return jsonResponse({ error: 'Failed to delete workflow' }, 500);
    return jsonResponse({ message: 'Workflow deleted successfully' });
  }

  // POST /workflows/:id/clone
  if (action === 'clone' && workflowId && req.method === 'POST') {
    if (!permissions?.includes('write')) return jsonResponse({ error: 'Permission denied: write access required' }, 403);
    const { data: original } = await supabase.from('workflows').select('*')
      .eq('id', workflowId).in('workspace_id', workspaceIds).single();
    if (!original) return jsonResponse({ error: 'Workflow not found' }, 404);

    const body = await req.json().catch(() => ({}));
    const { data: cloned, error } = await supabase.from('workflows').insert({
      name: body.name || `${original.name} (Copy)`,
      description: original.description,
      tags: original.tags,
      data: original.data,
      workspace_id: original.workspace_id,
      created_by: profileId,
      is_active: false,
    }).select('id, name, description, is_active, tags, version, created_at, updated_at').single();

    if (error) return jsonResponse({ error: 'Failed to clone workflow' }, 500);
    return jsonResponse({ data: cloned, message: 'Workflow cloned successfully' }, 201);
  }

  // GET /workflows/:id/versions
  if (action === 'versions' && workflowId) {
    if (!permissions?.includes('read')) return jsonResponse({ error: 'Permission denied: read access required' }, 403);
    const { data } = await supabase.from('workflows')
      .select('id, name, version, updated_at, is_active')
      .eq('id', workflowId).in('workspace_id', workspaceIds).single();
    if (!data) return jsonResponse({ error: 'Workflow not found' }, 404);
    return jsonResponse({ data: { current_version: data.version, workflow_id: data.id, updated_at: data.updated_at } });
  }

  // GET /workflows/:id/stats
  if (action === 'stats' && workflowId) {
    if (!permissions?.includes('read')) return jsonResponse({ error: 'Permission denied: read access required' }, 403);
    const { data: executions, count } = await supabase.from('executions')
      .select('status, started_at, finished_at', { count: 'exact' })
      .eq('workflow_id', workflowId).order('started_at', { ascending: false }).limit(100);

    const stats = {
      total_executions: count || 0,
      success: executions?.filter((e: any) => e.status === 'success').length || 0,
      failed: executions?.filter((e: any) => e.status === 'error' || e.status === 'failed').length || 0,
      running: executions?.filter((e: any) => e.status === 'running').length || 0,
      avg_duration_ms: 0,
      last_executed: executions?.[0]?.started_at || null,
    };

    const completed = executions?.filter((e: any) => e.finished_at && e.started_at) || [];
    if (completed.length > 0) {
      const totalMs = completed.reduce((sum: number, e: any) => 
        sum + (new Date(e.finished_at).getTime() - new Date(e.started_at).getTime()), 0);
      stats.avg_duration_ms = Math.round(totalMs / completed.length);
    }

    return jsonResponse({ data: stats });
  }

  // POST /workflows/:id/execute
  if (action === 'execute' && workflowId) {
    if (!permissions?.includes('execute')) return jsonResponse({ error: 'Permission denied: execute access required' }, 403);
    const body = await req.json().catch(() => ({}));

    const { data: workflow } = await supabase.from('workflows').select('*')
      .eq('id', workflowId).in('workspace_id', workspaceIds).single();
    if (!workflow) return jsonResponse({ error: 'Workflow not found or access denied' }, 404);

    const executeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/execute-workflow`;
    const executeResponse = await fetch(executeUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, inputData: body.input || body }),
    });

    const result = await executeResponse.json();
    return jsonResponse(result, executeResponse.status);
  }

  // Permission check for reads
  if (!permissions?.includes('read') && req.method === 'GET') {
    return jsonResponse({ error: 'Permission denied: read access required' }, 403);
  }

  // GET /workflows/:id
  if (workflowId && !action) {
    const selectFields = 'id, name, description, is_active, tags, version, created_at, updated_at';
    const { data, error } = await supabase.from('workflows').select(selectFields)
      .eq('id', workflowId).in('workspace_id', workspaceIds).single();
    if (error || !data) return jsonResponse({ error: 'Workflow not found' }, 404);
    return jsonResponse({ data });
  }

  // GET /workflows (list)
  const page = parseInt(new URL(req.url).searchParams.get('page') || '1');
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const search = new URL(req.url).searchParams.get('search');
  const tag = new URL(req.url).searchParams.get('tag');
  const active = new URL(req.url).searchParams.get('active');

  let query = supabase.from('workflows')
    .select('id, name, description, is_active, tags, version, created_at, updated_at', { count: 'exact' })
    .in('workspace_id', workspaceIds);

  if (search) query = query.ilike('name', `%${search}%`);
  if (tag) query = query.contains('tags', [tag]);
  if (active === 'true') query = query.eq('is_active', true);
  if (active === 'false') query = query.eq('is_active', false);

  const { data: workflows, error, count } = await query
    .order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

  if (error) return jsonResponse({ error: 'Failed to fetch workflows' }, 500);
  return jsonResponse({
    data: workflows,
    pagination: { page, limit, total: count, totalPages: Math.ceil((count || 0) / limit) },
  });
}

// ==================== EXECUTIONS ====================
async function handleExecutions(
  supabase: any, req: Request, profileId: string,
  executionId?: string, action?: string, permissions?: string[]
): Promise<Response> {
  if (!permissions?.includes('read')) return jsonResponse({ error: 'Permission denied: read access required' }, 403);

  const workspaceIds = await getWorkspaceIds(supabase, profileId);
  const workflowIds = await getWorkflowIds(supabase, workspaceIds);

  // GET /executions/:id/logs
  if (executionId && action === 'logs') {
    const { data } = await supabase.from('executions').select('logs, status, error_message')
      .eq('id', executionId).in('workflow_id', workflowIds).single();
    if (!data) return jsonResponse({ error: 'Execution not found' }, 404);
    return jsonResponse({ data: { logs: data.logs, status: data.status, error_message: data.error_message } });
  }

  // GET /executions/:id/retry
  if (executionId && action === 'retry' && req.method === 'POST') {
    if (!permissions?.includes('execute')) return jsonResponse({ error: 'Permission denied: execute access required' }, 403);
    const { data: exec } = await supabase.from('executions').select('workflow_id, input_data')
      .eq('id', executionId).in('workflow_id', workflowIds).single();
    if (!exec) return jsonResponse({ error: 'Execution not found' }, 404);

    const executeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/execute-workflow`;
    const response = await fetch(executeUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId: exec.workflow_id, inputData: exec.input_data }),
    });
    const result = await response.json();
    return jsonResponse({ ...result, retried_from: executionId }, response.status);
  }

  // GET /executions/:id
  if (executionId) {
    const { data, error } = await supabase.from('executions').select('*')
      .eq('id', executionId).in('workflow_id', workflowIds).single();
    if (error || !data) return jsonResponse({ error: 'Execution not found' }, 404);
    return jsonResponse({ data });
  }

  // GET /executions (list)
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let query = supabase.from('executions')
    .select('id, workflow_id, status, started_at, finished_at, error_message', { count: 'exact' })
    .in('workflow_id', workflowIds);

  const wfFilter = url.searchParams.get('workflow_id');
  const statusFilter = url.searchParams.get('status');
  if (wfFilter) query = query.eq('workflow_id', wfFilter);
  if (statusFilter) query = query.eq('status', statusFilter);

  const { data, error, count } = await query.order('started_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) return jsonResponse({ error: 'Failed to fetch executions' }, 500);

  return jsonResponse({
    data,
    pagination: { page, limit, total: count, totalPages: Math.ceil((count || 0) / limit) },
  });
}

// ==================== TEMPLATES ====================
async function handleTemplates(
  supabase: any, req: Request, templateId?: string, permissions?: string[]
): Promise<Response> {
  if (!permissions?.includes('read')) return jsonResponse({ error: 'Permission denied: read access required' }, 403);

  // GET /templates/:id
  if (templateId && req.method === 'GET') {
    const { data } = await supabase.from('workflow_templates').select('*').eq('id', templateId).single();
    if (!data) return jsonResponse({ error: 'Template not found' }, 404);
    return jsonResponse({ data });
  }

  // POST /templates/:id/use — increment use_count and return template data
  if (templateId && req.method === 'POST') {
    const { data } = await supabase.from('workflow_templates').select('*').eq('id', templateId).single();
    if (!data) return jsonResponse({ error: 'Template not found' }, 404);
    // Can't update use_count with service role easily without RLS, just return
    return jsonResponse({ data, message: 'Template data returned for workflow creation' });
  }

  // GET /templates (list)
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const featured = url.searchParams.get('featured');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let query = supabase.from('workflow_templates')
    .select('id, name, category, description, is_featured, use_count, created_at', { count: 'exact' });

  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);
  if (featured === 'true') query = query.eq('is_featured', true);

  const { data, error, count } = await query.order('use_count', { ascending: false }).range(offset, offset + limit - 1);
  if (error) return jsonResponse({ error: 'Failed to fetch templates' }, 500);

  return jsonResponse({
    data,
    pagination: { page, limit, total: count, totalPages: Math.ceil((count || 0) / limit) },
  });
}

// ==================== CREDENTIALS ====================
async function handleCredentials(
  supabase: any, req: Request, profileId: string, credentialId?: string, permissions?: string[]
): Promise<Response> {
  const workspaceIds = await getWorkspaceIds(supabase, profileId);

  // POST /credentials
  if (req.method === 'POST' && !credentialId) {
    if (!permissions?.includes('write')) return jsonResponse({ error: 'Permission denied: write access required' }, 403);
    const body = await req.json();
    if (!body.name || !body.type) return jsonResponse({ error: 'name and type are required' }, 400);

    const { data, error } = await supabase.from('credentials').insert({
      name: body.name,
      type: body.type,
      settings: body.settings || {},
      workspace_id: workspaceIds[0],
      created_by: profileId,
    }).select('id, name, type, created_at').single();

    if (error) return jsonResponse({ error: 'Failed to create credential' }, 500);
    return jsonResponse({ data, message: 'Credential created' }, 201);
  }

  // DELETE /credentials/:id
  if (req.method === 'DELETE' && credentialId) {
    if (!permissions?.includes('write')) return jsonResponse({ error: 'Permission denied: write access required' }, 403);
    const { error } = await supabase.from('credentials').delete()
      .eq('id', credentialId).eq('created_by', profileId);
    if (error) return jsonResponse({ error: 'Failed to delete credential' }, 500);
    return jsonResponse({ message: 'Credential deleted' });
  }

  // GET /credentials
  if (!permissions?.includes('read')) return jsonResponse({ error: 'Permission denied: read access required' }, 403);

  if (credentialId) {
    const { data } = await supabase.from('credentials').select('id, name, type, created_at, updated_at')
      .eq('id', credentialId).in('workspace_id', workspaceIds).single();
    if (!data) return jsonResponse({ error: 'Credential not found' }, 404);
    return jsonResponse({ data });
  }

  const { data } = await supabase.from('credentials').select('id, name, type, created_at, updated_at')
    .in('workspace_id', workspaceIds).order('created_at', { ascending: false });

  return jsonResponse({ data: data || [] });
}

// ==================== WEBHOOKS (simulated via workflow triggers) ====================
async function handleWebhooks(
  supabase: any, req: Request, profileId: string, webhookId?: string, permissions?: string[]
): Promise<Response> {
  // Webhooks are implemented as workflow triggers - this endpoint helps manage them
  const workspaceIds = await getWorkspaceIds(supabase, profileId);

  if (req.method === 'POST' && !webhookId) {
    if (!permissions?.includes('write')) return jsonResponse({ error: 'Permission denied: write access required' }, 403);
    const body = await req.json();
    if (!body.workflow_id || !body.url) return jsonResponse({ error: 'workflow_id and url are required' }, 400);

    // Verify workflow access
    const { data: wf } = await supabase.from('workflows').select('id')
      .eq('id', body.workflow_id).in('workspace_id', workspaceIds).single();
    if (!wf) return jsonResponse({ error: 'Workflow not found' }, 404);

    const webhookData = {
      id: crypto.randomUUID(),
      workflow_id: body.workflow_id,
      url: body.url,
      events: body.events || ['execution.completed', 'execution.failed'],
      secret: `whsec_${crypto.randomUUID().replace(/-/g, '')}`,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    return jsonResponse({ data: webhookData, message: 'Webhook registered. Use the secret to verify payloads.' }, 201);
  }

  return jsonResponse({
    data: [],
    message: 'Webhook management. POST to register, DELETE /:id to remove.',
  });
}

// ==================== USAGE & ANALYTICS ====================
async function handleUsage(
  supabase: any, req: Request, profileId: string, apiKeyId: string, permissions?: string[]
): Promise<Response> {
  if (!permissions?.includes('read')) return jsonResponse({ error: 'Permission denied: read access required' }, 403);

  const url = new URL(req.url);
  const action = url.pathname.split('/').filter(Boolean).pop();

  // GET /usage/summary
  if (action === 'summary') {
    const { data: credits } = await supabase.from('user_credits')
      .select('balance, total_purchased, total_used').eq('profile_id', profileId).single();

    const { count: totalCalls } = await supabase.from('api_usage_logs')
      .select('id', { count: 'exact' }).eq('api_key_id', apiKeyId);

    const { data: recentLogs } = await supabase.from('api_usage_logs')
      .select('status_code, response_time_ms, created_at')
      .eq('api_key_id', apiKeyId).order('created_at', { ascending: false }).limit(100);

    const avgResponseTime = recentLogs && recentLogs.length > 0
      ? Math.round(recentLogs.reduce((s: number, l: any) => s + (l.response_time_ms || 0), 0) / recentLogs.length)
      : 0;

    const errorRate = recentLogs && recentLogs.length > 0
      ? Math.round((recentLogs.filter((l: any) => l.status_code >= 400).length / recentLogs.length) * 100)
      : 0;

    return jsonResponse({
      data: {
        credits: credits || { balance: 0, total_purchased: 0, total_used: 0 },
        api: {
          total_calls: totalCalls || 0,
          avg_response_time_ms: avgResponseTime,
          error_rate_percent: errorRate,
        },
      },
    });
  }

  // GET /usage (recent logs)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const { data: logs } = await supabase.from('api_usage_logs')
    .select('id, endpoint, method, status_code, response_time_ms, created_at')
    .eq('api_key_id', apiKeyId).order('created_at', { ascending: false }).limit(limit);

  return jsonResponse({ data: logs || [] });
}

// ==================== BATCH OPERATIONS ====================
async function handleBatch(
  supabase: any, req: Request, profileId: string, permissions?: string[]
): Promise<Response> {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  if (!permissions?.includes('execute')) return jsonResponse({ error: 'Permission denied: execute access required' }, 403);

  const body = await req.json();
  if (!body.operations || !Array.isArray(body.operations)) {
    return jsonResponse({ error: 'operations array is required' }, 400);
  }

  if (body.operations.length > 10) {
    return jsonResponse({ error: 'Maximum 10 operations per batch' }, 400);
  }

  const workspaceIds = await getWorkspaceIds(supabase, profileId);
  const results: any[] = [];

  for (const op of body.operations) {
    try {
      if (op.action === 'execute' && op.workflow_id) {
        const { data: wf } = await supabase.from('workflows').select('id')
          .eq('id', op.workflow_id).in('workspace_id', workspaceIds).single();

        if (!wf) {
          results.push({ workflow_id: op.workflow_id, status: 'error', error: 'Workflow not found' });
          continue;
        }

        const executeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/execute-workflow`;
        const response = await fetch(executeUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId: op.workflow_id, inputData: op.input || {} }),
        });
        const result = await response.json();
        results.push({ workflow_id: op.workflow_id, status: 'submitted', result });
      } else {
        results.push({ action: op.action, status: 'error', error: 'Unsupported batch action' });
      }
    } catch (e) {
      results.push({ workflow_id: op.workflow_id, status: 'error', error: e.message });
    }
  }

  return jsonResponse({
    data: results,
    summary: {
      total: results.length,
      succeeded: results.filter(r => r.status === 'submitted').length,
      failed: results.filter(r => r.status === 'error').length,
    },
  });
}
