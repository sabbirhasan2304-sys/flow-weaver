import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    type: string;
    category: string;
    config?: Record<string, unknown>;
  };
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface ExecutionLog {
  nodeId: string;
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'success';
  data?: unknown;
}

// Node executor registry
const nodeExecutors: Record<string, (node: WorkflowNode, input: unknown, config: Record<string, unknown>) => Promise<unknown>> = {
  // Triggers
  'webhook': async (node, input) => {
    return { trigger: 'webhook', data: input, timestamp: new Date().toISOString() };
  },
  'schedule': async (node, input, config) => {
    return { trigger: 'schedule', cron: config.cronExpression, timestamp: new Date().toISOString() };
  },
  'manual': async (node, input) => {
    return { trigger: 'manual', data: input, timestamp: new Date().toISOString() };
  },

  // HTTP
  'http-request': async (node, input, config) => {
    const url = config.url as string;
    const method = (config.method as string) || 'GET';
    const headers = config.headers as Record<string, string> || {};
    const body = config.body;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: method !== 'GET' ? JSON.stringify(body || input) : undefined,
      });
      const data = await response.json().catch(() => response.text());
      return { status: response.status, data, headers: Object.fromEntries(response.headers) };
    } catch (error) {
      throw new Error(`HTTP Request failed: ${error.message}`);
    }
  },

  // Data Manipulation
  'set': async (node, input, config) => {
    const values = config.values as Record<string, unknown> || {};
    return { ...input as object, ...values };
  },
  'merge': async (node, input) => {
    if (Array.isArray(input)) {
      return input.reduce((acc, item) => ({ ...acc, ...item }), {});
    }
    return input;
  },
  'split-in-batches': async (node, input, config) => {
    const batchSize = (config.batchSize as number) || 10;
    const items = Array.isArray(input) ? input : [input];
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  },
  'code': async (node, input, config) => {
    const code = config.code as string || 'return $input;';
    // Simple expression evaluation (in production, use a proper sandbox)
    try {
      const fn = new Function('$input', '$json', code);
      return fn(input, input);
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  },

  // Logic
  'if': async (node, input, config) => {
    const condition = config.condition as string || 'true';
    const value1 = config.value1;
    const value2 = config.value2;
    const operator = config.operator as string || 'equals';

    let result = false;
    switch (operator) {
      case 'equals': result = value1 === value2; break;
      case 'notEquals': result = value1 !== value2; break;
      case 'contains': result = String(value1).includes(String(value2)); break;
      case 'greaterThan': result = Number(value1) > Number(value2); break;
      case 'lessThan': result = Number(value1) < Number(value2); break;
      default: result = Boolean(condition);
    }
    return { condition: result, input };
  },
  'switch': async (node, input, config) => {
    const field = config.field as string;
    const value = (input as Record<string, unknown>)?.[field];
    return { case: value, input };
  },
  'loop': async (node, input) => {
    const items = Array.isArray(input) ? input : [input];
    return items.map((item, index) => ({ item, index }));
  },
  'wait': async (node, input, config) => {
    const seconds = (config.seconds as number) || 1;
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    return input;
  },
  'aggregate': async (node, input, config) => {
    const field = config.field as string;
    const operation = config.operation as string || 'sum';
    const items = Array.isArray(input) ? input : [input];

    switch (operation) {
      case 'sum': return items.reduce((acc, item) => acc + Number(item?.[field] || 0), 0);
      case 'count': return items.length;
      case 'average': return items.reduce((acc, item) => acc + Number(item?.[field] || 0), 0) / items.length;
      case 'min': return Math.min(...items.map(item => Number(item?.[field] || 0)));
      case 'max': return Math.max(...items.map(item => Number(item?.[field] || 0)));
      default: return items;
    }
  },

  // AI Nodes
  'openai': async (node, input, config) => {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const model = (config.model as string) || 'openai/gpt-5-mini';
    const prompt = config.prompt as string || '';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt.replace('{{$input}}', JSON.stringify(input)) }],
      }),
    });

    const data = await response.json();
    return { response: data.choices?.[0]?.message?.content, usage: data.usage };
  },
  'gemini': async (node, input, config) => {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const model = (config.model as string) || 'google/gemini-3-flash-preview';
    const prompt = config.prompt as string || '';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt.replace('{{$input}}', JSON.stringify(input)) }],
      }),
    });

    const data = await response.json();
    return { response: data.choices?.[0]?.message?.content, usage: data.usage };
  },
  'claude': async (node, input, config) => {
    // Uses Lovable AI gateway which supports Claude-like models via compatible API
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const prompt = config.prompt as string || '';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Best alternative for complex reasoning
        messages: [{ role: 'user', content: prompt.replace('{{$input}}', JSON.stringify(input)) }],
      }),
    });

    const data = await response.json();
    return { response: data.choices?.[0]?.message?.content, usage: data.usage };
  },
  'ai-agent': async (node, input, config) => {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const systemPrompt = config.systemPrompt as string || 'You are a helpful assistant.';
    const userPrompt = config.userPrompt as string || '';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt.replace('{{$input}}', JSON.stringify(input)) },
        ],
      }),
    });

    const data = await response.json();
    return { response: data.choices?.[0]?.message?.content, usage: data.usage };
  },

  // Default executor for unimplemented nodes
  'default': async (node, input) => {
    return { nodeType: node.data.type, input, message: 'Node executed (mock)' };
  },
};

