import { NodeDefinition, NODE_CATEGORIES } from '@/types/nodes';
import { 
  Webhook, Clock, Play, Mail, MessageSquare, Send, 
  FileSpreadsheet, Database, Code, GitBranch, Repeat, 
  Filter, Merge, Split, Bot, Brain, Sparkles, 
  Globe, FileJson, Zap, Bell, Upload, Download,
  Cloud, Server, Lock, Shield, Coins, BarChart,
  Image, Video, Mic, Settings, Puzzle,
  Slack, Github
} from 'lucide-react';

export const nodeDefinitions: NodeDefinition[] = [
  // ========== TRIGGERS ==========
  {
    type: 'webhook',
    displayName: 'Webhook',
    category: NODE_CATEGORIES.TRIGGERS,
    description: 'Trigger workflow via HTTP webhook',
    icon: 'Webhook',
    color: '#10b981',
    inputs: [],
    outputs: [{ name: 'data', type: 'object' }],
    configSchema: [
      { name: 'method', label: 'HTTP Method', type: 'select', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ], defaultValue: 'POST' },
      { name: 'path', label: 'Webhook Path', type: 'text', placeholder: '/my-webhook' },
    ],
  },
  {
    type: 'schedule',
    displayName: 'Schedule',
    category: NODE_CATEGORIES.TRIGGERS,
    description: 'Trigger workflow on a schedule (cron)',
    icon: 'Clock',
    color: '#10b981',
    inputs: [],
    outputs: [{ name: 'trigger', type: 'object' }],
    configSchema: [
      { name: 'cronExpression', label: 'Cron Expression', type: 'text', placeholder: '0 * * * *', defaultValue: '0 * * * *' },
      { name: 'timezone', label: 'Timezone', type: 'select', options: [
        { label: 'Asia/Dhaka', value: 'Asia/Dhaka' },
        { label: 'UTC', value: 'UTC' },
        { label: 'America/New_York', value: 'America/New_York' },
      ], defaultValue: 'Asia/Dhaka' },
    ],
  },
  {
    type: 'manual',
    displayName: 'Manual Trigger',
    category: NODE_CATEGORIES.TRIGGERS,
    description: 'Manually trigger the workflow',
    icon: 'Play',
    color: '#10b981',
    inputs: [],
    outputs: [{ name: 'trigger', type: 'object' }],
    configSchema: [],
  },
  {
    type: 'gmailTrigger',
    displayName: 'Gmail Trigger',
    category: NODE_CATEGORIES.TRIGGERS,
    description: 'Trigger on new Gmail emails',
    icon: 'Mail',
    color: '#10b981',
    inputs: [],
    outputs: [{ name: 'email', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Gmail Account', type: 'credential', required: true },
      { name: 'labels', label: 'Labels', type: 'text', placeholder: 'INBOX' },
    ],
  },

  // ========== ACTIONS ==========
  {
    type: 'httpRequest',
    displayName: 'HTTP Request',
    category: NODE_CATEGORIES.ACTIONS,
    description: 'Make HTTP API requests',
    icon: 'Globe',
    color: '#3b82f6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'response', type: 'object' }],
    configSchema: [
      { name: 'method', label: 'Method', type: 'select', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ], defaultValue: 'GET' },
      { name: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com', required: true },
      { name: 'headers', label: 'Headers', type: 'json', defaultValue: {} },
      { name: 'body', label: 'Body', type: 'json' },
      { name: 'authentication', label: 'Authentication', type: 'select', options: [
        { label: 'None', value: 'none' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'Bearer Token', value: 'bearer' },
        { label: 'API Key', value: 'apiKey' },
      ], defaultValue: 'none' },
    ],
  },
  {
    type: 'sendEmail',
    displayName: 'Send Email',
    category: NODE_CATEGORIES.ACTIONS,
    description: 'Send emails via SMTP or service',
    icon: 'Send',
    color: '#3b82f6',
    inputs: [{ name: 'data', type: 'object' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Email Credential', type: 'credential', required: true },
      { name: 'to', label: 'To', type: 'text', required: true },
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      { name: 'body', label: 'Body', type: 'textarea' },
      { name: 'isHtml', label: 'HTML Email', type: 'checkbox', defaultValue: false },
    ],
  },
  {
    type: 'slackNotify',
    displayName: 'Slack Notify',
    category: NODE_CATEGORIES.ACTIONS,
    description: 'Send messages to Slack channels',
    icon: 'MessageSquare',
    color: '#3b82f6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Slack Credential', type: 'credential', required: true },
      { name: 'channel', label: 'Channel', type: 'text', placeholder: '#general', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'username', label: 'Bot Username', type: 'text', placeholder: 'FlowForge Bot' },
    ],
  },
  {
    type: 'discordNotify',
    displayName: 'Discord Notify',
    category: NODE_CATEGORIES.ACTIONS,
    description: 'Send messages to Discord',
    icon: 'MessageSquare',
    color: '#3b82f6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'webhookUrl', label: 'Webhook URL', type: 'text', required: true },
      { name: 'content', label: 'Message', type: 'textarea', required: true },
      { name: 'username', label: 'Username', type: 'text' },
    ],
  },
  {
    type: 'telegramSend',
    displayName: 'Telegram Send',
    category: NODE_CATEGORIES.ACTIONS,
    description: 'Send Telegram messages',
    icon: 'Send',
    color: '#3b82f6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Telegram Bot', type: 'credential', required: true },
      { name: 'chatId', label: 'Chat ID', type: 'text', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },

  // ========== DATA MANIPULATION ==========
  {
    type: 'set',
    displayName: 'Set',
    category: NODE_CATEGORIES.DATA,
    description: 'Set values in the data',
    icon: 'Settings',
    color: '#8b5cf6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'data', type: 'object' }],
    configSchema: [
      { name: 'values', label: 'Values', type: 'json', defaultValue: {} },
      { name: 'keepOnlySet', label: 'Keep Only Set Values', type: 'checkbox', defaultValue: false },
    ],
  },
  {
    type: 'merge',
    displayName: 'Merge',
    category: NODE_CATEGORIES.DATA,
    description: 'Merge data from multiple inputs',
    icon: 'Merge',
    color: '#8b5cf6',
    inputs: [
      { name: 'input1', type: 'any' },
      { name: 'input2', type: 'any' },
    ],
    outputs: [{ name: 'merged', type: 'object' }],
    configSchema: [
      { name: 'mode', label: 'Mode', type: 'select', options: [
        { label: 'Append', value: 'append' },
        { label: 'Merge by Key', value: 'mergeByKey' },
        { label: 'Keep Key Matches', value: 'keepKeyMatches' },
      ], defaultValue: 'append' },
    ],
  },
  {
    type: 'splitBatches',
    displayName: 'Split In Batches',
    category: NODE_CATEGORIES.DATA,
    description: 'Split data into smaller batches',
    icon: 'Split',
    color: '#8b5cf6',
    inputs: [{ name: 'data', type: 'array' }],
    outputs: [{ name: 'batch', type: 'array' }],
    configSchema: [
      { name: 'batchSize', label: 'Batch Size', type: 'number', defaultValue: 10 },
    ],
  },
  {
    type: 'code',
    displayName: 'Code',
    category: NODE_CATEGORIES.DATA,
    description: 'Run custom JavaScript/TypeScript',
    icon: 'Code',
    color: '#8b5cf6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'any' }],
    configSchema: [
      { name: 'language', label: 'Language', type: 'select', options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
      ], defaultValue: 'javascript' },
      { name: 'code', label: 'Code', type: 'code', defaultValue: '// Access input data via $input\nreturn $input;' },
    ],
  },
  {
    type: 'jsonParse',
    displayName: 'JSON Parse',
    category: NODE_CATEGORIES.DATA,
    description: 'Parse JSON strings',
    icon: 'FileJson',
    color: '#8b5cf6',
    inputs: [{ name: 'data', type: 'string' }],
    outputs: [{ name: 'parsed', type: 'object' }],
    configSchema: [
      { name: 'sourceField', label: 'Source Field', type: 'text', defaultValue: 'data' },
    ],
  },
  {
    type: 'spreadsheet',
    displayName: 'Spreadsheet File',
    category: NODE_CATEGORIES.DATA,
    description: 'Read/write spreadsheet files',
    icon: 'FileSpreadsheet',
    color: '#8b5cf6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'data', type: 'array' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Read', value: 'read' },
        { label: 'Write', value: 'write' },
      ], defaultValue: 'read' },
      { name: 'fileFormat', label: 'Format', type: 'select', options: [
        { label: 'CSV', value: 'csv' },
        { label: 'Excel', value: 'xlsx' },
      ], defaultValue: 'csv' },
    ],
  },
  {
    type: 'googleSheets',
    displayName: 'Google Sheets',
    category: NODE_CATEGORIES.DATA,
    description: 'Read/write Google Sheets',
    icon: 'FileSpreadsheet',
    color: '#8b5cf6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'data', type: 'array' }],
    configSchema: [
      { name: 'credential', label: 'Google Account', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Read Rows', value: 'read' },
        { label: 'Append Row', value: 'append' },
        { label: 'Update Row', value: 'update' },
        { label: 'Delete Row', value: 'delete' },
      ], defaultValue: 'read' },
      { name: 'sheetId', label: 'Sheet ID', type: 'text', required: true },
      { name: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A:Z' },
    ],
  },

  // ========== LOGIC & FLOW ==========
  {
    type: 'ifCondition',
    displayName: 'If / Switch',
    category: NODE_CATEGORIES.LOGIC,
    description: 'Branch based on conditions',
    icon: 'GitBranch',
    color: '#f59e0b',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [
      { name: 'true', type: 'any' },
      { name: 'false', type: 'any' },
    ],
    configSchema: [
      { name: 'conditions', label: 'Conditions', type: 'json', defaultValue: [] },
      { name: 'combineConditions', label: 'Combine With', type: 'select', options: [
        { label: 'AND', value: 'and' },
        { label: 'OR', value: 'or' },
      ], defaultValue: 'and' },
    ],
  },
  {
    type: 'loop',
    displayName: 'Loop Over Items',
    category: NODE_CATEGORIES.LOGIC,
    description: 'Iterate over array items',
    icon: 'Repeat',
    color: '#f59e0b',
    inputs: [{ name: 'items', type: 'array' }],
    outputs: [{ name: 'item', type: 'any' }],
    configSchema: [
      { name: 'maxIterations', label: 'Max Iterations', type: 'number', defaultValue: 100 },
    ],
  },
  {
    type: 'wait',
    displayName: 'Wait',
    category: NODE_CATEGORIES.LOGIC,
    description: 'Wait for specified time',
    icon: 'Clock',
    color: '#f59e0b',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'data', type: 'any' }],
    configSchema: [
      { name: 'duration', label: 'Duration (ms)', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    type: 'filter',
    displayName: 'Filter',
    category: NODE_CATEGORIES.LOGIC,
    description: 'Filter items based on conditions',
    icon: 'Filter',
    color: '#f59e0b',
    inputs: [{ name: 'items', type: 'array' }],
    outputs: [{ name: 'filtered', type: 'array' }],
    configSchema: [
      { name: 'conditions', label: 'Filter Conditions', type: 'json', defaultValue: [] },
    ],
  },
  {
    type: 'aggregate',
    displayName: 'Aggregate',
    category: NODE_CATEGORIES.LOGIC,
    description: 'Aggregate items together',
    icon: 'Database',
    color: '#f59e0b',
    inputs: [{ name: 'items', type: 'array' }],
    outputs: [{ name: 'aggregated', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Sum', value: 'sum' },
        { label: 'Count', value: 'count' },
        { label: 'Average', value: 'average' },
        { label: 'Min', value: 'min' },
        { label: 'Max', value: 'max' },
      ], defaultValue: 'count' },
      { name: 'field', label: 'Field', type: 'text' },
    ],
  },

  // ========== AI & MACHINE LEARNING ==========
  {
    type: 'openaiChat',
    displayName: 'OpenAI Chat',
    category: NODE_CATEGORIES.AI,
    description: 'Chat with GPT models',
    icon: 'Bot',
    color: '#ec4899',
    inputs: [{ name: 'prompt', type: 'string' }],
    outputs: [{ name: 'response', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'OpenAI API Key', type: 'credential', required: true },
      { name: 'model', label: 'Model', type: 'select', options: [
        { label: 'GPT-4o', value: 'gpt-4o' },
        { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
        { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      ], defaultValue: 'gpt-4o-mini' },
      { name: 'systemPrompt', label: 'System Prompt', type: 'textarea' },
      { name: 'temperature', label: 'Temperature', type: 'number', defaultValue: 0.7 },
      { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    type: 'anthropicChat',
    displayName: 'Claude (Anthropic)',
    category: NODE_CATEGORIES.AI,
    description: 'Chat with Claude models',
    icon: 'Brain',
    color: '#ec4899',
    inputs: [{ name: 'prompt', type: 'string' }],
    outputs: [{ name: 'response', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Anthropic API Key', type: 'credential', required: true },
      { name: 'model', label: 'Model', type: 'select', options: [
        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
        { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
        { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
      ], defaultValue: 'claude-3-5-sonnet-20241022' },
      { name: 'systemPrompt', label: 'System Prompt', type: 'textarea' },
      { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    type: 'gemini',
    displayName: 'Google Gemini',
    category: NODE_CATEGORIES.AI,
    description: 'Use Google Gemini AI',
    icon: 'Sparkles',
    color: '#ec4899',
    inputs: [{ name: 'prompt', type: 'string' }],
    outputs: [{ name: 'response', type: 'object' }],
    configSchema: [
      { name: 'model', label: 'Model', type: 'select', options: [
        { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
        { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
        { label: 'Gemini Pro', value: 'gemini-pro' },
      ], defaultValue: 'gemini-2.5-flash' },
      { name: 'prompt', label: 'Prompt', type: 'textarea', required: true },
    ],
  },
  {
    type: 'aiAgent',
    displayName: 'AI Agent',
    category: NODE_CATEGORIES.AI,
    description: 'AI agent with tool calling',
    icon: 'Bot',
    color: '#ec4899',
    inputs: [{ name: 'task', type: 'string' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'model', label: 'Model', type: 'select', options: [
        { label: 'GPT-4o', value: 'gpt-4o' },
        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
      ], defaultValue: 'gpt-4o' },
      { name: 'tools', label: 'Available Tools', type: 'json', defaultValue: [] },
      { name: 'maxIterations', label: 'Max Iterations', type: 'number', defaultValue: 10 },
    ],
  },
  {
    type: 'huggingFace',
    displayName: 'Hugging Face',
    category: NODE_CATEGORIES.AI,
    description: 'Run ML models from Hugging Face',
    icon: 'Brain',
    color: '#ec4899',
    inputs: [{ name: 'input', type: 'any' }],
    outputs: [{ name: 'output', type: 'any' }],
    configSchema: [
      { name: 'credential', label: 'HF Token', type: 'credential', required: true },
      { name: 'model', label: 'Model ID', type: 'text', placeholder: 'facebook/bart-large-cnn' },
      { name: 'task', label: 'Task', type: 'select', options: [
        { label: 'Text Generation', value: 'text-generation' },
        { label: 'Summarization', value: 'summarization' },
        { label: 'Translation', value: 'translation' },
        { label: 'Sentiment Analysis', value: 'sentiment-analysis' },
        { label: 'Image Classification', value: 'image-classification' },
      ] },
    ],
  },
  {
    type: 'stabilityAI',
    displayName: 'Stability AI',
    category: NODE_CATEGORIES.AI,
    description: 'Generate images with Stable Diffusion',
    icon: 'Image',
    color: '#ec4899',
    inputs: [{ name: 'prompt', type: 'string' }],
    outputs: [{ name: 'image', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Stability API Key', type: 'credential', required: true },
      { name: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      { name: 'negativePrompt', label: 'Negative Prompt', type: 'textarea' },
      { name: 'width', label: 'Width', type: 'number', defaultValue: 1024 },
      { name: 'height', label: 'Height', type: 'number', defaultValue: 1024 },
    ],
  },

  // ========== PRODUCTIVITY ==========
  {
    type: 'notion',
    displayName: 'Notion',
    category: NODE_CATEGORIES.PRODUCTIVITY,
    description: 'Interact with Notion workspaces',
    icon: 'FileSpreadsheet',
    color: '#84cc16',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Notion Integration', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create Page', value: 'createPage' },
        { label: 'Update Page', value: 'updatePage' },
        { label: 'Get Page', value: 'getPage' },
        { label: 'Query Database', value: 'queryDatabase' },
      ] },
      { name: 'databaseId', label: 'Database ID', type: 'text' },
    ],
  },
  {
    type: 'airtable',
    displayName: 'Airtable',
    category: NODE_CATEGORIES.PRODUCTIVITY,
    description: 'Read/write Airtable records',
    icon: 'Database',
    color: '#84cc16',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'records', type: 'array' }],
    configSchema: [
      { name: 'credential', label: 'Airtable API Key', type: 'credential', required: true },
      { name: 'baseId', label: 'Base ID', type: 'text', required: true },
      { name: 'tableName', label: 'Table Name', type: 'text', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'List Records', value: 'list' },
        { label: 'Get Record', value: 'get' },
        { label: 'Create Record', value: 'create' },
        { label: 'Update Record', value: 'update' },
        { label: 'Delete Record', value: 'delete' },
      ] },
    ],
  },
  {
    type: 'trello',
    displayName: 'Trello',
    category: NODE_CATEGORIES.PRODUCTIVITY,
    description: 'Manage Trello boards and cards',
    icon: 'FileSpreadsheet',
    color: '#84cc16',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Trello Credential', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create Card', value: 'createCard' },
        { label: 'Move Card', value: 'moveCard' },
        { label: 'Get Cards', value: 'getCards' },
      ] },
    ],
  },
  {
    type: 'jira',
    displayName: 'Jira',
    category: NODE_CATEGORIES.PRODUCTIVITY,
    description: 'Manage Jira issues',
    icon: 'FileSpreadsheet',
    color: '#84cc16',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'issue', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Jira Credential', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create Issue', value: 'createIssue' },
        { label: 'Update Issue', value: 'updateIssue' },
        { label: 'Get Issue', value: 'getIssue' },
        { label: 'Search Issues', value: 'searchIssues' },
      ] },
    ],
  },

  // ========== DATABASES ==========
  {
    type: 'supabase',
    displayName: 'Supabase',
    category: NODE_CATEGORIES.DATABASES,
    description: 'Query Supabase database',
    icon: 'Database',
    color: '#14b8a6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'any' }],
    configSchema: [
      { name: 'credential', label: 'Supabase Credential', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Select', value: 'select' },
        { label: 'Insert', value: 'insert' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
        { label: 'RPC', value: 'rpc' },
      ] },
      { name: 'table', label: 'Table', type: 'text', required: true },
    ],
  },
  {
    type: 'postgres',
    displayName: 'PostgreSQL',
    category: NODE_CATEGORIES.DATABASES,
    description: 'Execute PostgreSQL queries',
    icon: 'Database',
    color: '#14b8a6',
    inputs: [{ name: 'params', type: 'object' }],
    outputs: [{ name: 'rows', type: 'array' }],
    configSchema: [
      { name: 'credential', label: 'PostgreSQL Credential', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Execute Query', value: 'query' },
        { label: 'Insert', value: 'insert' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
      ] },
      { name: 'query', label: 'Query', type: 'code' },
    ],
  },
  {
    type: 'mongodb',
    displayName: 'MongoDB',
    category: NODE_CATEGORIES.DATABASES,
    description: 'Query MongoDB collections',
    icon: 'Database',
    color: '#14b8a6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'documents', type: 'array' }],
    configSchema: [
      { name: 'credential', label: 'MongoDB Credential', type: 'credential', required: true },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'collection', label: 'Collection', type: 'text', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Find', value: 'find' },
        { label: 'Insert', value: 'insert' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
        { label: 'Aggregate', value: 'aggregate' },
      ] },
    ],
  },
  {
    type: 'redis',
    displayName: 'Redis',
    category: NODE_CATEGORIES.DATABASES,
    description: 'Redis key-value operations',
    icon: 'Database',
    color: '#14b8a6',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'any' }],
    configSchema: [
      { name: 'credential', label: 'Redis Credential', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Get', value: 'get' },
        { label: 'Set', value: 'set' },
        { label: 'Delete', value: 'delete' },
        { label: 'Keys', value: 'keys' },
      ] },
      { name: 'key', label: 'Key', type: 'text' },
    ],
  },

  // ========== STORAGE ==========
  {
    type: 'googleDrive',
    displayName: 'Google Drive',
    category: NODE_CATEGORIES.STORAGE,
    description: 'Manage Google Drive files',
    icon: 'Cloud',
    color: '#6366f1',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'file', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Google Account', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Upload File', value: 'upload' },
        { label: 'Download File', value: 'download' },
        { label: 'List Files', value: 'list' },
        { label: 'Delete File', value: 'delete' },
      ] },
    ],
  },
  {
    type: 'awsS3',
    displayName: 'AWS S3',
    category: NODE_CATEGORIES.STORAGE,
    description: 'S3 bucket operations',
    icon: 'Cloud',
    color: '#6366f1',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'AWS Credential', type: 'credential', required: true },
      { name: 'bucket', label: 'Bucket', type: 'text', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Upload', value: 'upload' },
        { label: 'Download', value: 'download' },
        { label: 'List', value: 'list' },
        { label: 'Delete', value: 'delete' },
      ] },
    ],
  },

  // ========== DEVELOPMENT ==========
  {
    type: 'github',
    displayName: 'GitHub',
    category: NODE_CATEGORIES.DEVELOPMENT,
    description: 'GitHub API operations',
    icon: 'Code',
    color: '#a855f7',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'GitHub Token', type: 'credential', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create Issue', value: 'createIssue' },
        { label: 'Create PR', value: 'createPR' },
        { label: 'Get Repo', value: 'getRepo' },
        { label: 'List Commits', value: 'listCommits' },
      ] },
      { name: 'owner', label: 'Owner', type: 'text', required: true },
      { name: 'repo', label: 'Repository', type: 'text', required: true },
    ],
  },

  // ========== BLOCKCHAIN ==========
  {
    type: 'ethereum',
    displayName: 'Ethereum',
    category: NODE_CATEGORIES.BLOCKCHAIN,
    description: 'Ethereum blockchain operations',
    icon: 'Coins',
    color: '#fbbf24',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'network', label: 'Network', type: 'select', options: [
        { label: 'Mainnet', value: 'mainnet' },
        { label: 'Goerli', value: 'goerli' },
        { label: 'Sepolia', value: 'sepolia' },
      ] },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Get Balance', value: 'getBalance' },
        { label: 'Get Transaction', value: 'getTransaction' },
        { label: 'Call Contract', value: 'callContract' },
      ] },
    ],
  },
  {
    type: 'coingecko',
    displayName: 'CoinGecko',
    category: NODE_CATEGORIES.BLOCKCHAIN,
    description: 'Crypto price data from CoinGecko',
    icon: 'Coins',
    color: '#fbbf24',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'price', type: 'object' }],
    configSchema: [
      { name: 'coinId', label: 'Coin ID', type: 'text', placeholder: 'bitcoin' },
      { name: 'vsCurrency', label: 'Currency', type: 'select', options: [
        { label: 'USD', value: 'usd' },
        { label: 'BDT', value: 'bdt' },
        { label: 'EUR', value: 'eur' },
      ], defaultValue: 'usd' },
    ],
  },

  // ========== ANALYTICS ==========
  {
    type: 'googleAnalytics',
    displayName: 'Google Analytics',
    category: NODE_CATEGORIES.ANALYTICS,
    description: 'Fetch Google Analytics data',
    icon: 'BarChart',
    color: '#22d3ee',
    inputs: [{ name: 'params', type: 'object' }],
    outputs: [{ name: 'data', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Google Account', type: 'credential', required: true },
      { name: 'propertyId', label: 'Property ID', type: 'text', required: true },
      { name: 'dateRange', label: 'Date Range', type: 'select', options: [
        { label: 'Last 7 Days', value: '7d' },
        { label: 'Last 30 Days', value: '30d' },
        { label: 'Last 90 Days', value: '90d' },
      ] },
    ],
  },
  {
    type: 'mixpanel',
    displayName: 'Mixpanel',
    category: NODE_CATEGORIES.ANALYTICS,
    description: 'Track events in Mixpanel',
    icon: 'BarChart',
    color: '#22d3ee',
    inputs: [{ name: 'event', type: 'object' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'credential', label: 'Mixpanel Token', type: 'credential', required: true },
      { name: 'eventName', label: 'Event Name', type: 'text', required: true },
      { name: 'properties', label: 'Properties', type: 'json' },
    ],
  },

  // ========== MEDIA PROCESSING ==========
  {
    type: 'pdfGenerator',
    displayName: 'PDF Generator',
    category: NODE_CATEGORIES.MEDIA,
    description: 'Generate PDFs from templates',
    icon: 'FileSpreadsheet',
    color: '#fb7185',
    inputs: [{ name: 'data', type: 'object' }],
    outputs: [{ name: 'pdf', type: 'object' }],
    configSchema: [
      { name: 'template', label: 'Template', type: 'code' },
      { name: 'format', label: 'Page Format', type: 'select', options: [
        { label: 'A4', value: 'a4' },
        { label: 'Letter', value: 'letter' },
      ], defaultValue: 'a4' },
    ],
  },
  {
    type: 'imageProcessor',
    displayName: 'Image Processor',
    category: NODE_CATEGORIES.MEDIA,
    description: 'Resize, crop, convert images',
    icon: 'Image',
    color: '#fb7185',
    inputs: [{ name: 'image', type: 'object' }],
    outputs: [{ name: 'processed', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Resize', value: 'resize' },
        { label: 'Crop', value: 'crop' },
        { label: 'Convert', value: 'convert' },
        { label: 'Compress', value: 'compress' },
      ] },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
    ],
  },

  // ========== SECURITY ==========
  {
    type: 'jwtValidator',
    displayName: 'JWT Validator',
    category: NODE_CATEGORIES.SECURITY,
    description: 'Validate JWT tokens',
    icon: 'Shield',
    color: '#ef4444',
    inputs: [{ name: 'token', type: 'string' }],
    outputs: [
      { name: 'valid', type: 'boolean' },
      { name: 'payload', type: 'object' },
    ],
    configSchema: [
      { name: 'secret', label: 'Secret/Public Key', type: 'credential', required: true },
      { name: 'algorithm', label: 'Algorithm', type: 'select', options: [
        { label: 'HS256', value: 'HS256' },
        { label: 'RS256', value: 'RS256' },
      ], defaultValue: 'HS256' },
    ],
  },
  {
    type: 'encryption',
    displayName: 'Encryption',
    category: NODE_CATEGORIES.SECURITY,
    description: 'Encrypt/decrypt data',
    icon: 'Lock',
    color: '#ef4444',
    inputs: [{ name: 'data', type: 'any' }],
    outputs: [{ name: 'result', type: 'any' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Encrypt', value: 'encrypt' },
        { label: 'Decrypt', value: 'decrypt' },
      ] },
      { name: 'algorithm', label: 'Algorithm', type: 'select', options: [
        { label: 'AES-256', value: 'aes-256' },
        { label: 'RSA', value: 'rsa' },
      ], defaultValue: 'aes-256' },
      { name: 'key', label: 'Encryption Key', type: 'credential', required: true },
    ],
  },

  // ========== IOT ==========
  {
    type: 'mqttClient',
    displayName: 'MQTT Client',
    category: NODE_CATEGORIES.IOT,
    description: 'MQTT pub/sub messaging',
    icon: 'Zap',
    color: '#4ade80',
    inputs: [{ name: 'message', type: 'any' }],
    outputs: [{ name: 'message', type: 'object' }],
    configSchema: [
      { name: 'broker', label: 'Broker URL', type: 'text', required: true },
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Publish', value: 'publish' },
        { label: 'Subscribe', value: 'subscribe' },
      ] },
    ],
  },
  {
    type: 'websocketClient',
    displayName: 'WebSocket Client',
    category: NODE_CATEGORIES.IOT,
    description: 'WebSocket connections',
    icon: 'Zap',
    color: '#4ade80',
    inputs: [{ name: 'message', type: 'any' }],
    outputs: [{ name: 'message', type: 'object' }],
    configSchema: [
      { name: 'url', label: 'WebSocket URL', type: 'text', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Send', value: 'send' },
        { label: 'Listen', value: 'listen' },
      ] },
    ],
  },
];

// Helper to get nodes by category
export const getNodesByCategory = () => {
  const categories: Record<string, NodeDefinition[]> = {};
  
  nodeDefinitions.forEach((node) => {
    if (!categories[node.category]) {
      categories[node.category] = [];
    }
    categories[node.category].push(node);
  });
  
  return categories;
};

// Helper to get node by type
export const getNodeDefinition = (type: string) => {
  return nodeDefinitions.find((node) => node.type === type);
};
