import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Zap, Search, BookOpen, Rocket, Code, 
  Workflow, Bot, CreditCard, Users, Shield,
  HelpCircle, ExternalLink, ChevronRight,
  Play, Settings, Database, Key, LayoutDashboard,
  Clock, Webhook, Mail, MessageSquare, Globe,
  FileJson, GitBranch, AlertTriangle, CheckCircle,
  Sparkles, Coins, Activity
} from 'lucide-react';

// ==================== GETTING STARTED GUIDES ====================
const gettingStartedGuides = [
  {
    id: 'quickstart',
    title: 'Quick Start Guide',
    description: 'Get up and running with BiztoriBD in 5 minutes',
    icon: Rocket,
    sections: [
      {
        title: 'Welcome to BiztoriBD',
        content: `BiztoriBD is a powerful workflow automation platform designed for businesses in Bangladesh. Automate repetitive tasks, connect your favorite apps, and save hours every week.`
      },
      {
        title: 'Step 1: Create Your Account',
        content: `Sign up at BiztoriBD with your email address:
• Click "Get Started" on the homepage
• Enter your email and create a password
• Verify your email address
• Complete your profile setup`
      },
      {
        title: 'Step 2: Create Your First Workflow',
        content: `Navigate to your Dashboard and create a new workflow:
• Click the "New Workflow" button
• Give your workflow a descriptive name (e.g., "Daily Email Summary")
• Add an optional description
• Click "Create" to open the workflow editor`
      },
      {
        title: 'Step 3: Add a Trigger Node',
        content: `Every workflow starts with a trigger that determines when it runs:
• Manual Trigger: Run workflow on-demand with a button click
• Schedule Trigger: Run at specific times (hourly, daily, weekly)
• Webhook Trigger: Triggered by external events via HTTP requests
• Email Trigger: Triggered when you receive specific emails`
      },
      {
        title: 'Step 4: Add Action Nodes',
        content: `Drag action nodes from the left palette to build your automation:
• Connect to 200+ integrations (Slack, Google Sheets, etc.)
• Transform data with Code nodes (JavaScript)
• Use AI nodes for intelligent processing
• Add conditions with IF/Switch nodes`
      },
      {
        title: 'Step 5: Connect the Nodes',
        content: `Link your nodes together to create the workflow:
• Click and drag from an output handle (right side of node)
• Drop on an input handle (left side of target node)
• Data flows from left to right through your workflow
• You can connect one output to multiple inputs`
      },
      {
        title: 'Step 6: Test & Activate',
        content: `Before going live, test your workflow:
• Click "Test" to run your workflow with sample data
• Review the execution logs for each node
• Fix any errors shown in red
• Toggle "Active" to enable automatic runs
• Your workflow is now live!`
      }
    ]
  },
  {
    id: 'first-workflow',
    title: 'Building Your First Workflow',
    description: 'Step-by-step tutorial for creating automations',
    icon: Workflow,
    sections: [
      {
        title: 'Example: Email to Slack Notification',
        content: `Let's create a practical workflow that sends a Slack notification when you receive an important email. This demonstrates the core concepts of BiztoriBD.`
      },
      {
        title: 'Workflow Overview',
        content: `Our workflow will follow this path:
Email Received → Filter Important → Extract Data → Send to Slack

This pattern is common: Trigger → Process → Action`
      },
      {
        title: 'Step 1: Add Email Trigger',
        content: `Start by adding an Email Trigger:
• Drag "Email Trigger" from the Triggers category
• Click the node to configure it
• Connect your email account (Gmail, Outlook, etc.)
• Set filter: Subject contains "urgent" or From contains "@important.com"
• This node will check for matching emails every 5 minutes`
      },
      {
        title: 'Step 2: Add Code Node for Data Extraction',
        content: `Add a Code node to process the email data:
• Drag "Code" node from Actions category
• Connect it to the Email Trigger
• Click to edit and add this code:

const email = $input.item.json;
return {
  sender: email.from,
  subject: email.subject,
  preview: email.body.substring(0, 200),
  receivedAt: new Date().toISOString()
};

This extracts the key information we need for Slack.`
      },
      {
        title: 'Step 3: Add Slack Node',
        content: `Send the notification to Slack:
• Drag "Slack" node from Communication category
• Connect your Slack workspace
• Choose the channel (e.g., #notifications)
• Configure the message:

🚨 *New Important Email*
*From:* {{ sender }}
*Subject:* {{ subject }}
*Preview:* {{ preview }}
*Received:* {{ receivedAt }}`
      },
      {
        title: 'Step 4: Test Your Workflow',
        content: `Test before going live:
• Click the "Test" button in the top toolbar
• Send yourself a test email matching your filter
• Watch the execution flow through each node
• Check Slack for the notification
• Review any errors in the execution panel`
      },
      {
        title: 'Step 5: Activate & Monitor',
        content: `Enable your workflow:
• Toggle the "Active" switch ON
• Your workflow now runs automatically
• View execution history in the Executions page
• Set up error notifications if needed
• Monitor usage in the Billing page`
      }
    ]
  },
  {
    id: 'ai-assistant',
    title: 'Using AI Assistant',
    description: 'Let AI help you build workflows faster',
    icon: Bot,
    sections: [
      {
        title: 'AI-Powered Workflow Building',
        content: `BiztoriBD includes an AI assistant that can help you create workflows using natural language. Simply describe what you want to automate, and the AI will generate the workflow for you.`
      },
      {
        title: 'How to Access AI Assistant',
        content: `Open the AI Assistant in the workflow editor:
• Click the sparkle/AI icon in the bottom-left corner
• Or press Ctrl+K (Cmd+K on Mac) to open quickly
• The AI chat panel will slide open
• Type your request in natural language`
      },
      {
        title: 'What You Can Ask',
        content: `The AI can help with many tasks:
• "Create a workflow that sends me a Slack message every morning with today's weather"
• "How do I connect to Google Sheets?"
• "What's the best way to handle errors in my workflow?"
• "Generate a workflow to backup my database daily"
• "Explain how the HTTP Request node works"`
      },
      {
        title: 'AI Credit Costs',
        content: `AI operations consume credits from your balance:
• Chat messages: 1 credit each
• Workflow generation: 15 credits
• Data analysis: 5 credits
• Code debugging: 5 credits

Purchase credits in the Billing page to continue using AI features.`
      },
      {
        title: 'Tips for Best Results',
        content: `Get better AI responses with these tips:
• Be specific about what you want to automate
• Mention the apps/services you want to connect
• Describe the trigger condition clearly (when should it run?)
• Specify the desired outcome (what should happen?)
• Include any special requirements or edge cases`
      },
      {
        title: 'Example Prompts',
        content: `Try these prompts to get started:

"When someone fills out my Typeform, add them to my Mailchimp list and send a welcome email"

"Every Friday at 5 PM, send a weekly summary to my Slack channel with all new customers from HubSpot"

"Monitor my website and alert me on Telegram if it goes down"`
      }
    ]
  }
];

