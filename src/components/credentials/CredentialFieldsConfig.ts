// Configuration for what fields each credential type needs

export interface CredentialField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: { value: string; label: string }[];
}

export interface CredentialTypeConfig {
  value: string;
  label: string;
  icon: string;
  description: string;
  fields: CredentialField[];
}

export const credentialTypeConfigs: CredentialTypeConfig[] = [
  // AI & ML
  {
    value: 'openai',
    label: 'OpenAI',
    icon: 'OpenAI',
    description: 'Connect to OpenAI API for GPT models, DALL-E, and more',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true, description: 'Your OpenAI API key from platform.openai.com' },
      { name: 'organization', label: 'Organization ID', type: 'text', placeholder: 'org-...', description: 'Optional organization ID' },
    ],
  },
  {
    value: 'anthropic',
    label: 'Anthropic Claude',
    icon: 'Anthropic',
    description: 'Connect to Anthropic API for Claude models',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...', required: true, description: 'Your Anthropic API key' },
    ],
  },
  {
    value: 'google',
    label: 'Google (Gmail, Sheets, Drive)',
    icon: 'Google',
    description: 'Connect to Google services via OAuth or API key',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true, description: 'OAuth 2.0 Client ID from Google Cloud Console' },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true, description: 'OAuth 2.0 Client Secret' },
      { name: 'refreshToken', label: 'Refresh Token', type: 'password', description: 'OAuth refresh token (obtained after authorization)' },
    ],
  },
  
  // Communication
  {
    value: 'slack',
    label: 'Slack',
    icon: 'Slack',
    description: 'Connect to Slack workspace for messaging and notifications',
    fields: [
      { name: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', required: true, description: 'Bot User OAuth Token from Slack App settings' },
      { name: 'signingSecret', label: 'Signing Secret', type: 'password', description: 'App Signing Secret for verifying requests' },
    ],
  },
  {
    value: 'discord',
    label: 'Discord',
    icon: 'Discord',
    description: 'Connect to Discord for bot messaging',
    fields: [
      { name: 'botToken', label: 'Bot Token', type: 'password', required: true, description: 'Discord bot token from Developer Portal' },
      { name: 'applicationId', label: 'Application ID', type: 'text', description: 'Discord Application ID' },
    ],
  },
  {
    value: 'telegram',
    label: 'Telegram',
    icon: 'Telegram',
    description: 'Connect to Telegram Bot API',
    fields: [
      { name: 'botToken', label: 'Bot Token', type: 'password', required: true, description: 'Token from @BotFather' },
    ],
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp Business',
    icon: 'WhatsApp',
    description: 'Connect to WhatsApp Business API',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true, description: 'WhatsApp Business API access token' },
      { name: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true, description: 'WhatsApp Phone Number ID' },
    ],
  },
  
  // Development
  {
    value: 'github',
    label: 'GitHub',
    icon: 'GitHub',
    description: 'Connect to GitHub API for repositories and actions',
    fields: [
      { name: 'accessToken', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...', required: true, description: 'GitHub PAT with required scopes' },
    ],
  },
  {
    value: 'gitlab',
    label: 'GitLab',
    icon: 'GitLab',
    description: 'Connect to GitLab API',
    fields: [
      { name: 'accessToken', label: 'Personal Access Token', type: 'password', required: true, description: 'GitLab PAT with required scopes' },
      { name: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://gitlab.com', description: 'For self-hosted GitLab' },
    ],
  },
  {
    value: 'ssh',
    label: 'SSH',
    icon: 'Terminal',
    description: 'SSH connection credentials',
    fields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', description: 'Password (if not using key)' },
      { name: 'privateKey', label: 'Private Key', type: 'password', description: 'SSH private key (PEM format)' },
      { name: 'passphrase', label: 'Passphrase', type: 'password', description: 'Private key passphrase' },
    ],
  },
  {
    value: 'docker',
    label: 'Docker',
    icon: 'Box',
    description: 'Docker host connection',
    fields: [
      { name: 'host', label: 'Docker Host', type: 'text', placeholder: 'tcp://localhost:2376', required: true },
      { name: 'tlsCa', label: 'TLS CA Certificate', type: 'password', description: 'CA certificate for TLS' },
      { name: 'tlsCert', label: 'TLS Certificate', type: 'password', description: 'Client certificate' },
      { name: 'tlsKey', label: 'TLS Key', type: 'password', description: 'Client key' },
    ],
  },
  {
    value: 'kubernetes',
    label: 'Kubernetes',
    icon: 'Server',
    description: 'Kubernetes cluster connection',
    fields: [
      { name: 'kubeconfig', label: 'Kubeconfig', type: 'password', required: true, description: 'Full kubeconfig YAML' },
    ],
  },
  {
    value: 'vercel',
    label: 'Vercel',
    icon: 'Rocket',
    description: 'Vercel API access',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true, description: 'Vercel access token from account settings' },
    ],
  },
  
  // Payments
  {
    value: 'stripe',
    label: 'Stripe',
    icon: 'Stripe',
    description: 'Connect to Stripe for payments',
    fields: [
      { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_...', required: true, description: 'Stripe Secret Key (use test key for testing)' },
      { name: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_...', description: 'Stripe Publishable Key' },
      { name: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', description: 'Webhook signing secret' },
    ],
  },
  {
    value: 'paypal',
    label: 'PayPal',
    icon: 'PayPal',
    description: 'Connect to PayPal for payments',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'sandbox', label: 'Environment', type: 'select', options: [
        { value: 'sandbox', label: 'Sandbox' },
        { value: 'live', label: 'Live' },
      ]},
    ],
  },
  {
    value: 'sslcommerz',
    label: 'SSLCommerz',
    icon: 'CreditCard',
    description: 'Connect to SSLCommerz payment gateway',
    fields: [
      { name: 'storeId', label: 'Store ID', type: 'text', required: true },
      { name: 'storePassword', label: 'Store Password', type: 'password', required: true },
      { name: 'sandbox', label: 'Sandbox Mode', type: 'select', options: [
        { value: 'true', label: 'Yes (Testing)' },
        { value: 'false', label: 'No (Production)' },
      ]},
    ],
  },
  {
    value: 'bkash',
    label: 'bKash',
    icon: 'Bkash',
    description: 'Connect to bKash payment gateway',
    fields: [
      { name: 'appKey', label: 'App Key', type: 'text', required: true },
      { name: 'appSecret', label: 'App Secret', type: 'password', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'sandbox', label: 'Sandbox Mode', type: 'select', options: [
        { value: 'true', label: 'Yes (Testing)' },
        { value: 'false', label: 'No (Production)' },
      ]},
    ],
  },
  {
    value: 'nagad',
    label: 'Nagad',
    icon: 'Nagad',
    description: 'Connect to Nagad payment gateway',
    fields: [
      { name: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { name: 'merchantPrivateKey', label: 'Merchant Private Key', type: 'password', required: true },
      { name: 'pgPublicKey', label: 'PG Public Key', type: 'password', required: true },
      { name: 'sandbox', label: 'Sandbox Mode', type: 'select', options: [
        { value: 'true', label: 'Yes (Testing)' },
        { value: 'false', label: 'No (Production)' },
      ]},
    ],
  },
  
  // Cloud Providers
  {
    value: 'aws',
    label: 'AWS',
    icon: 'AWS',
    description: 'Connect to Amazon Web Services',
    fields: [
      { name: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, description: 'IAM Access Key ID' },
      { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, description: 'IAM Secret Access Key' },
      { name: 'region', label: 'Region', type: 'select', required: true, options: [
        { value: 'us-east-1', label: 'US East (N. Virginia)' },
        { value: 'us-west-2', label: 'US West (Oregon)' },
        { value: 'eu-west-1', label: 'EU (Ireland)' },
        { value: 'eu-central-1', label: 'EU (Frankfurt)' },
        { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
        { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
      ]},
    ],
  },
  {
    value: 'googleCloud',
    label: 'Google Cloud',
    icon: 'Google',
    description: 'Connect to Google Cloud Platform',
    fields: [
      { name: 'serviceAccountJson', label: 'Service Account JSON', type: 'password', required: true, description: 'Full JSON key file contents' },
    ],
  },
  
  // Databases
  {
    value: 'supabase',
    label: 'Supabase',
    icon: 'Supabase',
    description: 'Connect to an external Supabase project',
    fields: [
      { name: 'url', label: 'Project URL', type: 'text', placeholder: 'https://xxx.supabase.co', required: true },
      { name: 'anonKey', label: 'Anon/Public Key', type: 'password', required: true, description: 'Supabase anon key' },
      { name: 'serviceRoleKey', label: 'Service Role Key', type: 'password', description: 'For admin operations (optional)' },
    ],
  },
  {
    value: 'postgres',
    label: 'PostgreSQL',
    icon: 'Postgres',
    description: 'Connect to a PostgreSQL database',
    fields: [
      { name: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { name: 'port', label: 'Port', type: 'number', placeholder: '5432', required: true },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'ssl', label: 'SSL Mode', type: 'select', options: [
        { value: 'disable', label: 'Disable' },
        { value: 'require', label: 'Require' },
        { value: 'verify-ca', label: 'Verify CA' },
      ]},
    ],
  },
  {
    value: 'mongodb',
    label: 'MongoDB',
    icon: 'MongoDB',
    description: 'Connect to MongoDB database',
    fields: [
      { name: 'connectionString', label: 'Connection String', type: 'password', placeholder: 'mongodb+srv://...', required: true, description: 'Full MongoDB connection URI' },
    ],
  },
  {
    value: 'mysql',
    label: 'MySQL',
    icon: 'MySQL',
    description: 'Connect to MySQL database',
    fields: [
      { name: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { name: 'port', label: 'Port', type: 'number', placeholder: '3306', required: true },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },
  {
    value: 'redis',
    label: 'Redis',
    icon: 'Redis',
    description: 'Connect to Redis database',
    fields: [
      { name: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { name: 'port', label: 'Port', type: 'number', placeholder: '6379', required: true },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'database', label: 'Database Number', type: 'number', placeholder: '0' },
    ],
  },
  
  // Email
  {
    value: 'smtp',
    label: 'SMTP Email',
    icon: 'SMTP',
    description: 'Send emails via SMTP server',
    fields: [
      { name: 'host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
      { name: 'port', label: 'Port', type: 'number', placeholder: '587', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'secure', label: 'Security', type: 'select', options: [
        { value: 'tls', label: 'TLS (recommended)' },
        { value: 'ssl', label: 'SSL' },
        { value: 'none', label: 'None' },
      ]},
      { name: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'noreply@example.com' },
      { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'My App' },
    ],
  },
  {
    value: 'sendgrid',
    label: 'SendGrid',
    icon: 'SendGrid',
    description: 'Send emails via SendGrid',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG...', required: true },
      { name: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'noreply@example.com' },
      { name: 'fromName', label: 'From Name', type: 'text' },
    ],
  },
  {
    value: 'mailchimp',
    label: 'Mailchimp',
    icon: 'Mailchimp',
    description: 'Connect to Mailchimp for email marketing',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true, description: 'Mailchimp API key' },
      { name: 'server', label: 'Server Prefix', type: 'text', placeholder: 'us1', required: true, description: 'The server prefix (e.g., us1, us2)' },
    ],
  },
  
  // SMS
  {
    value: 'twilio',
    label: 'Twilio',
    icon: 'Twilio',
    description: 'Send SMS and make calls via Twilio',
    fields: [
      { name: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { name: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { name: 'phoneNumber', label: 'Twilio Phone Number', type: 'text', placeholder: '+1234567890' },
    ],
  },
  
  // Productivity
  {
    value: 'notion',
    label: 'Notion',
    icon: 'Notion',
    description: 'Connect to Notion API',
    fields: [
      { name: 'apiKey', label: 'Integration Token', type: 'password', placeholder: 'secret_...', required: true, description: 'Notion internal integration token' },
    ],
  },
  {
    value: 'airtable',
    label: 'Airtable',
    icon: 'Airtable',
    description: 'Connect to Airtable API',
    fields: [
      { name: 'apiKey', label: 'Personal Access Token', type: 'password', required: true, description: 'Airtable personal access token' },
    ],
  },
  {
    value: 'trello',
    label: 'Trello',
    icon: 'Trello',
    description: 'Connect to Trello API',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'text', required: true },
      { name: 'token', label: 'Token', type: 'password', required: true },
    ],
  },
  {
    value: 'jira',
    label: 'Jira',
    icon: 'Jira',
    description: 'Connect to Jira API',
    fields: [
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'apiToken', label: 'API Token', type: 'password', required: true },
      { name: 'domain', label: 'Domain', type: 'text', placeholder: 'your-domain.atlassian.net', required: true },
    ],
  },
  {
    value: 'asana',
    label: 'Asana',
    icon: 'Asana',
    description: 'Connect to Asana API',
    fields: [
      { name: 'accessToken', label: 'Personal Access Token', type: 'password', required: true },
    ],
  },
  {
    value: 'clickup',
    label: 'ClickUp',
    icon: 'ClickUp',
    description: 'Connect to ClickUp API',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    value: 'linear',
    label: 'Linear',
    icon: 'Linear',
    description: 'Connect to Linear API',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    value: 'todoist',
    label: 'Todoist',
    icon: 'CheckSquare',
    description: 'Connect to Todoist API',
    fields: [
      { name: 'apiToken', label: 'API Token', type: 'password', required: true },
    ],
  },
  
  // CRM
  {
    value: 'hubspot',
    label: 'HubSpot',
    icon: 'HubSpot',
    description: 'Connect to HubSpot CRM',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true, description: 'HubSpot private app access token' },
    ],
  },
  {
    value: 'salesforce',
    label: 'Salesforce',
    icon: 'Salesforce',
    description: 'Connect to Salesforce CRM',
    fields: [
      { name: 'instanceUrl', label: 'Instance URL', type: 'text', placeholder: 'https://your-domain.salesforce.com', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { name: 'refreshToken', label: 'Refresh Token', type: 'password' },
    ],
  },
  
  // Analytics
  {
    value: 'mixpanel',
    label: 'Mixpanel',
    icon: 'Activity',
    description: 'Connect to Mixpanel analytics',
    fields: [
      { name: 'projectToken', label: 'Project Token', type: 'password', required: true },
      { name: 'apiSecret', label: 'API Secret', type: 'password', description: 'For export operations' },
    ],
  },
  {
    value: 'segment',
    label: 'Segment',
    icon: 'Activity',
    description: 'Connect to Segment analytics',
    fields: [
      { name: 'writeKey', label: 'Write Key', type: 'password', required: true },
    ],
  },
  {
    value: 'amplitude',
    label: 'Amplitude',
    icon: 'TrendingUp',
    description: 'Connect to Amplitude analytics',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'password', description: 'For export operations' },
    ],
  },
  {
    value: 'looker',
    label: 'Looker',
    icon: 'BarChart',
    description: 'Connect to Looker BI',
    fields: [
      { name: 'baseUrl', label: 'Base URL', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  
  // Storage
  {
    value: 'dropbox',
    label: 'Dropbox',
    icon: 'Dropbox',
    description: 'Connect to Dropbox',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    value: 'onedrive',
    label: 'OneDrive',
    icon: 'OneDrive',
    description: 'Connect to Microsoft OneDrive',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
  },
  {
    value: 'box',
    label: 'Box',
    icon: 'Box',
    description: 'Connect to Box storage',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  
  // Blockchain
  {
    value: 'moralis',
    label: 'Moralis',
    icon: 'Globe',
    description: 'Connect to Moralis Web3 API',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    value: 'coinbase',
    label: 'Coinbase',
    icon: 'DollarSign',
    description: 'Connect to Coinbase API',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
  },
  {
    value: 'wallet',
    label: 'Crypto Wallet',
    icon: 'Wallet',
    description: 'Crypto wallet private key',
    fields: [
      { name: 'privateKey', label: 'Private Key', type: 'password', required: true, description: 'Wallet private key (keep secure!)' },
    ],
  },
  
  // IoT
  {
    value: 'mqtt',
    label: 'MQTT',
    icon: 'Radio',
    description: 'MQTT broker credentials',
    fields: [
      { name: 'username', label: 'Username', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'clientId', label: 'Client ID', type: 'text' },
    ],
  },
  {
    value: 'homeAssistant',
    label: 'Home Assistant',
    icon: 'Home',
    description: 'Home Assistant API access',
    fields: [
      { name: 'accessToken', label: 'Long-Lived Access Token', type: 'password', required: true },
    ],
  },
  
  // E-commerce
  {
    value: 'shopify',
    label: 'Shopify',
    icon: 'Shopify',
    description: 'Connect to Shopify store',
    fields: [
      { name: 'shopDomain', label: 'Shop Domain', type: 'text', placeholder: 'your-store.myshopify.com', required: true },
      { name: 'accessToken', label: 'Admin API Access Token', type: 'password', required: true },
    ],
  },
  {
    value: 'woocommerce',
    label: 'WooCommerce',
    icon: 'WooCommerce',
    description: 'Connect to WooCommerce store',
    fields: [
      { name: 'url', label: 'Store URL', type: 'text', placeholder: 'https://your-store.com', required: true },
      { name: 'consumerKey', label: 'Consumer Key', type: 'text', required: true },
      { name: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
  },
  
  // Media
  {
    value: 'elevenlabs',
    label: 'ElevenLabs',
    icon: 'Volume2',
    description: 'Connect to ElevenLabs for AI voice',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    value: 'assemblyai',
    label: 'AssemblyAI',
    icon: 'Mic',
    description: 'Connect to AssemblyAI for transcription',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  
  // Generic Auth
  {
    value: 'http',
    label: 'HTTP Basic Auth',
    icon: 'HTTP',
    description: 'HTTP Basic Authentication credentials',
    fields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },
  {
    value: 'bearer',
    label: 'Bearer Token',
    icon: 'Bearer',
    description: 'Bearer token for API authentication',
    fields: [
      { name: 'token', label: 'Bearer Token', type: 'password', required: true, description: 'Token to be sent in Authorization header' },
    ],
  },
  {
    value: 'apikey',
    label: 'API Key',
    icon: 'APIKey',
    description: 'Generic API key authentication',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'headerName', label: 'Header Name', type: 'text', placeholder: 'X-API-Key', description: 'Header name to send the key in' },
    ],
  },
  {
    value: 'oauth2',
    label: 'OAuth2',
    icon: 'OAuth2',
    description: 'OAuth 2.0 authentication',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'authorizationUrl', label: 'Authorization URL', type: 'text', required: true },
      { name: 'tokenUrl', label: 'Token URL', type: 'text', required: true },
      { name: 'scopes', label: 'Scopes', type: 'text', placeholder: 'read write', description: 'Space-separated list of scopes' },
      { name: 'accessToken', label: 'Access Token', type: 'password', description: 'Current access token (auto-filled after auth)' },
      { name: 'refreshToken', label: 'Refresh Token', type: 'password', description: 'Refresh token for token renewal' },
    ],
  },
];

export const getCredentialTypeConfig = (type: string): CredentialTypeConfig | undefined => {
  return credentialTypeConfigs.find(c => c.value === type);
};