// Execute a single node with retry and continue-on-fail support
async function executeNode(
  node: WorkflowNode,
  input: unknown,
  logs: ExecutionLog[]
): Promise<{ output: unknown; error?: string }> {
  const executor = nodeExecutors[node.data.type] || nodeExecutors['default'];
  const config = node.data.config || {};
  const errorHandling = (node.data as any).errorHandling || {};
  const maxRetries = errorHandling.retryOnFail ? (errorHandling.maxRetries || 3) : 1;
  const retryDelay = errorHandling.retryDelayMs || 1000;

  logs.push({
    nodeId: node.id,
    timestamp: new Date().toISOString(),
    message: `Starting execution of ${node.data.label}`,
    level: 'info',
    data: { input: typeof input === 'object' ? input : { value: input } },
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await executor(node, input, config);
      logs.push({
        nodeId: node.id,
        timestamp: new Date().toISOString(),
        message: `Completed ${node.data.label}${attempt > 1 ? ` (attempt ${attempt})` : ''}`,
        level: 'success',
        data: result,
      });
      return { output: result };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        logs.push({
          nodeId: node.id,
          timestamp: new Date().toISOString(),
          message: `Retry ${attempt}/${maxRetries} for ${node.data.label}: ${error.message}`,
          level: 'info',
        });
        await new Promise(r => setTimeout(r, retryDelay));
      }
    }
  }

  // All retries exhausted
  logs.push({
    nodeId: node.id,
    timestamp: new Date().toISOString(),
    message: `Error in ${node.data.label}: ${lastError!.message}`,
    level: 'error',
    data: { error: lastError!.message, stack: lastError!.stack?.slice(0, 200) },
  });

  if (errorHandling.continueOnFail) {
    logs.push({
      nodeId: node.id,
      timestamp: new Date().toISOString(),
      message: `Continuing despite error (continueOnFail enabled)`,
      level: 'info',
    });
    return { output: { error: lastError!.message, _continueOnFail: true }, error: lastError!.message };
  }

  throw lastError!;
}

// Build execution order using topological sort
function getExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    graph.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    graph.get(current)?.forEach(neighbor => {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    });
  }

  return order;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { workflowId, inputData, testMode = false } = await req.json();

    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const workflowData = workflow.data as { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
    const nodes = workflowData.nodes || [];
    const edges = workflowData.edges || [];

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('executions')
      .insert({
        workflow_id: workflowId,
        status: 'running',
        input_data: inputData || {},
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (execError) {
      console.error('Failed to create execution record:', execError);
    }

    const logs: ExecutionLog[] = [];
    const nodeOutputs = new Map<string, unknown>();
    const executionOrder = getExecutionOrder(nodes, edges);

    // Helper to stream logs to realtime via DB update
    const streamLogs = async () => {
      if (execution) {
        await supabase
          .from('executions')
          .update({ logs: logs as any })
          .eq('id', execution.id);
      }
    };

    try {
      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        // Get input from connected nodes
        const incomingEdges = edges.filter(e => e.target === nodeId);
        let input: unknown = inputData;
        
        if (incomingEdges.length > 0) {
          const inputs = incomingEdges.map(e => nodeOutputs.get(e.source));
          input = inputs.length === 1 ? inputs[0] : inputs;
        }

        const { output } = await executeNode(node, input, logs);
        nodeOutputs.set(nodeId, output);

        // Stream logs after each node completes
        await streamLogs();
      }

      // Get final output (from nodes with no outgoing edges)
      const terminalNodes = nodes.filter(n => !edges.some(e => e.source === n.id));
      const finalOutput = terminalNodes.length === 1 
        ? nodeOutputs.get(terminalNodes[0].id)
        : Object.fromEntries(terminalNodes.map(n => [n.id, nodeOutputs.get(n.id)]));

      // Update execution record
      if (execution) {
        await supabase
          .from('executions')
          .update({
            status: 'success',
            output_data: finalOutput,
            logs,
            finished_at: new Date().toISOString(),
          })
          .eq('id', execution.id);
      }

      return new Response(JSON.stringify({
        success: true,
        executionId: execution?.id,
        output: finalOutput,
        logs,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Update execution record with error
      if (execution) {
        await supabase
          .from('executions')
          .update({
            status: 'error',
            error_message: error.message,
            logs,
            finished_at: new Date().toISOString(),
          })
          .eq('id', execution.id);
      }

      return new Response(JSON.stringify({
        success: false,
        executionId: execution?.id,
        error: error.message,
        logs,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