// ==================== DETAILED GUIDES ====================
const detailedGuides = [
  {
    id: 'triggers',
    icon: Play,
    title: 'Triggers & Scheduling',
    description: 'Learn about different trigger types and how to schedule workflows',
    sections: [
      {
        title: 'Manual Trigger',
        content: `The simplest trigger - runs when you click a button:
• Use for: On-demand tasks, testing, one-time operations
• How to use: Click "Run" in the editor or Dashboard
• Parameters: Can accept input data when triggered manually`
      },
      {
        title: 'Schedule Trigger',
        content: `Run workflows on a schedule:
• Interval: Every X minutes/hours
• Cron: Complex schedules (e.g., "weekdays at 9 AM")
• Timezone: Set your local timezone for accurate scheduling

Example cron expressions:
• 0 9 * * 1-5 = Weekdays at 9 AM
• 0 */2 * * * = Every 2 hours
• 0 0 1 * * = First day of each month`
      },
      {
        title: 'Webhook Trigger',
        content: `Receive data from external services:
• Unique URL: Each workflow gets a unique webhook URL
• Methods: Supports GET, POST, PUT, DELETE
• Authentication: Optional API key or header validation
• Response: Can send custom responses back

Use cases: Stripe payments, GitHub events, form submissions`
      },
      {
        title: 'Email Trigger',
        content: `React to incoming emails:
• Connect: Link your Gmail, Outlook, or IMAP account
• Filters: Match by sender, subject, content
• Attachments: Access file attachments in workflow
• Polling: Checks every 5 minutes (configurable)`
      }
    ]
  },
  {
    id: 'code-nodes',
    icon: Code,
    title: 'Code Nodes',
    description: 'Write custom JavaScript to transform and process data',
    sections: [
      {
        title: 'JavaScript in Workflows',
        content: `Code nodes let you write custom JavaScript:
• Full JavaScript ES2020+ support
• Access input data with $input
• Return transformed data
• Use npm packages (lodash, moment, etc.)`
      },
      {
        title: 'Accessing Input Data',
        content: `Get data from previous nodes:

// Single item
const data = $input.item.json;
console.log(data.name);

// All items from previous node
const allItems = $input.all();
allItems.forEach(item => {
  console.log(item.json);
});

// Specific node's output
const webhookData = $node['Webhook'].json;`
      },
      {
        title: 'Returning Data',
        content: `Return data for the next node:

// Return single object
return {
  name: data.firstName + ' ' + data.lastName,
  email: data.email.toLowerCase(),
  createdAt: new Date().toISOString()
};

// Return multiple items
return items.map(item => ({
  ...item,
  processed: true
}));`
      },
      {
        title: 'Error Handling',
        content: `Handle errors gracefully:

try {
  const result = riskyOperation();
  return { success: true, data: result };
} catch (error) {
  // Log error for debugging
  console.error('Operation failed:', error.message);
  
  // Return error info to next node
  return { 
    success: false, 
    error: error.message 
  };
}`
      },
      {
        title: 'Common Patterns',
        content: `Useful code snippets:

// Parse JSON string
const parsed = JSON.parse(data.jsonString);

// Filter array
const active = users.filter(u => u.status === 'active');

// Group by property
const byStatus = users.reduce((acc, u) => {
  acc[u.status] = acc[u.status] || [];
  acc[u.status].push(u);
  return acc;
}, {});

// Date formatting
const formatted = new Date(date).toLocaleDateString('en-US');`
      }
    ]
  },
  {
    id: 'data-handling',
    icon: Database,
    title: 'Data Handling',
    description: 'Work with JSON, arrays, and complex data structures',
    sections: [
      {
        title: 'Understanding Data Flow',
        content: `Data flows through your workflow as JSON:
• Each node outputs JSON data
• Next node receives it as input
• Arrays are processed item-by-item by default
• Use expressions to access nested properties`
      },
      {
        title: 'Expression Syntax',
        content: `Access data with expressions ({{ }}):

{{ $json.name }}              // Current item's name
{{ $json.user.email }}        // Nested property
{{ $json.items[0].id }}       // Array index
{{ $json["special-key"] }}    // Special characters

{{ $node['HTTP Request'].json.data }}  // Other node's output
{{ $now }}                    // Current timestamp
{{ $today }}                  // Today's date`
      },
      {
        title: 'Working with Arrays',
        content: `Process arrays efficiently:

Split into items: Use "Split In Batches" node to process one at a time

Merge items: Use "Merge" node to combine multiple arrays

Aggregate: Use Code node to reduce:
const total = items.reduce((sum, i) => sum + i.amount, 0);

Filter: Use "IF" node or Code node filter()`
      },
      {
        title: 'Data Transformation',
        content: `Common transformations:

// Rename properties
{
  customerName: data.name,
  customerEmail: data.email
}

// Flatten nested object
{
  ...data.user,
  ...data.preferences
}

// Convert types
{
  amount: parseFloat(data.amount),
  quantity: parseInt(data.qty),
  active: data.status === 'active'
}`
      },
      {
        title: 'Binary Data (Files)',
        content: `Handle files and binary data:
• Files are stored as base64 in workflow
• Use HTTP Request to download files
• Write to storage with S3/Google Cloud nodes
• Convert with Code node if needed

const base64 = Buffer.from(binary).toString('base64');
const buffer = Buffer.from(base64, 'base64');`
      }
    ]
  },
  {
    id: 'error-handling',
    icon: AlertTriangle,
    title: 'Error Handling',
    description: 'Configure error handling, retries, and notifications',
    sections: [
      {
        title: 'Error Workflow',
        content: `Handle errors at the workflow level:
• Settings → Error Workflow
• Select a workflow to run on errors
• Receives error details as input
• Use to send alerts or log errors`
      },
      {
        title: 'Node-Level Error Handling',
        content: `Configure per-node error behavior:
• Continue on Fail: Skip errors and continue
• Retry on Fail: Attempt again (configurable count)
• Stop Workflow: Halt execution on error

Settings are in each node's Settings tab.`
      },
      {
        title: 'Retry Configuration',
        content: `Configure automatic retries:
• Max Retries: Number of attempts (1-10)
• Wait Between: Delay between retries
• Exponential Backoff: Increase delay each retry

Good for: API rate limits, temporary failures, network issues`
      },
      {
        title: 'Error Notifications',
        content: `Get notified when workflows fail:

Create an error-handling workflow:
1. Use "Error Trigger" node
2. Add notification node (Email, Slack, etc.)
3. Include: workflow name, error message, timestamp
4. Set as Error Workflow in your main workflows`
      },
      {
        title: 'Debugging Tips',
        content: `Debug failing workflows:
• Check execution logs for detailed errors
• Add console.log() in Code nodes
• Use "IF" nodes to test data conditions
• Test with simplified data first
• Check API credentials are valid`
      }
    ]
  },
  {
    id: 'team-collaboration',
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share workflows and manage team permissions',
    sections: [
      {
        title: 'Workspaces',
        content: `Organize your team with workspaces:
• Create separate workspaces for projects/teams
• Each workspace has its own workflows
• Shared credentials within workspace
• Separate billing per workspace`
      },
      {
        title: 'Team Roles',
        content: `Role-based access control:

Owner: Full access, billing, delete workspace
Admin: Manage members, all workflows
Editor: Create/edit workflows, execute
Viewer: View workflows, see executions

Assign roles when inviting team members.`
      },
      {
        title: 'Sharing Workflows',
        content: `Share workflows with your team:
• Click Share button in workflow editor
• Add team members by email
• Set permission level (View/Edit)
• Shared workflows appear in their dashboard`
      },
      {
        title: 'Export/Import',
        content: `Transfer workflows between accounts:
• Export: Download workflow as JSON
• Import: Upload JSON to create workflow
• Includes: All nodes, connections, settings
• Excludes: Credentials (re-add after import)`
      }
    ]
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security Best Practices',
    description: 'Keep your credentials and data secure',
    sections: [
      {
        title: 'Credential Management',
        content: `Store credentials securely:
• Never hardcode API keys in Code nodes
• Use the Credentials page to store keys
• Credentials are encrypted at rest
• Reference by name in nodes`
      },
      {
        title: 'Webhook Security',
        content: `Secure your webhook endpoints:
• Enable authentication on webhooks
• Use header-based API keys
• Validate request signatures
• Whitelist IP addresses if possible`
      },
      {
        title: 'Data Privacy',
        content: `Protect sensitive data:
• Avoid logging sensitive information
• Use environment variables for secrets
• Delete test executions with real data
• Limit data retention period`
      },
      {
        title: 'Access Control',
        content: `Control who can access what:
• Use workspaces to separate concerns
• Assign minimum required permissions
• Review team access regularly
• Remove inactive members promptly`
      },
      {
        title: 'Compliance',
        content: `Meet compliance requirements:
• Data stored in secure Bangladeshi/Asian servers
• Regular security audits
• Encrypted connections (TLS 1.3)
• GDPR-compliant data handling`
      }
    ]
  }
];

