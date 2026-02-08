import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are FlowForge AI, a workflow automation expert. Be concise and helpful.

## Available Integrations:
Triggers: Webhook, Schedule, Gmail, Slack, Discord, GitHub, Stripe, Supabase, Telegram
Actions: HTTP, Email, Slack, Discord, Telegram, Twilio, SendGrid
Logic: IF, Switch, Loop, Merge, Filter, Wait
Data: Variables, JavaScript, JSON, Spreadsheet
AI: OpenAI, Claude, Gemini, Summarize, Sentiment
Databases: Supabase, PostgreSQL, MySQL, MongoDB, Airtable, Notion

## Response Style:
- Be brief and actionable
- Use bullet points for steps
- Format workflow suggestions as numbered lists

## When suggesting workflows:
1. Briefly explain the solution
2. List nodes needed
3. End with: WORKFLOW_SUGGESTION: [concise description]

## When user wants to build:
Respond with: BUILD_NOW: [workflow description]

Keep responses under 200 words unless explaining complex logic.`;

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

    const { message, context, conversationHistory } = await req.json();

    // Build compact context
    let contextInfo = '';
    if (context?.selectedNode) {
      contextInfo += `\nSelected: ${context.selectedNode.data?.label} (${context.selectedNode.data?.type})`;
    }
    if (context?.workflowNodes?.length) {
      contextInfo += `\nWorkflow: ${context.workflowNodes.map((n: any) => n.label).join(' → ')}`;
    }
    if (context?.error) {
      contextInfo += `\nError: ${context.error}`;
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT + contextInfo },
    ];

    // Keep only last 6 messages for speed
    if (conversationHistory?.length) {
      for (const msg of conversationHistory.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    // Use faster model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Fast model
        messages,
        max_tokens: 1000, // Keep responses short
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Could not generate response.';

    // Extract markers
    const suggestionMatch = reply.match(/WORKFLOW_SUGGESTION:\s*(.+?)(?:\n|$)/);
    const buildMatch = reply.match(/BUILD_NOW:\s*(.+?)(?:\n|$)/);

    const cleanReply = reply
      .replace(/WORKFLOW_SUGGESTION:\s*.+?(?:\n|$)/g, '')
      .replace(/BUILD_NOW:\s*.+?(?:\n|$)/g, '')
      .trim();

    return new Response(JSON.stringify({ 
      reply: cleanReply,
      workflowSuggestion: suggestionMatch?.[1]?.trim() || null,
      buildNow: buildMatch?.[1]?.trim() || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
