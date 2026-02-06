import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Zap, Search, ArrowLeft, Download, Star, Check, ExternalLink,
  Bot, Database, Cloud, Shield, BarChart, Coins, 
  MessageSquare, Mail, ShoppingCart, Code, Cpu, Radio
} from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  icon: React.ReactNode;
  downloads: number;
  rating: number;
  verified: boolean;
  installed: boolean;
  version: string;
  tags: string[];
}

const plugins: Plugin[] = [
  {
    id: '1',
    name: 'OpenAI Advanced',
    description: 'Extended OpenAI integration with function calling, vision, and fine-tuning support',
    author: 'FlowForge Team',
    category: 'AI',
    icon: <Bot className="h-6 w-6" />,
    downloads: 45000,
    rating: 4.9,
    verified: true,
    installed: true,
    version: '2.3.0',
    tags: ['GPT-4', 'Vision', 'Embeddings'],
  },
  {
    id: '2',
    name: 'Supabase Extended',
    description: 'Full Supabase integration including Realtime, Storage, and Edge Functions',
    author: 'FlowForge Team',
    category: 'Database',
    icon: <Database className="h-6 w-6" />,
    downloads: 32000,
    rating: 4.8,
    verified: true,
    installed: true,
    version: '1.8.0',
    tags: ['PostgreSQL', 'Realtime', 'Auth'],
  },
  {
    id: '3',
    name: 'AWS Suite',
    description: 'Complete AWS integration: S3, Lambda, SQS, SNS, DynamoDB, and more',
    author: 'CloudOps Ltd',
    category: 'Cloud',
    icon: <Cloud className="h-6 w-6" />,
    downloads: 28000,
    rating: 4.7,
    verified: true,
    installed: false,
    version: '3.1.0',
    tags: ['S3', 'Lambda', 'DynamoDB'],
  },
  {
    id: '4',
    name: 'Ethereum Smart Contracts',
    description: 'Deploy, interact with, and monitor Ethereum smart contracts',
    author: 'Web3 Labs',
    category: 'Blockchain',
    icon: <Coins className="h-6 w-6" />,
    downloads: 18500,
    rating: 4.6,
    verified: true,
    installed: false,
    version: '2.0.0',
    tags: ['Solidity', 'NFT', 'DeFi'],
  },
  {
    id: '5',
    name: 'Advanced Analytics',
    description: 'Deep analytics with BigQuery, Mixpanel, Amplitude, and custom dashboards',
    author: 'DataFlow Inc',
    category: 'Analytics',
    icon: <BarChart className="h-6 w-6" />,
    downloads: 15200,
    rating: 4.5,
    verified: true,
    installed: false,
    version: '1.5.0',
    tags: ['BigQuery', 'Dashboards', 'Reports'],
  },
  {
    id: '6',
    name: 'Security Toolkit',
    description: 'JWT validation, encryption, rate limiting, and security scanning nodes',
    author: 'SecureFlow',
    category: 'Security',
    icon: <Shield className="h-6 w-6" />,
    downloads: 12800,
    rating: 4.8,
    verified: true,
    installed: false,
    version: '1.2.0',
    tags: ['JWT', 'Encryption', 'Auth'],
  },
  {
    id: '7',
    name: 'Slack Pro',
    description: 'Advanced Slack integration with Block Kit, modals, and app home',
    author: 'FlowForge Team',
    category: 'Communication',
    icon: <MessageSquare className="h-6 w-6" />,
    downloads: 21000,
    rating: 4.7,
    verified: true,
    installed: false,
    version: '2.1.0',
    tags: ['Block Kit', 'Modals', 'Webhooks'],
  },
  {
    id: '8',
    name: 'Email Marketing Suite',
    description: 'SendGrid, Mailchimp, and custom SMTP with templates and analytics',
    author: 'MarketingOps',
    category: 'Marketing',
    icon: <Mail className="h-6 w-6" />,
    downloads: 19500,
    rating: 4.6,
    verified: true,
    installed: false,
    version: '1.9.0',
    tags: ['SendGrid', 'Templates', 'Analytics'],
  },
  {
    id: '9',
    name: 'E-commerce Bundle',
    description: 'Stripe, Shopify, WooCommerce with inventory and order management',
    author: 'CommerceFlow',
    category: 'E-Commerce',
    icon: <ShoppingCart className="h-6 w-6" />,
    downloads: 16800,
    rating: 4.5,
    verified: true,
    installed: false,
    version: '2.2.0',
    tags: ['Stripe', 'Inventory', 'Orders'],
  },
  {
    id: '10',
    name: 'DevOps Toolkit',
    description: 'GitHub Actions, GitLab CI, Docker, and Kubernetes integrations',
    author: 'DevOps Pro',
    category: 'Development',
    icon: <Code className="h-6 w-6" />,
    downloads: 14200,
    rating: 4.7,
    verified: true,
    installed: false,
    version: '1.6.0',
    tags: ['CI/CD', 'Docker', 'K8s'],
  },
  {
    id: '11',
    name: 'IoT Gateway',
    description: 'MQTT, AWS IoT, and Google Cloud IoT with device management',
    author: 'IoT Systems',
    category: 'IoT',
    icon: <Cpu className="h-6 w-6" />,
    downloads: 8900,
    rating: 4.4,
    verified: true,
    installed: false,
    version: '1.3.0',
    tags: ['MQTT', 'Sensors', 'Devices'],
  },
  {
    id: '12',
    name: 'Real-time Streaming',
    description: 'WebSockets, Server-Sent Events, and Kafka integration',
    author: 'StreamTech',
    category: 'Real-time',
    icon: <Radio className="h-6 w-6" />,
    downloads: 7600,
    rating: 4.5,
    verified: true,
    installed: false,
    version: '1.1.0',
    tags: ['WebSocket', 'Kafka', 'SSE'],
  },
];

