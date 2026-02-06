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
    value: 'github',
    label: 'GitHub',
    icon: 'GitHub',
    description: 'Connect to GitHub API for repositories and actions',
    fields: [
      { name: 'accessToken', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...', required: true, description: 'GitHub PAT with required scopes' },
    ],
  },
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
