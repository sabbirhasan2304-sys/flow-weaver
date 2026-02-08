import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Comprehensive node definitions with icons and categories
const NODE_CATALOG = {
  triggers: {
    webhook: { label: 'Webhook', icon: 'Webhook', desc: 'Receive HTTP requests' },
    schedule: { label: 'Schedule', icon: 'Clock', desc: 'Time-based trigger' },
    manual: { label: 'Manual Trigger', icon: 'Play', desc: 'Manual start' },
    gmailTrigger: { label: 'Gmail Trigger', icon: 'Gmail', desc: 'New email received' },
    slackTrigger: { label: 'Slack Trigger', icon: 'Slack', desc: 'Slack events' },
    githubTrigger: { label: 'GitHub Trigger', icon: 'GitHub', desc: 'GitHub webhooks' },
    stripeTrigger: { label: 'Stripe Trigger', icon: 'Stripe', desc: 'Payment events' },
    supabaseTrigger: { label: 'Supabase Trigger', icon: 'Supabase', desc: 'Database changes' },
    discordTrigger: { label: 'Discord Trigger', icon: 'Discord', desc: 'Discord events' },
    telegramTrigger: { label: 'Telegram Trigger', icon: 'Telegram', desc: 'Telegram messages' },
    airtableTrigger: { label: 'Airtable Trigger', icon: 'Airtable', desc: 'Record changes' },
    notionTrigger: { label: 'Notion Trigger', icon: 'Notion', desc: 'Page updates' },
    shopifyTrigger: { label: 'Shopify Trigger', icon: 'Shopify', desc: 'E-commerce events' },
    hubspotTrigger: { label: 'HubSpot Trigger', icon: 'HubSpot', desc: 'CRM events' },
    salesforceTrigger: { label: 'Salesforce Trigger', icon: 'Salesforce', desc: 'CRM updates' },
    jiraTrigger: { label: 'Jira Trigger', icon: 'Jira', desc: 'Issue events' },
    trelloTrigger: { label: 'Trello Trigger', icon: 'Trello', desc: 'Card events' },
    asanaTrigger: { label: 'Asana Trigger', icon: 'Asana', desc: 'Task events' },
    calendlyTrigger: { label: 'Calendly Trigger', icon: 'Calendly', desc: 'Booking events' },
    typeformTrigger: { label: 'Typeform Trigger', icon: 'Typeform', desc: 'Form submissions' },
    intercomTrigger: { label: 'Intercom Trigger', icon: 'Intercom', desc: 'Conversations' },
    zendeskTrigger: { label: 'Zendesk Trigger', icon: 'Zendesk', desc: 'Ticket events' },
  },
  actions: {
    httpRequest: { label: 'HTTP Request', icon: 'HTTP', desc: 'Make API calls' },
    sendEmail: { label: 'Send Email', icon: 'Mail', desc: 'Send email via SMTP' },
    gmail: { label: 'Gmail', icon: 'Gmail', desc: 'Gmail actions' },
    slack: { label: 'Slack', icon: 'Slack', desc: 'Send Slack messages' },
    discord: { label: 'Discord', icon: 'Discord', desc: 'Discord messages' },
    telegram: { label: 'Telegram', icon: 'Telegram', desc: 'Telegram messages' },
    twilio: { label: 'Twilio SMS', icon: 'Twilio', desc: 'Send SMS' },
    sendgrid: { label: 'SendGrid', icon: 'SendGrid', desc: 'Transactional emails' },
    mailchimp: { label: 'Mailchimp', icon: 'Mailchimp', desc: 'Email marketing' },
    whatsapp: { label: 'WhatsApp', icon: 'WhatsApp', desc: 'WhatsApp messages' },
    teams: { label: 'Microsoft Teams', icon: 'Teams', desc: 'Teams messages' },
    zoom: { label: 'Zoom', icon: 'Zoom', desc: 'Manage meetings' },
  },
  logic: {
    if: { label: 'IF Condition', icon: 'GitBranch', desc: 'Branch based on condition' },
    switch: { label: 'Switch', icon: 'GitMerge', desc: 'Multi-way branching' },
    loop: { label: 'Loop', icon: 'Repeat', desc: 'Iterate over items' },
    merge: { label: 'Merge', icon: 'Merge', desc: 'Combine branches' },
    filter: { label: 'Filter', icon: 'Filter', desc: 'Filter data' },
    wait: { label: 'Wait/Delay', icon: 'Timer', desc: 'Add delay' },
    errorHandler: { label: 'Error Handler', icon: 'AlertTriangle', desc: 'Handle errors' },
    retry: { label: 'Retry', icon: 'RotateCcw', desc: 'Retry on failure' },
    parallel: { label: 'Parallel', icon: 'Columns', desc: 'Run in parallel' },
  },
  data: {
    setVariable: { label: 'Set Variable', icon: 'Variable', desc: 'Store values' },
    function: { label: 'JavaScript', icon: 'Code', desc: 'Custom code' },
    splitInBatches: { label: 'Split Batches', icon: 'Layers', desc: 'Process in batches' },
    aggregate: { label: 'Aggregate', icon: 'LayoutGrid', desc: 'Combine data' },
    spreadsheet: { label: 'Spreadsheet', icon: 'Table', desc: 'Spreadsheet operations' },
    jsonParse: { label: 'JSON Parse', icon: 'Braces', desc: 'Parse JSON data' },
    transform: { label: 'Transform', icon: 'Wand2', desc: 'Transform data' },
    html: { label: 'HTML Parse', icon: 'Code', desc: 'Parse HTML' },
    xml: { label: 'XML Parse', icon: 'FileCode', desc: 'Parse XML' },
    crypto: { label: 'Crypto', icon: 'Lock', desc: 'Encryption operations' },
    dateTime: { label: 'Date/Time', icon: 'Calendar', desc: 'Date operations' },
  },
  ai: {
    openai: { label: 'OpenAI', icon: 'OpenAI', desc: 'GPT models' },
    anthropic: { label: 'Claude', icon: 'Anthropic', desc: 'Claude AI' },
    gemini: { label: 'Gemini', icon: 'Google', desc: 'Google Gemini' },
    aiTextGeneration: { label: 'AI Text Gen', icon: 'Sparkles', desc: 'Generate text' },
    aiSummarize: { label: 'AI Summarize', icon: 'FileText', desc: 'Summarize content' },
    aiSentiment: { label: 'AI Sentiment', icon: 'Heart', desc: 'Analyze sentiment' },
    aiTranslate: { label: 'AI Translate', icon: 'Languages', desc: 'Translate text' },
    aiClassify: { label: 'AI Classify', icon: 'Tags', desc: 'Classify content' },
    aiExtract: { label: 'AI Extract', icon: 'FileSearch', desc: 'Extract information' },
    aiImage: { label: 'AI Image', icon: 'Image', desc: 'Generate images' },
    huggingface: { label: 'HuggingFace', icon: 'HuggingFace', desc: 'HuggingFace models' },
  },
  databases: {
    supabase: { label: 'Supabase', icon: 'Supabase', desc: 'Supabase operations' },
    postgres: { label: 'PostgreSQL', icon: 'PostgreSQL', desc: 'PostgreSQL queries' },
    mysql: { label: 'MySQL', icon: 'MySQL', desc: 'MySQL queries' },
    mongodb: { label: 'MongoDB', icon: 'MongoDB', desc: 'MongoDB operations' },
    redis: { label: 'Redis', icon: 'Redis', desc: 'Redis cache' },
    airtable: { label: 'Airtable', icon: 'Airtable', desc: 'Airtable operations' },
    notion: { label: 'Notion', icon: 'Notion', desc: 'Notion databases' },
    googleSheets: { label: 'Google Sheets', icon: 'Table', desc: 'Spreadsheet ops' },
    firebase: { label: 'Firebase', icon: 'Firebase', desc: 'Firebase operations' },
    snowflake: { label: 'Snowflake', icon: 'Snowflake', desc: 'Snowflake queries' },
    bigquery: { label: 'BigQuery', icon: 'BigQuery', desc: 'BigQuery analytics' },
  },
  storage: {
    s3: { label: 'AWS S3', icon: 'AWS', desc: 'S3 storage' },
    googleDrive: { label: 'Google Drive', icon: 'Google', desc: 'Google Drive files' },
    dropbox: { label: 'Dropbox', icon: 'Dropbox', desc: 'Dropbox storage' },
    onedrive: { label: 'OneDrive', icon: 'OneDrive', desc: 'OneDrive storage' },
    cloudflare: { label: 'Cloudflare R2', icon: 'Cloudflare', desc: 'R2 storage' },
  },
  productivity: {
    jira: { label: 'Jira', icon: 'Jira', desc: 'Issue management' },
    trello: { label: 'Trello', icon: 'Trello', desc: 'Board management' },
    asana: { label: 'Asana', icon: 'Asana', desc: 'Task management' },
    clickup: { label: 'ClickUp', icon: 'ClickUp', desc: 'Project management' },
    linear: { label: 'Linear', icon: 'Linear', desc: 'Issue tracking' },
    monday: { label: 'Monday.com', icon: 'Monday', desc: 'Work management' },
    github: { label: 'GitHub', icon: 'GitHub', desc: 'GitHub operations' },
    gitlab: { label: 'GitLab', icon: 'GitLab', desc: 'GitLab operations' },
  },
  crm: {
    hubspot: { label: 'HubSpot', icon: 'HubSpot', desc: 'HubSpot CRM' },
    salesforce: { label: 'Salesforce', icon: 'Salesforce', desc: 'Salesforce CRM' },
    pipedrive: { label: 'Pipedrive', icon: 'Pipedrive', desc: 'Sales CRM' },
    intercom: { label: 'Intercom', icon: 'Intercom', desc: 'Customer messaging' },
    zendesk: { label: 'Zendesk', icon: 'Zendesk', desc: 'Support tickets' },
  },
  payments: {
    stripe: { label: 'Stripe', icon: 'Stripe', desc: 'Payment processing' },
    paypal: { label: 'PayPal', icon: 'PayPal', desc: 'PayPal payments' },
    square: { label: 'Square', icon: 'Square', desc: 'Square payments' },
    shopify: { label: 'Shopify', icon: 'Shopify', desc: 'E-commerce' },
    woocommerce: { label: 'WooCommerce', icon: 'WooCommerce', desc: 'WooCommerce' },
  },
  analytics: {
    segment: { label: 'Segment', icon: 'Segment', desc: 'Data pipeline' },
    mixpanel: { label: 'Mixpanel', icon: 'Mixpanel', desc: 'Product analytics' },
    amplitude: { label: 'Amplitude', icon: 'Amplitude', desc: 'Analytics' },
    googleAnalytics: { label: 'Google Analytics', icon: 'Google', desc: 'Web analytics' },
  },
};