const categories = [
  'All',
  'AI',
  'Database',
  'Cloud',
  'Blockchain',
  'Analytics',
  'Security',
  'Communication',
  'E-Commerce',
  'Development',
  'IoT',
];

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(['1', '2']);

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(search.toLowerCase()) ||
      plugin.description.toLowerCase().includes(search.toLowerCase()) ||
      plugin.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (plugin: Plugin) => {
    if (installedPlugins.includes(plugin.id)) {
      setInstalledPlugins(prev => prev.filter(id => id !== plugin.id));
      toast.success(`Uninstalled ${plugin.name}`);
    } else {
      setInstalledPlugins(prev => [...prev, plugin.id]);
      toast.success(`Installed ${plugin.name}`);
    }
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
              <span className="text-xl font-bold text-foreground">Plugin Marketplace</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Submit Plugin
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Plugin Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Extend FlowForge with powerful plugins. Install community-created integrations or build your own.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{plugins.length}</div>
              <div className="text-sm text-muted-foreground">Available Plugins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{installedPlugins.length}</div>
              <div className="text-sm text-muted-foreground">Installed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {(plugins.reduce((acc, p) => acc + p.downloads, 0) / 1000).toFixed(0)}K+
              </div>
              <div className="text-sm text-muted-foreground">Total Downloads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{categories.length - 1}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
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

        {/* Plugins Grid */}
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No plugins found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => {
              const isInstalled = installedPlugins.includes(plugin.id);
              
              return (
                <Card key={plugin.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {plugin.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {plugin.verified && (
                          <Badge variant="secondary" className="bg-success/20 text-success">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <CardTitle className="flex items-center gap-2">
                        {plugin.name}
                        <span className="text-xs font-normal text-muted-foreground">v{plugin.version}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">by {plugin.author}</p>
                    </div>
                    <CardDescription className="mt-2">{plugin.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {plugin.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {plugin.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {plugin.rating}
                      </span>
                    </div>
                    <Button
                      variant={isInstalled ? 'outline' : 'default'}
                      size="sm"
                      className="w-full"
                      onClick={() => handleInstall(plugin)}
                    >
                      {isInstalled ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Installed
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          Install
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
