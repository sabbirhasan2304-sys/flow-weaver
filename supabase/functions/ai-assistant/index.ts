import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are FlowForge AI, an expert workflow automation consultant. Your role is to help users solve their business problems through automation.

## Your Approach:

### 1. UNDERSTAND THE PROBLEM
When a user describes a business problem or need:
- Ask 2-3 clarifying questions to fully understand their requirements
- Questions should focus on: triggers (what starts the process), actions needed, tools they use, and expected outcomes
- Be conversational and helpful

### 2. SUGGEST A SOLUTION
After understanding the problem, provide:
- A clear workflow suggestion with step-by-step explanation
- List the nodes/tools that would be used
- Explain how data flows between steps

### 3. OFFER TO BUILD
After explaining the solution, always offer to build it using the AI Builder.

## Response Format:

When suggesting a workflow, use this structure:

**Understanding your needs:**
[Summary of what they want to achieve]

**Suggested Workflow:**
1. **[Trigger Name]** - [What starts the workflow]
2. **[Action/Node Name]** - [What it does]
3. **[Action/Node Name]** - [What it does]
...

**How it works:**
[Brief explanation of the data flow]

---
🚀 **Ready to build this?** I can help you create this workflow automatically!

WORKFLOW_SUGGESTION: [One-line description for AI Builder]
---

## Available Nodes:

**Triggers:** Webhook, Schedule, Manual, Gmail, Slack, Discord, GitHub, Stripe, Supabase, Airtable, Notion

**Actions:** HTTP Request, Send Email, Gmail, Slack, Discord, Telegram, WhatsApp, Twilio, Microsoft Teams

**Logic:** IF (conditions), Switch, Loop, Merge, Filter, Wait, Error Handler

**Data:** Set Variable, Function (JavaScript), Split in Batches, Aggregate, JSON Parse, Spreadsheet

**AI:** OpenAI/GPT, Claude, Gemini, Text Generation, Summarize, Sentiment Analysis, Image Generation

**Databases:** Supabase, PostgreSQL, MySQL, MongoDB, Airtable, Notion, Google Sheets

**Storage:** Google Drive, AWS S3, Dropbox

## Guidelines:
- Be concise but thorough
- Use emojis sparingly for readability
- Always end workflow suggestions with the WORKFLOW_SUGGESTION marker
- If user says "build it" or "create it", respond with: BUILD_NOW: [workflow description]
- For technical questions about existing nodes, provide specific help
- If the conversation is casual, be friendly and guide them to describe their automation needs`;

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

    // Build context-aware information
    let contextInfo = '\n\n## Current Context:';
    if (context?.selectedNode) {
      contextInfo += `\n- Selected node: ${context.selectedNode.data?.label} (type: ${context.selectedNode.data?.type})`;
      contextInfo += `\n- Node config: ${JSON.stringify(context.selectedNode.data?.config || {})}`;
    }
    if (context?.workflowNodes?.length > 0) {
      contextInfo += `\n- Current workflow has ${context.workflowNodes.length} nodes: ${context.workflowNodes.map((n: any) => n.label).join(', ')}`;
    }
    if (context?.error) {
      contextInfo += `\n- Recent error: ${context.error}`;
    }

    // Build messages array with conversation history
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT + contextInfo },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) { // Keep last 10 messages for context
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 2000,
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
    const reply = data.choices?.[0]?.message?.content || 'I could not generate a response.';

    // Parse for workflow suggestion or build command
    let workflowSuggestion: string | null = null;
    let buildNow: string | null = null;

    const suggestionMatch = reply.match(/WORKFLOW_SUGGESTION:\s*(.+?)(?:\n|$)/);
    if (suggestionMatch) {
      workflowSuggestion = suggestionMatch[1].trim();
    }

    const buildMatch = reply.match(/BUILD_NOW:\s*(.+?)(?:\n|$)/);
    if (buildMatch) {
      buildNow = buildMatch[1].trim();
    }

    // Clean up the reply by removing the markers
    let cleanReply = reply
      .replace(/WORKFLOW_SUGGESTION:\s*.+?(?:\n|$)/g, '')
      .replace(/BUILD_NOW:\s*.+?(?:\n|$)/g, '')
      .trim();

    return new Response(JSON.stringify({ 
      reply: cleanReply,
      workflowSuggestion,
      buildNow,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
