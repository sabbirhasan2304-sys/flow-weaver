import { NodeDefinition, NODE_CATEGORIES, CATEGORY_COLORS } from '@/types/nodes';

const CAT = NODE_CATEGORIES.EMAIL_MARKETING;
const COLOR = CATEGORY_COLORS[CAT];

export const emailMarketingNodes: NodeDefinition[] = [
  // ============================================================
  // CAMPAIGN MANAGEMENT
  // ============================================================
  {
    type: 'bzCampaignCreate',
    displayName: 'Create Campaign',
    category: CAT,
    description: 'Create a new email campaign',
    icon: 'Mail',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'campaign', type: 'object' }],
    configSchema: [
      { name: 'name', label: 'Campaign Name', type: 'text', required: true },
      { name: 'subject', label: 'Subject Line', type: 'text', required: true },
      { name: 'fromName', label: 'From Name', type: 'text' },
      { name: 'fromEmail', label: 'From Email', type: 'text' },
      { name: 'listId', label: 'List ID', type: 'text', description: 'Target mailing list' },
      { name: 'templateId', label: 'Template ID', type: 'text', description: 'Email template to use' },
      { name: 'campaignType', label: 'Type', type: 'select', options: [
        { label: 'Regular', value: 'regular' },
        { label: 'A/B Test', value: 'ab_test' },
        { label: 'Automated', value: 'automated' },
      ], defaultValue: 'regular' },
      { name: 'htmlContent', label: 'HTML Content', type: 'code', description: 'Override template with raw HTML' },
      { name: 'smtpConfigId', label: 'SMTP Config ID', type: 'text', description: 'SMTP sender to use' },
    ],
  },
  {
    type: 'bzCampaignSend',
    displayName: 'Send Campaign',
    category: CAT,
    description: 'Send or schedule an email campaign',
    icon: 'Send',
    color: COLOR,
    inputs: [{ name: 'campaign', type: 'object' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'campaignId', label: 'Campaign ID', type: 'text', required: true },
      { name: 'schedule', label: 'Schedule', type: 'select', options: [
        { label: 'Send Now', value: 'now' },
        { label: 'Schedule', value: 'schedule' },
      ], defaultValue: 'now' },
      { name: 'scheduledAt', label: 'Scheduled Date/Time', type: 'text', description: 'ISO 8601 datetime (if scheduled)' },
    ],
  },
  {
    type: 'bzCampaignStats',
    displayName: 'Campaign Stats',
    category: CAT,
    description: 'Get campaign performance analytics',
    icon: 'BarChart3',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'stats', type: 'object' }],
    configSchema: [
      { name: 'campaignId', label: 'Campaign ID', type: 'text', required: true },
    ],
  },

  // ============================================================
  // CONTACT MANAGEMENT
  // ============================================================
  {
    type: 'bzContactCreate',
    displayName: 'Create Contact',
    category: CAT,
    description: 'Add a new contact to your audience',
    icon: 'UserPlus',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'contact', type: 'object' }],
    configSchema: [
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'firstName', label: 'First Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'source', label: 'Source', type: 'select', options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Import', value: 'import' },
        { label: 'API', value: 'api' },
        { label: 'Form', value: 'form' },
        { label: 'Shopify', value: 'shopify' },
        { label: 'WordPress', value: 'wordpress' },
      ], defaultValue: 'api' },
      { name: 'customFields', label: 'Custom Fields', type: 'json', defaultValue: {} },
      { name: 'listId', label: 'Add to List ID', type: 'text' },
    ],
  },
  {
    type: 'bzContactUpdate',
    displayName: 'Update Contact',
    category: CAT,
    description: 'Update an existing contact',
    icon: 'UserCog',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'contact', type: 'object' }],
    configSchema: [
      { name: 'contactId', label: 'Contact ID', type: 'text', description: 'ID or email of the contact' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'firstName', label: 'First Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Bounced', value: 'bounced' },
        { label: 'Complained', value: 'complained' },
      ] },
      { name: 'customFields', label: 'Custom Fields', type: 'json', defaultValue: {} },
    ],
  },
  {
    type: 'bzContactLookup',
    displayName: 'Lookup Contact',
    category: CAT,
    description: 'Find a contact by email or ID',
    icon: 'Search',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'contact', type: 'object' }],
    configSchema: [
      { name: 'lookupBy', label: 'Lookup By', type: 'select', options: [
        { label: 'Email', value: 'email' },
        { label: 'Contact ID', value: 'id' },
      ], defaultValue: 'email' },
      { name: 'value', label: 'Value', type: 'text', required: true },
    ],
  },
  {
    type: 'bzContactTag',
    displayName: 'Tag Contact',
    category: CAT,
    description: 'Add or remove tags from a contact',
    icon: 'Tag',
    color: COLOR,
    inputs: [{ name: 'contact', type: 'object' }],
    outputs: [{ name: 'contact', type: 'object' }],
    configSchema: [
      { name: 'contactId', label: 'Contact ID', type: 'text', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Add Tag', value: 'add' },
        { label: 'Remove Tag', value: 'remove' },
      ], defaultValue: 'add' },
      { name: 'tagName', label: 'Tag Name', type: 'text', required: true },
    ],
  },

  // ============================================================
  // LIST MANAGEMENT
  // ============================================================
  {
    type: 'bzListManage',
    displayName: 'Manage List',
    category: CAT,
    description: 'Create, update, or manage email lists',
    icon: 'List',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'list', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create List', value: 'create' },
        { label: 'Get List', value: 'get' },
        { label: 'Get All Lists', value: 'getAll' },
        { label: 'Update List', value: 'update' },
        { label: 'Delete List', value: 'delete' },
      ], defaultValue: 'getAll' },
      { name: 'listId', label: 'List ID', type: 'text', description: 'Required for get/update/delete' },
      { name: 'name', label: 'List Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    type: 'bzListSubscribe',
    displayName: 'List Subscribe',
    category: CAT,
    description: 'Add or remove contacts from a list',
    icon: 'UserCheck',
    color: COLOR,
    inputs: [{ name: 'contact', type: 'object' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'listId', label: 'List ID', type: 'text', required: true },
      { name: 'contactId', label: 'Contact ID', type: 'text', required: true },
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Subscribe', value: 'subscribe' },
        { label: 'Unsubscribe', value: 'unsubscribe' },
      ], defaultValue: 'subscribe' },
    ],
  },

  // ============================================================
  // TEMPLATE MANAGEMENT
  // ============================================================
  {
    type: 'bzTemplateManage',
    displayName: 'Email Template',
    category: CAT,
    description: 'Create or retrieve email templates',
    icon: 'FileText',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'template', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create Template', value: 'create' },
        { label: 'Get Template', value: 'get' },
        { label: 'Get All Templates', value: 'getAll' },
        { label: 'Update Template', value: 'update' },
        { label: 'Delete Template', value: 'delete' },
      ], defaultValue: 'getAll' },
      { name: 'templateId', label: 'Template ID', type: 'text' },
      { name: 'name', label: 'Template Name', type: 'text' },
      { name: 'subject', label: 'Subject', type: 'text' },
      { name: 'htmlContent', label: 'HTML Content', type: 'code' },
      { name: 'category', label: 'Category', type: 'select', options: [
        { label: 'Custom', value: 'custom' },
        { label: 'Newsletter', value: 'newsletter' },
        { label: 'Promotional', value: 'promotional' },
        { label: 'Transactional', value: 'transactional' },
        { label: 'Welcome', value: 'welcome' },
      ], defaultValue: 'custom' },
    ],
  },

  // ============================================================
  // AUTOMATION
  // ============================================================
  {
    type: 'bzAutomationTrigger',
    displayName: 'Email Automation Trigger',
    category: CAT,
    description: 'Trigger an email automation journey',
    icon: 'Workflow',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'automation', type: 'object' }],
    configSchema: [
      { name: 'automationId', label: 'Automation ID', type: 'text', required: true },
      { name: 'contactEmail', label: 'Contact Email', type: 'text', required: true },
      { name: 'triggerData', label: 'Trigger Data', type: 'json', defaultValue: {}, description: 'Custom data passed to the automation' },
    ],
  },
  {
    type: 'bzAutomationManage',
    displayName: 'Manage Automation',
    category: CAT,
    description: 'Create, pause, or manage email automations',
    icon: 'Settings',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'automation', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Get All Automations', value: 'getAll' },
        { label: 'Get Automation', value: 'get' },
        { label: 'Activate', value: 'activate' },
        { label: 'Pause', value: 'pause' },
        { label: 'Get Stats', value: 'stats' },
      ], defaultValue: 'getAll' },
      { name: 'automationId', label: 'Automation ID', type: 'text' },
    ],
  },

  // ============================================================
  // SEND EMAIL (TRANSACTIONAL)
  // ============================================================
  {
    type: 'bzSendTransactional',
    displayName: 'Send Transactional Email',
    category: CAT,
    description: 'Send a single transactional email via your SMTP config',
    icon: 'Send',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'to', label: 'To Email', type: 'text', required: true },
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      { name: 'htmlContent', label: 'HTML Body', type: 'code', required: true },
      { name: 'textContent', label: 'Plain Text Body', type: 'textarea' },
      { name: 'fromEmail', label: 'From Email', type: 'text' },
      { name: 'fromName', label: 'From Name', type: 'text' },
      { name: 'smtpConfigId', label: 'SMTP Config ID', type: 'text', description: 'Uses default SMTP if empty' },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { label: 'High', value: 'high' },
        { label: 'Normal', value: 'normal' },
        { label: 'Low', value: 'low' },
      ], defaultValue: 'normal' },
    ],
  },

  // ============================================================
  // SMTP MANAGEMENT
  // ============================================================
  {
    type: 'bzSmtpManage',
    displayName: 'SMTP Config',
    category: CAT,
    description: 'Manage SMTP sender configurations',
    icon: 'Server',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'config', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Get All Configs', value: 'getAll' },
        { label: 'Get Config', value: 'get' },
        { label: 'Create Config', value: 'create' },
        { label: 'Test Connection', value: 'test' },
      ], defaultValue: 'getAll' },
      { name: 'configId', label: 'Config ID', type: 'text' },
      { name: 'provider', label: 'Provider', type: 'select', options: [
        { label: 'cPanel SMTP', value: 'cpanel' },
        { label: 'Gmail', value: 'gmail' },
        { label: 'SendGrid', value: 'sendgrid' },
        { label: 'Mailgun', value: 'mailgun' },
        { label: 'Amazon SES', value: 'ses' },
        { label: 'Custom SMTP', value: 'custom' },
      ], defaultValue: 'cpanel' },
      { name: 'host', label: 'Host', type: 'text' },
      { name: 'port', label: 'Port', type: 'number', defaultValue: 465 },
      { name: 'fromEmail', label: 'From Email', type: 'text' },
      { name: 'fromName', label: 'From Name', type: 'text' },
    ],
  },

  // ============================================================
  // SEGMENT & AUDIENCE
  // ============================================================
  {
    type: 'bzSegmentFilter',
    displayName: 'Segment Filter',
    category: CAT,
    description: 'Filter contacts by segment rules',
    icon: 'Filter',
    color: COLOR,
    inputs: [{ name: 'contacts', type: 'array' }],
    outputs: [{ name: 'matched', type: 'array' }, { name: 'unmatched', type: 'array' }],
    configSchema: [
      { name: 'segmentType', label: 'Segment Type', type: 'select', options: [
        { label: 'Tag-based', value: 'tag' },
        { label: 'Activity-based', value: 'activity' },
        { label: 'RFM Score', value: 'rfm' },
        { label: 'Custom Field', value: 'custom' },
        { label: 'Engagement', value: 'engagement' },
      ], defaultValue: 'tag' },
      { name: 'tagName', label: 'Tag Name', type: 'text', description: 'For tag-based segments' },
      { name: 'activityType', label: 'Activity', type: 'select', options: [
        { label: 'Opened any email', value: 'opened' },
        { label: 'Clicked any link', value: 'clicked' },
        { label: 'Never opened', value: 'never_opened' },
        { label: 'Inactive 30 days', value: 'inactive_30' },
        { label: 'Inactive 90 days', value: 'inactive_90' },
      ] },
      { name: 'customRule', label: 'Custom Rule (JSON)', type: 'json', defaultValue: {} },
    ],
  },

  // ============================================================
  // A/B TESTING
  // ============================================================
  {
    type: 'bzAbTest',
    displayName: 'A/B Test',
    category: CAT,
    description: 'Set up A/B testing for campaigns',
    icon: 'FlaskConical',
    color: COLOR,
    inputs: [{ name: 'campaign', type: 'object' }],
    outputs: [{ name: 'winner', type: 'object' }, { name: 'results', type: 'object' }],
    configSchema: [
      { name: 'campaignId', label: 'Campaign ID', type: 'text', required: true },
      { name: 'metric', label: 'Winning Metric', type: 'select', options: [
        { label: 'Open Rate', value: 'opens' },
        { label: 'Click Rate', value: 'clicks' },
        { label: 'Revenue', value: 'revenue' },
      ], defaultValue: 'opens' },
      { name: 'samplePercent', label: 'Sample Size (%)', type: 'number', defaultValue: 30 },
      { name: 'durationHours', label: 'Test Duration (hours)', type: 'number', defaultValue: 4 },
      { name: 'subjectA', label: 'Subject A', type: 'text' },
      { name: 'subjectB', label: 'Subject B', type: 'text' },
    ],
  },

  // ============================================================
  // EMAIL ANALYTICS
  // ============================================================
  {
    type: 'bzEmailAnalytics',
    displayName: 'Email Analytics',
    category: CAT,
    description: 'Retrieve email engagement analytics',
    icon: 'TrendingUp',
    color: COLOR,
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'analytics', type: 'object' }],
    configSchema: [
      { name: 'scope', label: 'Scope', type: 'select', options: [
        { label: 'Campaign', value: 'campaign' },
        { label: 'Contact', value: 'contact' },
        { label: 'List', value: 'list' },
        { label: 'Global Overview', value: 'global' },
      ], defaultValue: 'campaign' },
      { name: 'campaignId', label: 'Campaign ID', type: 'text', description: 'For campaign scope' },
      { name: 'contactId', label: 'Contact ID', type: 'text', description: 'For contact scope' },
      { name: 'dateRange', label: 'Date Range', type: 'select', options: [
        { label: 'Last 7 days', value: '7d' },
        { label: 'Last 30 days', value: '30d' },
        { label: 'Last 90 days', value: '90d' },
        { label: 'All time', value: 'all' },
      ], defaultValue: '30d' },
    ],
  },

  // ============================================================
  // SIGNUP FORMS & LANDING PAGES
  // ============================================================
  {
    type: 'bzFormSubmission',
    displayName: 'Form Submission Handler',
    category: CAT,
    description: 'Process signup form submissions',
    icon: 'ClipboardList',
    color: COLOR,
    inputs: [{ name: 'formData', type: 'object' }],
    outputs: [{ name: 'contact', type: 'object' }],
    configSchema: [
      { name: 'listId', label: 'Subscribe to List', type: 'text', required: true },
      { name: 'doubleOptIn', label: 'Double Opt-In', type: 'checkbox', defaultValue: true },
      { name: 'welcomeEmail', label: 'Send Welcome Email', type: 'checkbox', defaultValue: true },
      { name: 'tags', label: 'Auto-assign Tags', type: 'text', description: 'Comma-separated tag names' },
      { name: 'redirectUrl', label: 'Thank You Page URL', type: 'text' },
    ],
  },

  // ============================================================
  // GDPR / COMPLIANCE
  // ============================================================
  {
    type: 'bzGdprAction',
    displayName: 'GDPR Action',
    category: CAT,
    description: 'Handle GDPR compliance actions',
    icon: 'Shield',
    color: COLOR,
    inputs: [{ name: 'contact', type: 'object' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'action', label: 'Action', type: 'select', options: [
        { label: 'Export Data', value: 'export' },
        { label: 'Delete Data', value: 'delete' },
        { label: 'Update Consent', value: 'consent' },
        { label: 'Unsubscribe All', value: 'unsubscribe_all' },
      ], defaultValue: 'export' },
      { name: 'contactEmail', label: 'Contact Email', type: 'text', required: true },
      { name: 'reason', label: 'Reason', type: 'text' },
    ],
  },

  // ============================================================
  // SEND TIME OPTIMIZATION
  // ============================================================
  {
    type: 'bzSendTimeOptimize',
    displayName: 'Send Time Optimizer',
    category: CAT,
    description: 'Determine optimal send time for a contact or segment',
    icon: 'Clock',
    color: COLOR,
    inputs: [{ name: 'campaign', type: 'object' }],
    outputs: [{ name: 'optimizedTime', type: 'object' }],
    configSchema: [
      { name: 'scope', label: 'Optimization Scope', type: 'select', options: [
        { label: 'Per Contact', value: 'contact' },
        { label: 'Per Segment', value: 'segment' },
        { label: 'Global Best Time', value: 'global' },
      ], defaultValue: 'global' },
      { name: 'timezone', label: 'Timezone', type: 'text', defaultValue: 'Asia/Dhaka' },
      { name: 'metric', label: 'Optimize For', type: 'select', options: [
        { label: 'Open Rate', value: 'opens' },
        { label: 'Click Rate', value: 'clicks' },
      ], defaultValue: 'opens' },
    ],
  },
];