// ==================== INTEGRATIONS ====================
const integrationDocs = [
  {
    category: 'Communication',
    icon: MessageSquare,
    integrations: [
      { name: 'Slack', description: 'Send messages, create channels, manage users' },
      { name: 'Discord', description: 'Post to channels, send DMs, manage servers' },
      { name: 'Email', description: 'Send and receive emails via SMTP/IMAP' },
      { name: 'SMS', description: 'Send text messages via Twilio or local providers' },
      { name: 'WhatsApp', description: 'Business messaging via WhatsApp API' },
      { name: 'Telegram', description: 'Send messages, create bots' },
    ]
  },
  {
    category: 'Productivity',
    icon: Workflow,
    integrations: [
      { name: 'Google Sheets', description: 'Read/write spreadsheet data' },
      { name: 'Notion', description: 'Create pages, update databases' },
      { name: 'Airtable', description: 'Manage records in Airtable bases' },
      { name: 'Trello', description: 'Create cards, move between lists' },
      { name: 'Asana', description: 'Manage tasks and projects' },
      { name: 'Monday.com', description: 'Update boards and items' },
    ]
  },
  {
    category: 'Payments (Bangladesh)',
    icon: CreditCard,
    integrations: [
      { name: 'bKash', description: 'Accept bKash mobile payments' },
      { name: 'Nagad', description: 'Process Nagad transactions' },
      { name: 'SSLCommerz', description: 'Complete payment gateway' },
      { name: 'Stripe', description: 'International payments' },
      { name: 'PayStation', description: 'Local payment aggregator' },
      { name: 'Rocket', description: 'Dutch-Bangla mobile banking' },
    ]
  },
  {
    category: 'AI & Data',
    icon: Sparkles,
    integrations: [
      { name: 'OpenAI', description: 'GPT-4, DALL-E, embeddings' },
      { name: 'Google AI', description: 'Gemini, Vision AI' },
      { name: 'Claude', description: 'Anthropic Claude models' },
      { name: 'Data Transform', description: 'Parse, filter, aggregate data' },
      { name: 'HTTP Request', description: 'Call any REST API' },
      { name: 'GraphQL', description: 'Query GraphQL endpoints' },
    ]
  },
  {
    category: 'Development',
    icon: Code,
    integrations: [
      { name: 'GitHub', description: 'Repos, issues, PRs, Actions' },
      { name: 'GitLab', description: 'Manage GitLab projects' },
      { name: 'Jira', description: 'Create and update issues' },
      { name: 'Linear', description: 'Issue tracking integration' },
      { name: 'Sentry', description: 'Error monitoring alerts' },
      { name: 'Vercel', description: 'Deployment automation' },
    ]
  },
  {
    category: 'Databases',
    icon: Database,
    integrations: [
      { name: 'PostgreSQL', description: 'Query and update Postgres' },
      { name: 'MySQL', description: 'MySQL database operations' },
      { name: 'MongoDB', description: 'NoSQL document operations' },
      { name: 'Redis', description: 'Cache and pub/sub' },
      { name: 'Firebase', description: 'Firestore and Realtime DB' },
      { name: 'Supabase', description: 'Full Postgres + Auth' },
    ]
  }
];

