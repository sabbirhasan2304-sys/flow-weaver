import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Compact node list for faster AI processing
const NODE_TYPES = {
  triggers: ['webhook', 'schedule', 'manual', 'gmailTrigger', 'slackTrigger', 'githubTrigger', 'stripeTrigger', 'supabaseTrigger', 'discordTrigger', 'telegramTrigger', 'airtableTrigger', 'notionTrigger'],
  actions: ['httpRequest', 'sendEmail', 'gmail', 'slack', 'discord', 'telegram', 'twilio', 'sendgrid'],
  logic: ['if', 'switch', 'loop', 'merge', 'filter', 'wait', 'errorHandler'],
  data: ['setVariable', 'function', 'splitInBatches', 'aggregate', 'spreadsheet', 'jsonParse'],
  ai: ['openai', 'anthropic', 'gemini', 'aiTextGeneration', 'aiSummarize', 'aiSentiment'],
  databases: ['supabase', 'postgres', 'mysql', 'mongodb', 'airtable', 'notion', 'googleSheets'],
  storage: ['googleDrive', 's3', 'dropbox'],
};

const CATEGORIES = {
  triggers: 'Triggers',
  actions: 'Actions', 
  logic: 'Logic & Flow',
  data: 'Data Manipulation',
  ai: 'AI & Machine Learning',
  databases: 'Databases',
  storage: 'Storage',
};

const SYSTEM_PROMPT = `Generate a workflow automation as JSON. Available nodes:
${Object.entries(NODE_TYPES).map(([cat, types]) => `${cat}: ${types.join(', ')}`).join('\n')}

Output ONLY valid JSON:
{"nodes":[{"id":"string","type":"workflowNode","position":{"x":number,"y":number},"data":{"label":"string","type":"nodeType","category":"${Object.values(CATEGORIES).join('|')}","config":{}}}],"edges":[{"id":"string","source":"string","target":"string","animated":true}]}

Rules: Start with trigger. IDs like "trigger-webhook-1". Space 250px apart horizontally. Trigger at x:100,y:200.`;

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

    const { description } = await req.json();

    if (!description || typeof description !== 'string') {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use faster model with lower temperature for consistency
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Faster model
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Workflow: ${description}` },
        ],
        max_tokens: 2000, // Reduced for speed
        temperature: 0.3, // Lower for consistency
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON - handle code blocks
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Find JSON object in response
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    let workflow;
    try {
      workflow = JSON.parse(jsonStr.trim());
    } catch {
      console.error('Parse error:', content.slice(0, 500));
      throw new Error('Failed to generate workflow. Try a simpler description.');
    }

    if (!workflow.nodes?.length) {
      throw new Error('No nodes generated');
    }

    // Normalize nodes
    workflow.nodes = workflow.nodes.map((node: any, i: number) => ({
      id: node.id || `node-${i + 1}`,
      type: 'workflowNode',
      position: node.position || { x: 100 + i * 250, y: 200 },
      data: {
        label: node.data?.label || `Node ${i + 1}`,
        type: node.data?.type || 'manual',
        category: node.data?.category || 'Actions',
        config: node.data?.config || {},
      },
    }));

    // Normalize edges
    workflow.edges = (workflow.edges || []).map((edge: any, i: number) => ({
      id: edge.id || `edge-${i + 1}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
    }));

    return new Response(JSON.stringify({
      workflow: { nodes: workflow.nodes, edges: workflow.edges },
      description: workflow.description || 'Generated workflow',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
