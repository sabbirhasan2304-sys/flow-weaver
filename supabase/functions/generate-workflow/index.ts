import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Available node types for the AI to choose from
const AVAILABLE_NODES = {
  triggers: [
    { type: 'webhook', name: 'Webhook', description: 'Trigger via HTTP webhook' },
    { type: 'schedule', name: 'Schedule Trigger', description: 'Trigger on cron schedule' },
    { type: 'manual', name: 'Manual Trigger', description: 'Manually trigger workflow' },
    { type: 'gmailTrigger', name: 'Gmail Trigger', description: 'Trigger on new emails' },
    { type: 'slackTrigger', name: 'Slack Trigger', description: 'Trigger on Slack events' },
    { type: 'githubTrigger', name: 'GitHub Trigger', description: 'Trigger on GitHub events' },
    { type: 'stripeTrigger', name: 'Stripe Trigger', description: 'Trigger on Stripe events' },
    { type: 'supabaseTrigger', name: 'Supabase Trigger', description: 'Trigger on database changes' },
  ],
  actions: [
    { type: 'httpRequest', name: 'HTTP Request', description: 'Make API requests' },
    { type: 'sendEmail', name: 'Send Email', description: 'Send emails via SMTP' },
    { type: 'gmail', name: 'Gmail', description: 'Send/manage Gmail' },
    { type: 'slack', name: 'Slack', description: 'Send Slack messages' },
    { type: 'discord', name: 'Discord', description: 'Send Discord messages' },
    { type: 'telegram', name: 'Telegram', description: 'Send Telegram messages' },
    { type: 'twilio', name: 'Twilio', description: 'Send SMS/calls' },
  ],
  logic: [
    { type: 'if', name: 'IF', description: 'Conditional branching' },
    { type: 'switch', name: 'Switch', description: 'Multiple conditions' },
    { type: 'loop', name: 'Loop', description: 'Iterate over items' },
    { type: 'merge', name: 'Merge', description: 'Merge branches' },
    { type: 'filter', name: 'Filter', description: 'Filter items' },
    { type: 'wait', name: 'Wait', description: 'Delay execution' },
    { type: 'errorHandler', name: 'Error Handler', description: 'Handle errors' },
  ],
  data: [
    { type: 'setVariable', name: 'Set', description: 'Set/transform data' },
    { type: 'function', name: 'Function', description: 'Custom JavaScript' },
    { type: 'splitInBatches', name: 'Split in Batches', description: 'Process in batches' },
    { type: 'aggregate', name: 'Aggregate', description: 'Aggregate data' },
    { type: 'spreadsheet', name: 'Spreadsheet File', description: 'Read/write Excel/CSV' },
    { type: 'jsonParse', name: 'JSON Parse', description: 'Parse JSON' },
  ],
  ai: [
    { type: 'openai', name: 'OpenAI', description: 'GPT models' },
    { type: 'anthropic', name: 'Claude', description: 'Anthropic Claude' },
    { type: 'gemini', name: 'Google Gemini', description: 'Google AI' },
    { type: 'aiTextGeneration', name: 'AI Text Generation', description: 'Generate text with AI' },
    { type: 'aiSummarize', name: 'AI Summarize', description: 'Summarize content' },
    { type: 'aiSentiment', name: 'AI Sentiment', description: 'Analyze sentiment' },
  ],
  databases: [
    { type: 'supabase', name: 'Supabase', description: 'Supabase operations' },
    { type: 'postgres', name: 'PostgreSQL', description: 'PostgreSQL queries' },
    { type: 'mysql', name: 'MySQL', description: 'MySQL queries' },
    { type: 'mongodb', name: 'MongoDB', description: 'MongoDB operations' },
    { type: 'airtable', name: 'Airtable', description: 'Airtable records' },
    { type: 'notion', name: 'Notion', description: 'Notion pages/databases' },
    { type: 'googleSheets', name: 'Google Sheets', description: 'Spreadsheet operations' },
  ],
  storage: [
    { type: 'googleDrive', name: 'Google Drive', description: 'File storage' },
    { type: 's3', name: 'AWS S3', description: 'S3 bucket operations' },
    { type: 'dropbox', name: 'Dropbox', description: 'Dropbox files' },
  ],
};

const SYSTEM_PROMPT = `You are a workflow automation expert. Your task is to generate workflow configurations based on user descriptions.

Available node types:
${JSON.stringify(AVAILABLE_NODES, null, 2)}

When generating a workflow:
1. Start with an appropriate trigger node
2. Add necessary action/logic/data nodes
3. Connect nodes logically
4. Position nodes for readability (x: 100-1200, y: 100-600, horizontal layout)

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "unique-id-1",
      "type": "workflowNode",
      "position": { "x": number, "y": number },
      "data": {
        "label": "Node Label",
        "type": "nodeType from available nodes",
        "category": "Triggers|Actions|Logic & Flow|Data Manipulation|AI & Machine Learning|Databases|Storage",
        "config": {}
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "source-node-id",
      "target": "target-node-id",
      "animated": true
    }
  ],
  "description": "Brief description of what this workflow does"
}

Rules:
- First node must be a trigger
- Node IDs should be descriptive like "trigger-webhook-1" or "action-slack-1"
- Position nodes left to right, trigger at x:100
- Space nodes 250px apart horizontally
- For branching, offset y positions by 150px
- Include appropriate default configs based on the workflow purpose`;

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create a workflow for: ${description}` },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Parse and validate the workflow
    let workflow;
    try {
      workflow = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to generate valid workflow. Please try a different description.');
    }

    // Validate structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      throw new Error('Generated workflow has no nodes');
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      workflow.edges = [];
    }

    // Ensure all nodes have required fields
    workflow.nodes = workflow.nodes.map((node: any, index: number) => ({
      id: node.id || `node-${index + 1}`,
      type: 'workflowNode',
      position: node.position || { x: 100 + index * 250, y: 200 },
      data: {
        label: node.data?.label || `Node ${index + 1}`,
        type: node.data?.type || 'manual',
        category: node.data?.category || 'Actions',
        config: node.data?.config || {},
      },
    }));

    // Ensure edges have proper structure
    workflow.edges = workflow.edges.map((edge: any, index: number) => ({
      id: edge.id || `edge-${index + 1}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
    }));

    return new Response(JSON.stringify({
      workflow: {
        nodes: workflow.nodes,
        edges: workflow.edges,
      },
      description: workflow.description || 'AI-generated workflow',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Workflow generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate workflow' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
