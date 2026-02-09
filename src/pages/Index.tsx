import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Zap, ArrowRight, Play, Users, Shield, 
  Workflow, Bot, Database, Globe, CheckCircle2,
  LayoutDashboard, Settings, Code, FileText, Book
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

const features = [
  {
    icon: Workflow,
    title: 'Visual Workflow Builder',
    description: 'Drag-and-drop interface with 50+ integrations. Build complex automations without code.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Nodes',
    description: 'OpenAI, Claude, Gemini, and Hugging Face integrations for intelligent workflows.',
  },
  {
    icon: Database,
    title: 'Database Integrations',
    description: 'Connect to PostgreSQL, MongoDB, Redis, Supabase, and more.',
  },
  {
    icon: Globe,
    title: 'API & Webhooks',
    description: 'HTTP requests, webhooks, and real-time triggers for any use case.',
  },
  {
    icon: Code,
    title: 'Public API Access',
    description: 'Full REST API for external integrations. Execute workflows from any platform.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Encrypted credentials, role-based access, API keys with rate limiting.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share workflows, manage permissions, and work together in real-time.',
  },
];

const stats = [
  { value: '50+', label: 'Integrations' },
  { value: '10k+', label: 'Workflows Created' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

export default function Index() {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">BiztoriBD</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <a href="#api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {loading ? (
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
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="shadow-lg shadow-primary/25">
                  <Link to="/auth">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Made in Bangladesh 🇧🇩
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Automate Your Workflows
              <br />
              <span className="gradient-text">Without the Complexity</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              BiztoriBD is a powerful visual workflow automation platform. 
              Connect your apps, automate tasks, and build sophisticated AI-powered automations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Building for Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Automate
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From simple tasks to complex workflows, BiztoriBD has the tools 
              to make automation accessible to everyone.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Code className="h-4 w-4" />
              Developer API v2
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Full Platform Access via REST API
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              20+ endpoints to automate everything. Create workflows, execute them, 
              manage credentials, batch operations, webhooks — all programmatically.
            </p>
          </motion.div>

          {/* API Capabilities Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Workflow, title: 'Workflow CRUD', desc: 'Create, read, update, delete, clone workflows. Full lifecycle management via API.' },
              { icon: Play, title: 'Remote Execution', desc: 'Execute any workflow with custom input. Get real-time results, logs, and output data.' },
              { icon: Zap, title: 'Batch Operations', desc: 'Execute up to 10 workflows in a single API call. Parallel processing with error handling.' },
              { icon: Globe, title: 'Webhook Events', desc: 'Register webhooks for execution.completed, execution.failed events with HMAC verification.' },
              { icon: Database, title: 'Template Library', desc: 'Browse 50+ templates, search by category, and create workflows from templates via API.' },
              { icon: Shield, title: 'Credential Management', desc: 'Securely create and manage integration credentials for your workflows.' },
              { icon: Code, title: 'Execution Analytics', desc: 'Workflow stats, execution history, retry failed runs, and performance metrics.' },
              { icon: Users, title: 'Usage Monitoring', desc: 'Track API calls, response times, error rates, and credit balance in real-time.' },
              { icon: Bot, title: '8 SDK Languages', desc: 'Code examples in JavaScript, TypeScript, Python, PHP, Go, Ruby, Java, and cURL.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <item.icon className="h-5 w-5 text-primary mb-2" />
                <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Endpoint list */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Available Endpoints</h3>
              <div className="space-y-1.5 text-sm font-mono">
                {[
                  { method: 'GET', path: '/health', color: 'text-emerald-500' },
                  { method: 'GET', path: '/workflows', color: 'text-emerald-500' },
                  { method: 'POST', path: '/workflows', color: 'text-blue-500' },
                  { method: 'PUT', path: '/workflows/:id', color: 'text-amber-500' },
                  { method: 'DELETE', path: '/workflows/:id', color: 'text-rose-500' },
                  { method: 'POST', path: '/workflows/:id/execute', color: 'text-blue-500' },
                  { method: 'POST', path: '/workflows/:id/clone', color: 'text-blue-500' },
                  { method: 'GET', path: '/workflows/:id/stats', color: 'text-emerald-500' },
                  { method: 'GET', path: '/executions', color: 'text-emerald-500' },
                  { method: 'GET', path: '/executions/:id/logs', color: 'text-emerald-500' },
                  { method: 'POST', path: '/executions/:id/retry', color: 'text-blue-500' },
                  { method: 'GET', path: '/templates', color: 'text-emerald-500' },
                  { method: 'POST', path: '/credentials', color: 'text-blue-500' },
                  { method: 'POST', path: '/webhooks', color: 'text-blue-500' },
                  { method: 'POST', path: '/batch/execute', color: 'text-blue-500' },
                  { method: 'GET', path: '/usage/summary', color: 'text-emerald-500' },
                ].map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted/50">
                    <span className={`font-bold text-xs w-14 ${ep.color}`}>{ep.method}</span>
                    <span className="text-muted-foreground">{ep.path}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button asChild>
                  <Link to="/api-docs">
                    <FileText className="h-4 w-4 mr-2" />
                    Full API Docs
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/auth">
                    <Code className="h-4 w-4 mr-2" />
                    Get API Key
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Code example */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="bg-card rounded-xl border border-border p-5 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs text-muted-foreground">Execute Workflow</span>
                </div>
                <pre className="text-xs overflow-x-auto leading-relaxed">
                  <code className="text-muted-foreground">
{`curl -X POST \\
  "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api/workflows/:id/execute" \\
  -H "x-api-key: bz_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"input": {"email": "user@example.com"}}'

# Response
{
  "success": true,
  "executionId": "550e8400-...",
  "status": "completed",
  "output": { "emailSent": true }
}`}
                  </code>
                </pre>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs text-muted-foreground">Batch Execute</span>
                </div>
                <pre className="text-xs overflow-x-auto leading-relaxed">
                  <code className="text-muted-foreground">
{`curl -X POST \\
  ".../public-api/batch/execute" \\
  -H "x-api-key: bz_your_api_key" \\
  -d '{
    "operations": [
      {"action":"execute","workflow_id":"wf-1","input":{}},
      {"action":"execute","workflow_id":"wf-2","input":{}}
    ]
  }'`}
                  </code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 md:p-16 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Automate?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of teams who use BiztoriBD to automate their workflows 
              and save hours every week.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Free forever plan
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">BiztoriBD</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BiztoriBD. Made with ❤️ in Bangladesh
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