// Build compact node list for prompt
const buildNodeList = () => {
  const lines: string[] = [];
  for (const [category, nodes] of Object.entries(NODE_CATALOG)) {
    const nodeList = Object.entries(nodes as Record<string, {label: string}>)
      .map(([type, info]) => type)
      .join(', ');
    lines.push(`${category}: ${nodeList}`);
  }
  return lines.join('\n');
};

// Get category display name
const getCategoryName = (nodeType: string): string => {
  for (const [category, nodes] of Object.entries(NODE_CATALOG)) {
    if (nodeType in (nodes as object)) {
      const categoryMap: Record<string, string> = {
        triggers: 'Triggers',
        actions: 'Actions',
        logic: 'Logic & Flow',
        data: 'Data Manipulation',
        ai: 'AI & Machine Learning',
        databases: 'Databases',
        storage: 'Storage',
        productivity: 'Productivity',
        crm: 'CRM & Sales',
        payments: 'Payments',
        analytics: 'Analytics',
      };
      return categoryMap[category] || 'Actions';
    }
  }
  return 'Actions';
};

// Get node info
const getNodeInfo = (nodeType: string): { label: string; icon: string } | null => {
  for (const nodes of Object.values(NODE_CATALOG)) {
    if (nodeType in (nodes as object)) {
      return (nodes as Record<string, { label: string; icon: string }>)[nodeType];
    }
  }
  return null;
};

