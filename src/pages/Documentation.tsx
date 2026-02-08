import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
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
  Play, Settings, Database, Key
} from 'lucide-react';

const gettingStartedGuides = [
  {
    id: 'quickstart',
    title: 'Quick Start Guide',
    description: 'Get up and running with BiztoriBD in 5 minutes',
    icon: Rocket,
    content: `
## Welcome to BiztoriBD

BiztoriBD is a powerful workflow automation platform designed for businesses in Bangladesh. Follow these steps to create your first automation:

### Step 1: Create Your Account
Sign up at biztori.com with your email or Google account.

### Step 2: Create Your First Workflow
1. Go to Dashboard → Click "New Workflow"
2. Give your workflow a descriptive name
3. You'll be taken to the workflow editor

### Step 3: Add Trigger Node
Every workflow starts with a trigger:
- **Manual Trigger**: Run workflow on demand
- **Schedule Trigger**: Run at specific times
- **Webhook Trigger**: Triggered by external events

### Step 4: Add Action Nodes
Drag action nodes from the palette to build your automation:
- Connect to 200+ integrations
- Transform data with code nodes
- Use AI for intelligent processing

### Step 5: Test & Activate
1. Click "Test" to run your workflow
2. Review the execution logs
3. Toggle "Active" to enable automatic runs
    `
  },
  {
    id: 'first-workflow',
    title: 'Building Your First Workflow',
    description: 'Step-by-step tutorial for creating automations',
    icon: Workflow,
    content: `
## Building Your First Workflow

Let's create a simple workflow that sends a notification when you receive an email.

### Workflow Overview
\`\`\`
Email Received → Extract Data → Send Slack Notification
\`\`\`

### Step 1: Create New Workflow
Navigate to Dashboard and click "New Workflow"

### Step 2: Add Email Trigger
1. Drag "Email Trigger" from the palette
2. Configure your email connection
3. Set filter criteria if needed

### Step 3: Add Data Transformation
1. Add a "Code" node
2. Extract sender and subject from email data
3. Format the notification message

### Step 4: Add Slack Action
1. Drag "Slack" node to canvas
2. Connect your Slack workspace
3. Choose channel and message format

### Step 5: Connect Nodes
Click and drag from output to input handles to connect nodes.

### Step 6: Test Your Workflow
Click the "Test" button and send a test email to verify everything works.
    `
  },
  {
    id: 'ai-assistant',
    title: 'Using AI Assistant',
    description: 'Let AI help you build workflows faster',
    icon: Bot,
    content: `
## AI-Powered Workflow Building

BiztoriBD includes an AI assistant to help you create workflows using natural language.

### How to Access
Click the AI Assistant button in the workflow editor sidebar.

### What You Can Do
- **Describe your automation**: "Send me a Slack message every morning with today's calendar events"
- **Ask for help**: "How do I connect to Google Sheets?"
- **Get suggestions**: "What's the best way to process incoming orders?"

### AI Credits
AI operations consume credits:
- Chat messages: 1 credit
- Workflow generation: 15 credits
- Data analysis: 5 credits

### Tips for Best Results
1. Be specific about what you want to automate
2. Mention the apps/services you want to connect
3. Describe the trigger condition clearly
4. Specify the desired outcome
    `
  }
];

const integrationDocs = [
  {
    category: 'Communication',
    integrations: ['Slack', 'Discord', 'Email', 'SMS', 'WhatsApp', 'Telegram']
  },
  {
    category: 'Productivity',
    integrations: ['Google Sheets', 'Notion', 'Airtable', 'Trello', 'Asana', 'Monday.com']
  },
  {
    category: 'Payments',
    integrations: ['bKash', 'Nagad', 'SSLCommerz', 'Stripe', 'PayStation']
  },
  {
    category: 'AI & Data',
    integrations: ['OpenAI', 'Google AI', 'Claude', 'Data Transform', 'HTTP Request']
  }
];

const faqs = [
  {
    question: 'What is a workflow execution?',
    answer: 'A workflow execution is counted each time your workflow runs from start to finish. For example, if you have a workflow that runs every hour, that would be 24 executions per day.'
  },
  {
    question: 'How do AI credits work?',
    answer: 'AI credits are consumed when you use AI-powered features like the AI Assistant, workflow generation, or AI nodes in your workflows. Different operations cost different amounts of credits.'
  },
  {
    question: 'Can I connect my own API keys?',
    answer: 'Yes! You can add your own credentials for any integration in the Credentials page. This allows you to use your own API limits and billing.'
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer: 'Your workflows will pause when you reach your execution limit. You can upgrade your plan or wait for the next billing cycle. We\'ll notify you before you reach your limits.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use enterprise-grade security including encryption at rest and in transit, secure credential storage, and regular security audits. Your workflow data is stored in secure data centers.'
  },
  {
    question: 'Can I export my workflows?',
    answer: 'Yes, you can export workflows as JSON files from the workflow editor. This allows you to backup your workflows or share them with others.'
  }
];

export default function Documentation() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(gettingStartedGuides[0]);

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
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
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
              { icon: Workflow, label: 'Workflows', href: '#guides' },
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
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {selectedGuide.content}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Guides Tab */}
            <TabsContent value="guides">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: Play, title: 'Triggers & Scheduling', description: 'Learn about different trigger types and how to schedule workflows' },
                  { icon: Code, title: 'Code Nodes', description: 'Write custom JavaScript to transform and process data' },
                  { icon: Database, title: 'Data Handling', description: 'Work with JSON, arrays, and complex data structures' },
                  { icon: Settings, title: 'Advanced Settings', description: 'Configure error handling, retries, and notifications' },
                  { icon: Users, title: 'Team Collaboration', description: 'Share workflows and manage team permissions' },
                  { icon: Shield, title: 'Security Best Practices', description: 'Keep your credentials and data secure' },
                ].map((guide) => (
                  <Card key={guide.title} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <guide.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>{guide.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="gap-2">
                        Read More <ExternalLink className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations">
              <div className="space-y-8">
                {integrationDocs.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-lg font-semibold mb-4">{category.category}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {category.integrations.map((integration) => (
                        <Card key={integration} className="hover:border-primary/50 transition-colors cursor-pointer">
                          <CardContent className="p-4 text-center">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
                              <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm font-medium">{integration}</p>
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
                    {faqs.map((faq, index) => (
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
          <p>© 2024 BiztoriBD. All rights reserved. | <Link to="/pricing" className="hover:text-foreground">Pricing</Link></p>
        </div>
      </footer>
    </div>
  );
}