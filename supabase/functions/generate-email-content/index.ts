import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const { type, prompt, tone, industry, audience, currentContent } = await req.json();

    if (!type || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing type or prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const toneDescriptions: Record<string, string> = {
      professional: 'formal, polished, business-appropriate',
      friendly: 'warm, conversational, approachable',
      urgent: 'time-sensitive, action-oriented, compelling',
      playful: 'fun, witty, lighthearted with personality',
      minimal: 'concise, clean, no fluff',
      luxurious: 'elegant, premium, sophisticated',
      educational: 'informative, helpful, teaching-oriented',
    };

    const toneGuide = toneDescriptions[tone] || toneDescriptions.professional;

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'subject_lines') {
      systemPrompt = `You are an expert email marketer. Generate compelling email subject lines.
Rules:
- Generate exactly 5 subject lines
- Each under 60 characters
- Tone: ${toneGuide}
- Include emoji where appropriate
- Mix curiosity, urgency, and value-driven approaches
- Return ONLY a JSON array of strings, no other text`;

      userPrompt = `Generate 5 email subject lines for: ${prompt}${industry ? `\nIndustry: ${industry}` : ''}${audience ? `\nTarget audience: ${audience}` : ''}`;

    } else if (type === 'email_body') {
      systemPrompt = `You are an expert email copywriter. Write email body content.
Rules:
- Tone: ${toneGuide}
- Use short paragraphs (2-3 sentences max)
- Include a clear call-to-action
- Use personalization placeholders like {{first_name}} where natural
- Format with line breaks between paragraphs
- Keep it under 200 words unless specified
- Return ONLY the email body text, no subject line`;

      userPrompt = `Write email body content for: ${prompt}${industry ? `\nIndustry: ${industry}` : ''}${audience ? `\nTarget audience: ${audience}` : ''}${currentContent ? `\nCurrent content to improve: ${currentContent}` : ''}`;

    } else if (type === 'rewrite') {
      systemPrompt = `You are an expert email copywriter. Rewrite the provided content.
Rules:
- Tone: ${toneGuide}
- Maintain the same message/intent
- Improve clarity, engagement, and persuasiveness
- Return ONLY the rewritten text`;

      userPrompt = `Rewrite this email content in a ${tone} tone:\n\n${currentContent}`;

    } else if (type === 'cta') {
      systemPrompt = `You are an expert email marketer. Generate call-to-action button text.
Rules:
- Generate exactly 5 CTA options
- Each under 30 characters
- Tone: ${toneGuide}
- Action-oriented, compelling
- Return ONLY a JSON array of strings`;

      userPrompt = `Generate 5 CTA button texts for: ${prompt}`;

    } else if (type === 'full_email') {
      systemPrompt = `You are an expert email designer. Generate a complete email as structured blocks.
Rules:
- Tone: ${toneGuide}
- Create a compelling, well-structured email
- Return a JSON object with "subject" (string) and "blocks" (array)
- Each block has "type" and "content" fields
- Supported block types: header, text, image, button, divider, spacer, footer, columns, countdown, product
- For header: {text, fontSize:"28", fontWeight:"bold", color:"#1a1a2e", backgroundColor:"#f8f9fa", padding:"30", align:"center"}
- For text: {text, fontSize:"16", color:"#333333", lineHeight:"1.6", padding:"16", align:"left"}
- For button: {text, link:"https://", backgroundColor:"#0d9668", color:"#ffffff", fontSize:"16", borderRadius:"6", padding:"14", align:"center", fullWidth:false}
- For divider: {color:"#e0e0e0", thickness:"1", padding:"16", width:"100"}
- For spacer: {height:"24"}
- For footer: {text, fontSize:"13", color:"#999999", backgroundColor:"#f8f9fa", padding:"24", align:"center", showUnsubscribe:true}
- For columns: {columns:2, gap:"16", padding:"16", col1_text:"...", col2_text:"..."}
- Use personalization like {{first_name}} where natural
- Include a footer with unsubscribe
- Return ONLY the JSON object, no markdown or other text`;

      userPrompt = `Create a complete email for: ${prompt}${industry ? `\nIndustry: ${industry}` : ''}${audience ? `\nTarget audience: ${audience}` : ''}`;
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Please try again in a moment.' }), {
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
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse based on type
    let result: any;
    if (type === 'full_email') {
      // Extract JSON object with subject + blocks
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          result = { subject: parsed.subject || '', blocks: parsed.blocks || [] };
        } catch {
          result = { error: 'Failed to parse generated email structure' };
        }
      } else {
        result = { error: 'Failed to generate email structure' };
      }
    } else if (type === 'subject_lines' || type === 'cta') {
      // Extract JSON array from response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          result = { suggestions: JSON.parse(match[0]) };
        } catch {
          // Fallback: split by lines
          result = { suggestions: content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[\d\-\.\)]+\s*/, '').replace(/^["']|["']$/g, '').trim()) };
        }
      } else {
        result = { suggestions: content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[\d\-\.\)]+\s*/, '').replace(/^["']|["']$/g, '').trim()) };
      }
    } else {
      result = { content: content.trim() };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