// Tool schema for structured output
const workflowSchema = {
  type: "object" as const,
  properties: {
    nodes: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const, description: "Unique ID like trigger-webhook-1, action-slack-2" },
          nodeType: { type: "string" as const, description: "Node type from catalog" },
          label: { type: "string" as const, description: "Display name" },
          config: { 
            type: "object" as const, 
            description: "Node configuration",
            additionalProperties: true
          },
        },
        required: ["id", "nodeType", "label"],
        additionalProperties: false,
      },
      description: "Workflow nodes in execution order"
    },
    connections: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          from: { type: "string" as const, description: "Source node ID" },
          to: { type: "string" as const, description: "Target node ID" },
        },
        required: ["from", "to"],
        additionalProperties: false,
      },
      description: "Connections between nodes"
    },
    description: { type: "string" as const, description: "Brief workflow description" },
  },
  required: ["nodes", "connections", "description"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are an expert workflow automation architect. Create efficient, production-ready workflows.

## Available Node Types:
${buildNodeList()}

## Guidelines:
1. ALWAYS start with a trigger node (from triggers category)
2. Use appropriate nodes for the task - match user intent precisely
3. Include error handling for critical operations
4. Keep workflows focused and efficient
5. Add data transformation nodes when needed
6. Use AI nodes for intelligent processing
7. Connect databases appropriately for CRUD operations

## Common Patterns:
- Webhook → Process → Notify (integration)
- Trigger → Fetch Data → Transform → Store (ETL)
- Form → Validate → Save → Email (automation)
- Event → AI Analyze → Branch → Actions (intelligent routing)
- Schedule → Query → Aggregate → Report (analytics)

Create a workflow that precisely matches the user's requirements.`;

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

    // Use structured tool calling for reliable output
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_workflow',
              description: 'Create a workflow automation with nodes and connections',
              parameters: workflowSchema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'create_workflow' } },
        temperature: 0.2,
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
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract from tool call
    let workflowData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        workflowData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool arguments:', toolCall.function.arguments);
        throw new Error('Failed to parse workflow structure');
      }
    } else {
      // Fallback to content parsing
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from AI');
      
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse workflow');
      
      workflowData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }

    if (!workflowData?.nodes?.length) {
      throw new Error('No nodes generated');
    }

    // Convert to ReactFlow format with proper positioning
    const nodes = workflowData.nodes.map((node: any, i: number) => {
      const nodeInfo = getNodeInfo(node.nodeType);
      const category = getCategoryName(node.nodeType);
      
      // Smart positioning - vertical for small workflows, grid for larger
      const isSmall = workflowData.nodes.length <= 5;
      const x = isSmall ? 100 + i * 280 : 100 + (i % 4) * 280;
      const y = isSmall ? 200 : 100 + Math.floor(i / 4) * 150;
      
      return {
        id: node.id || `node-${i + 1}`,
        type: 'workflowNode',
        position: { x, y },
        data: {
          label: node.label || nodeInfo?.label || `Node ${i + 1}`,
          type: node.nodeType,
          category,
          icon: nodeInfo?.icon || 'Zap',
          config: node.config || {},
        },
      };
    });

    // Create edges from connections
    const edges = (workflowData.connections || []).map((conn: any, i: number) => ({
      id: `edge-${conn.from}-${conn.to}`,
      source: conn.from,
      target: conn.to,
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
    }));

    // If no connections provided, create linear flow
    if (edges.length === 0 && nodes.length > 1) {
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `edge-${nodes[i].id}-${nodes[i + 1].id}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
          animated: true,
          style: { stroke: 'hsl(var(--primary))' },
        });
      }
    }

    console.log(`Generated workflow: ${nodes.length} nodes, ${edges.length} edges`);

    return new Response(JSON.stringify({
      workflow: { nodes, edges },
      description: workflowData.description || 'Generated workflow',
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
