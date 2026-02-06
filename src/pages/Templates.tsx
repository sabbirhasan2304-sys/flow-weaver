import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Zap, Search, ArrowLeft, Star, Download, Eye,
  Bot, Mail, ShoppingCart, Database, BarChart,
  MessageSquare, Calendar, FileText, Cloud, Coins,
  Bell, Users, Code, Shield, TrendingUp
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  nodes: number;
  uses: number;
  featured: boolean;
  tags: string[];
}

const templates: Template[] = [
  {
    id: '1',
    name: 'AI Content Generator',
    description: 'Generate blog posts, social media content, and marketing copy using AI',
    category: 'AI & Automation',
    icon: <Bot className="h-6 w-6" />,
    nodes: 8,
    uses: 15420,
    featured: true,
    tags: ['OpenAI', 'Content', 'Marketing'],
  },
  {
    id: '2',
    name: 'Lead Scoring Pipeline',
    description: 'Automatically score and qualify leads from multiple sources',
    category: 'Sales & CRM',
    icon: <TrendingUp className="h-6 w-6" />,
    nodes: 12,
    uses: 8930,
    featured: true,
    tags: ['HubSpot', 'Salesforce', 'Leads'],
  },
  {
    id: '3',
    name: 'Daily Report Automation',
    description: 'Compile data from multiple sources into a daily email report',
    category: 'Reporting',
    icon: <BarChart className="h-6 w-6" />,
    nodes: 10,
    uses: 12340,
    featured: true,
    tags: ['Email', 'Reports', 'Analytics'],
  },
  {
    id: '4',
    name: 'E-commerce Order Sync',
    description: 'Sync orders between Shopify, WooCommerce, and your database',
    category: 'E-Commerce',
    icon: <ShoppingCart className="h-6 w-6" />,
    nodes: 15,
    uses: 9870,
    featured: false,
    tags: ['Shopify', 'WooCommerce', 'Orders'],
  },
  {
    id: '5',
    name: 'Slack Notifications Hub',
    description: 'Centralize notifications from various services to Slack channels',
    category: 'Communication',
    icon: <MessageSquare className="h-6 w-6" />,
    nodes: 6,
    uses: 21500,
    featured: true,
    tags: ['Slack', 'Notifications', 'Alerts'],
  },
  {
    id: '6',
    name: 'Calendar Event Processor',
    description: 'Process Google Calendar events and trigger automated actions',
    category: 'Productivity',
    icon: <Calendar className="h-6 w-6" />,
    nodes: 7,
    uses: 5680,
    featured: false,
    tags: ['Google Calendar', 'Events', 'Reminders'],
  },
  {
    id: '7',
    name: 'Document Processing Pipeline',
    description: 'Extract data from PDFs and documents using AI',
    category: 'AI & Automation',
    icon: <FileText className="h-6 w-6" />,
    nodes: 9,
    uses: 7230,
    featured: false,
    tags: ['PDF', 'OCR', 'AI'],
  },
  {
    id: '8',
    name: 'Cloud Backup Automation',
    description: 'Automatically backup files to S3, Google Drive, and Dropbox',
    category: 'Storage',
    icon: <Cloud className="h-6 w-6" />,
    nodes: 11,
    uses: 4560,
    featured: false,
    tags: ['S3', 'Google Drive', 'Backup'],
  },
  {
    id: '9',
    name: 'Crypto Price Alert',
    description: 'Monitor cryptocurrency prices and send alerts on threshold changes',
    category: 'Blockchain',
    icon: <Coins className="h-6 w-6" />,
    nodes: 5,
    uses: 18900,
    featured: true,
    tags: ['Crypto', 'Alerts', 'Trading'],
  },
  {
    id: '10',
    name: 'Customer Onboarding Flow',
    description: 'Automate new customer onboarding with emails and task creation',
    category: 'Sales & CRM',
    icon: <Users className="h-6 w-6" />,
    nodes: 14,
    uses: 6780,
    featured: false,
    tags: ['Onboarding', 'Email', 'CRM'],
  },
  {
    id: '11',
    name: 'GitHub PR Notifier',
    description: 'Get Slack notifications for new PRs, reviews, and merges',
    category: 'Development',
    icon: <Code className="h-6 w-6" />,
    nodes: 4,
    uses: 11200,
    featured: false,
    tags: ['GitHub', 'Slack', 'DevOps'],
  },
  {
    id: '12',
    name: 'Security Alert Monitor',
    description: 'Monitor security logs and send instant alerts on threats',
    category: 'Security',
    icon: <Shield className="h-6 w-6" />,
    nodes: 8,
    uses: 3450,
    featured: false,
    tags: ['Security', 'Monitoring', 'Alerts'],
  },
];

const categories = [
  'All',
  'AI & Automation',
  'Sales & CRM',
  'E-Commerce',
  'Communication',
  'Productivity',
  'Reporting',
  'Development',
  'Blockchain',
  'Security',
];

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = templates.filter(t => t.featured);

  const handleUseTemplate = (template: Template) => {
    toast.success(`Creating workflow from "${template.name}" template...`);
    // In real implementation, this would create a workflow from the template
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Templates</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Workflow Templates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started quickly with pre-built workflow templates. Customize them to fit your needs.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Featured Section */}
        {selectedCategory === 'All' && !search && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-warning" />
              <h2 className="text-2xl font-bold text-foreground">Featured Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.slice(0, 3).map((template) => (
                <Card key={template.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {template.icon}
                      </div>
                      <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                        <Star className="h-3 w-3 mr-1 fill-warning text-warning" />
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>{template.nodes} nodes</span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {template.uses.toLocaleString()} uses
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toast.info('Preview coming soon!')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {selectedCategory === 'All' ? 'All Templates' : selectedCategory}
          </h2>
          
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No templates found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{template.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{template.category}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{template.nodes} nodes</span>
                      <span>{template.uses.toLocaleString()} uses</span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
