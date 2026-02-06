import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Zap, ArrowRight, Play, Users, Shield, 
  Workflow, Bot, Database, Globe, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';

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
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Encrypted credentials, role-based access, and audit logs.',
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
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FlowForge</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
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
              FlowForge is a powerful visual workflow automation platform. 
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
              From simple tasks to complex workflows, FlowForge has the tools 
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
              Join thousands of teams who use FlowForge to automate their workflows 
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
              <span className="font-bold text-foreground">FlowForge</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FlowForge. Made with ❤️ in Bangladesh
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