// ==================== FAQ ====================
const faqs = [
  {
    question: 'What is a workflow execution?',
    answer: 'A workflow execution is counted each time your workflow runs from start to finish. For example, if you have a workflow that runs every hour, that would be 24 executions per day. Each node in your workflow is part of a single execution.'
  },
  {
    question: 'How do AI credits work?',
    answer: 'AI credits are consumed when you use AI-powered features like the AI Assistant, workflow generation, or AI nodes in your workflows. Chat messages cost 1 credit, workflow generation costs 15 credits, and data analysis costs 5 credits. Credits never expire and can be purchased in any plan.'
  },
  {
    question: 'Can I connect my own API keys?',
    answer: 'Yes! You can add your own credentials for any integration in the Credentials page. This allows you to use your own API limits and billing. Simply go to Credentials, click "Add Credential", select the service, and enter your API key or OAuth credentials.'
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer: 'Your workflows will pause when you reach your monthly execution limit. You can upgrade your plan, purchase additional executions, or wait for the next billing cycle. We\'ll notify you by email when you reach 80% and 100% of your limits.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use enterprise-grade security including AES-256 encryption at rest and TLS 1.3 in transit, secure credential storage in isolated vaults, regular security audits, and servers located in secure Asian data centers. We are GDPR compliant and never sell your data.'
  },
  {
    question: 'Can I export my workflows?',
    answer: 'Yes, you can export workflows as JSON files from the workflow editor menu. This allows you to backup your workflows, share them with others, or transfer them between accounts. Note that credentials are not included in exports for security reasons.'
  },
  {
    question: 'How do webhooks work?',
    answer: 'When you add a Webhook trigger to your workflow, we generate a unique URL for that workflow. Any HTTP request to that URL will trigger your workflow. You can configure the HTTP method (GET, POST, etc.), add authentication, and access all request data in your workflow.'
  },
  {
    question: 'Can I schedule workflows to run at specific times?',
    answer: 'Yes! Use the Schedule trigger to run workflows on a schedule. You can set simple intervals (every hour, every day) or use cron expressions for complex schedules like "every weekday at 9 AM" or "first Monday of each month".'
  },
  {
    question: 'What happens if a workflow fails?',
    answer: 'When a workflow fails, the execution is logged with error details. You can set up an Error Workflow to handle failures (e.g., send yourself a notification). Individual nodes can be configured to retry on failure or continue despite errors.'
  },
  {
    question: 'Can my team collaborate on workflows?',
    answer: 'Yes! Create a workspace and invite team members with different roles (Owner, Admin, Editor, Viewer). You can also share individual workflows with specific people. All team members share credentials within the workspace.'
  }
];

