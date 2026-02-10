import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are BiztoriBD AI, a workflow automation expert. Be concise and helpful.

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

const CREDIT_COST_PER_MESSAGE = 1; // 1 credit per AI message

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

    // Get authorization header for user identification
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message, context, conversationHistory, skipCredits } = await req.json();

    // Check user credits if auth header present and not skipping credits
    if (authHeader && !skipCredits) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (user) {
        // Check if user is admin - admins bypass credit checks
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        const isAdmin = !!adminRole;

        if (!isAdmin) {
          // Get profile ID
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            // Check credits balance
            const { data: credits } = await supabase
              .from('user_credits')
              .select('balance')
              .eq('profile_id', profile.id)
              .single();

            const balance = credits?.balance ? Number(credits.balance) : 0;
            
            if (balance < CREDIT_COST_PER_MESSAGE) {
              return new Response(JSON.stringify({ 
                error: 'Insufficient credits',
                message: 'You need to add credits to use AI features. Visit Billing to purchase credits.',
                creditsRequired: CREDIT_COST_PER_MESSAGE,
                currentBalance: balance,
              }), {
                status: 402,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            // Deduct credits
            try {
              await supabase.rpc('deduct_credits', {
                p_profile_id: profile.id,
                p_amount: CREDIT_COST_PER_MESSAGE,
                p_description: 'AI Assistant message',
              });
            } catch (deductError) {
              console.error('Failed to deduct credits:', deductError);
              return new Response(JSON.stringify({ 
                error: 'Failed to process credits',
                message: 'Unable to deduct credits. Please try again.',
              }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }
      }
    }

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
      creditsUsed: CREDIT_COST_PER_MESSAGE,
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