import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are FlowForge AI Assistant, an expert in workflow automation. You help users:
1. Understand nodes and their configurations
2. Suggest improvements to workflows
3. Debug issues and errors
4. Recommend the best nodes for specific tasks
5. Explain expressions and data transformations

You have deep knowledge of:
- All FlowForge nodes (triggers, actions, logic, AI, databases, etc.)
- Expression syntax: {{ $json["field"] }}, {{ $node["name"].data }}, {{ $env.VAR }}
- Best practices for workflow design
- Integration patterns and error handling

Keep responses concise but helpful. Use code examples when relevant.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, context } = await req.json();

    // Build context-aware prompt
    let contextInfo = '';
    if (context?.selectedNode) {
      contextInfo += `\nCurrently selected node: ${context.selectedNode.data?.label} (type: ${context.selectedNode.data?.type})`;
      contextInfo += `\nNode config: ${JSON.stringify(context.selectedNode.data?.config || {})}`;
    }
    if (context?.workflowNodes) {
      contextInfo += `\nWorkflow has ${context.workflowNodes.length} nodes`;
    }
    if (context?.error) {
      contextInfo += `\nRecent error: ${context.error}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextInfo },
          { role: 'user', content: message },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I could not generate a response.';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