export default function Documentation() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(gettingStartedGuides[0]);
  const [selectedDetailGuide, setSelectedDetailGuide] = useState(detailedGuides[0]);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">BiztoriBD</span>
            <Badge variant="secondary">Docs</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/pricing">Pricing</Link>
            </Button>
            {authLoading ? (
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" asChild>
                    <Link to="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 border-b border-border">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <BookOpen className="h-12 w-12 inline-block mr-3 text-primary" />
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Everything you need to master workflow automation with BiztoriBD
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Rocket, label: 'Quick Start', href: '#getting-started' },
              { icon: Workflow, label: 'Guides', href: '#guides' },
              { icon: Key, label: 'Integrations', href: '#integrations' },
              { icon: HelpCircle, label: 'FAQ', href: '#faq' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 p-4 rounded-lg bg-background border border-border hover:border-primary transition-colors"
              >
                <link.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{link.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4" id="getting-started">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="getting-started" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="guides" id="guides">Guides</TabsTrigger>
              <TabsTrigger value="integrations" id="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="faq" id="faq">FAQ</TabsTrigger>
            </TabsList>

            {/* Getting Started Tab */}
            <TabsContent value="getting-started">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Guide List */}
                <div className="space-y-3">
                  {gettingStartedGuides.map((guide) => (
                    <Card
                      key={guide.id}
                      className={`cursor-pointer transition-all ${
                        selectedGuide.id === guide.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedGuide(guide)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <guide.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{guide.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {guide.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {/* Guide Content */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <selectedGuide.icon className="h-6 w-6 text-primary" />
                        <CardTitle>{selectedGuide.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible defaultValue="section-0" className="w-full">
                        {selectedGuide.sections.map((section, index) => (
                          <AccordionItem key={index} value={`section-${index}`}>
                            <AccordionTrigger className="text-left font-semibold">
                              {section.title}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground bg-transparent p-0 m-0">
                                  {section.content}
                                </pre>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Guides Tab */}
            <TabsContent value="guides">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Guide List */}
                <div className="space-y-3">
                  {detailedGuides.map((guide) => (
                    <Card
                      key={guide.id}
                      className={`cursor-pointer transition-all ${
                        selectedDetailGuide.id === guide.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedDetailGuide(guide)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <guide.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{guide.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {guide.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {/* Guide Content */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <selectedDetailGuide.icon className="h-6 w-6 text-primary" />
                        <CardTitle>{selectedDetailGuide.title}</CardTitle>
                      </div>
                      <CardDescription>{selectedDetailGuide.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible defaultValue="section-0" className="w-full">
                        {selectedDetailGuide.sections.map((section, index) => (
                          <AccordionItem key={index} value={`section-${index}`}>
                            <AccordionTrigger className="text-left font-semibold">
                              {section.title}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg overflow-x-auto">
                                  {section.content}
                                </pre>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations">
              <div className="space-y-8">
                {integrationDocs.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">{category.category}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {category.integrations.map((integration) => (
                        <Card key={integration.name} className="hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                              <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-center mb-1">{integration.name}</p>
                            <p className="text-xs text-muted-foreground text-center">{integration.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Find answers to common questions about BiztoriBD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  {filteredFaqs.length === 0 && searchQuery && (
                    <p className="text-center text-muted-foreground py-8">
                      No matching questions found for "{searchQuery}"
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Help CTA */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center max-w-2xl">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline">
              Contact Support
            </Button>
            <Button>
              Join Community
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 BiztoriBD. All rights reserved. | <Link to="/pricing" className="hover:text-foreground">Pricing</Link> | <Link to="/docs" className="hover:text-foreground">Documentation</Link></p>
        </div>
      </footer>
    </div>
  );
}
