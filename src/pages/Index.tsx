import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Zap, ArrowRight, Play, Users, Shield, 
  Workflow, Bot, Database, Globe, CheckCircle2,
  LayoutDashboard, Settings, Code, FileText, Book,
  Layers, Cpu, Mail, BarChart3, Lock, Rocket, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const features = [
  {
    icon: Workflow,
    title: 'Visual Workflow Engine',
    description: 'Build sophisticated automations with our drag-and-drop canvas. 375+ nodes across 20+ categories, zero code required.',
  },
  {
    icon: Bot,
    title: 'AI Agent Builder',
    description: 'Create intelligent agents with GPT-5, Gemini 3, Claude & LangChain. RAG, chat memory, tool use, and more.',
  },
  {
    icon: Database,
    title: 'Data & Database',
    description: 'Native connectors for PostgreSQL, MongoDB, Redis, Supabase, Firebase, Airtable, and 20+ databases.',
  },
  {
    icon: Globe,
    title: 'API & Webhooks',
    description: 'REST/GraphQL calls, real-time webhooks, cron schedules, version history, and event-driven triggers.',
  },
  {
    icon: Mail,
    title: 'Email Marketing Suite',
    description: 'Full email platform: campaigns, automation, A/B testing, SMTP, drag-and-drop builder, analytics — all built in.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Encrypted credentials, RBAC, API keys with rate limiting, audit logging, and retry-on-fail error handling.',
  },
  {
    icon: Layers,
    title: 'Bangladesh-First Integrations',
    description: 'bKash, Nagad, Pathao, eCourier, Steadfast, RedX, Daraz, BD NID verification — 25+ local nodes.',
  },
  {
    icon: Code,
    title: 'Developer API',
    description: 'Full REST API with 20+ endpoints. Batch execution, webhooks, real-time logs, 8 SDK languages.',
  },
];

const stats = [
  { value: '375+', label: 'Automation Nodes' },
  { value: '20+', label: 'Node Categories' },
  { value: '25+', label: 'BD Integrations' },
  { value: '24/7', label: 'Real-time Execution' },
];

const useCases = [
  { icon: Cpu, title: 'E-Commerce & Daraz', desc: 'Order sync, inventory management, courier dispatch with Pathao, eCourier, Steadfast, and RedX.' },
  { icon: BarChart3, title: 'Sales & CRM', desc: 'Lead scoring, pipeline automation, email sequences, deal tracking, and bKash payment alerts.' },
  { icon: Mail, title: 'Marketing', desc: 'Multi-channel campaigns, A/B testing, segmentation, SMS marketing, and social scheduling.' },
  { icon: Lock, title: 'Fintech & Payments', desc: 'bKash, Nagad, SSLCommerz integration. Payment verification, reconciliation, and alerts.' },
  { icon: Rocket, title: 'Startups & SMEs', desc: 'Ship faster with pre-built templates. BD NID verification, TIN lookup, and local APIs.' },
  { icon: Users, title: 'Digital Agencies', desc: 'Client workflow management, team collaboration, shared credentials, and white-label reports.' },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

export default function Index() {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">BiztoriBD</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-sm px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              Features
            </a>
            <a href="#use-cases" className="text-sm px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              Use Cases
            </a>
            <Link to="/pricing" className="text-sm px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              Pricing
            </Link>
            <Link to="/docs" className="text-sm px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              Docs
            </Link>
            <a href="#api" className="text-sm px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              API
            </a>
          </nav>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? (
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                    <Link to="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex shadow-lg shadow-primary/25">
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile hamburger menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary-foreground" />
                    </div>
                    BiztoriBD
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col px-4 pb-6">
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Features
                  </a>
                  <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                    <Rocket className="h-4 w-4 text-muted-foreground" />
                    Use Cases
                  </a>
                  <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Pricing
                  </Link>
                  <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Docs
                  </Link>
                  <a href="#api" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    API
                  </a>
                  
                  <div className="h-px bg-border my-3" />
                  
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        Dashboard
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          Admin
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2 px-3">
                      <Button asChild className="w-full">
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                          Get Started Free
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 py-16 md:py-40 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
            >
               <Zap className="h-3.5 w-3.5" />
               Bangladesh's #1 Automation Platform 🇧🇩
            </motion.div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
              Automate Everything.
              <br />
              <span className="gradient-text">Build Anything.</span>
            </h1>
            
             <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
               The all-in-one automation platform built for Bangladesh. 
               375+ nodes, AI agents, bKash/Nagad integration, email marketing, and a powerful API — 
               no coding required.
             </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                <Link to="/auth">
                  Start Building Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card needed
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Setup in 2 minutes
              </span>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-3xl md:text-4xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-28 bg-muted/30 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Layers className="h-3.5 w-3.5" />
              Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Everything You Need to Scale
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From simple task automation to enterprise-grade AI agents — 
              one platform, unlimited possibilities.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Rocket className="h-3.5 w-3.5" />
              Built for Every Team
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Automate Any Workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're a solo founder or an enterprise team, BiztoriBD adapts to your needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((uc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <uc.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground">{uc.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Code className="h-3.5 w-3.5" />
              Developer API v2
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Programmatic Access to Everything
            </h2>
             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
               20+ RESTful endpoints. Execute workflows, manage credentials, real-time streaming logs, 
               batch operations, and webhooks — all from your code.
             </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
            {/* Endpoint list */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Endpoints</h3>
              <div className="space-y-1.5 text-sm font-mono">
                {[
                  { method: 'GET', path: '/workflows', color: 'text-success' },
                  { method: 'POST', path: '/workflows', color: 'text-primary' },
                  { method: 'POST', path: '/workflows/:id/execute', color: 'text-primary' },
                  { method: 'POST', path: '/batch/execute', color: 'text-primary' },
                  { method: 'GET', path: '/executions', color: 'text-success' },
                  { method: 'GET', path: '/executions/:id/logs', color: 'text-success' },
                  { method: 'POST', path: '/executions/:id/retry', color: 'text-primary' },
                  { method: 'GET', path: '/templates', color: 'text-success' },
                  { method: 'POST', path: '/webhooks', color: 'text-primary' },
                  { method: 'GET', path: '/usage/summary', color: 'text-success' },
                ].map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                    <span className={`font-bold text-xs w-12 ${ep.color}`}>{ep.method}</span>
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
            >
              <div className="bg-card rounded-xl border border-border p-5 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                  <span className="ml-2 text-xs text-muted-foreground font-medium">Execute Workflow</span>
                </div>
                <pre className="text-xs overflow-x-auto leading-relaxed">
                  <code className="text-muted-foreground">
{`curl -X POST \\
  "https://api.biztoribd.com/v1/workflows/:id/execute" \\
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
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-10 md:p-20 text-center border border-primary/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
                Ready to Automate Your Business?
              </h2>
               <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                 Join thousands of businesses in Bangladesh automating with BiztoriBD. 
                 Start free, scale without limits.
               </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="h-12 px-8 text-base shadow-xl shadow-primary/20">
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  No credit card required
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">BiztoriBD</span>
            </div>
            
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
              <Link to="/api-docs" className="hover:text-foreground transition-colors">API</Link>
            </nav>
            
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BiztoriBD. Made with ❤️ in Bangladesh 🇧🇩
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
