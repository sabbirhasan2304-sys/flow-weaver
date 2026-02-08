import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Zap, Search, ArrowLeft, Download, Star, Check, ExternalLink,
  Bot, Database, Cloud, Shield, BarChart, Coins, 
  MessageSquare, Mail, ShoppingCart, Code, Cpu, Radio,
  Sparkles, Lock, CreditCard, Globe, FileText, Send,
  Activity, Loader2, Package
} from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string;
  icon: string | null;
  version: string;
  is_active: boolean;
  is_system: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Bot: <Bot className="h-6 w-6" />,
  Database: <Database className="h-6 w-6" />,
  Cloud: <Cloud className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  BarChart: <BarChart className="h-6 w-6" />,
  Coins: <Coins className="h-6 w-6" />,
  MessageSquare: <MessageSquare className="h-6 w-6" />,
  Mail: <Mail className="h-6 w-6" />,
  ShoppingCart: <ShoppingCart className="h-6 w-6" />,
  Code: <Code className="h-6 w-6" />,
  Cpu: <Cpu className="h-6 w-6" />,
  Radio: <Radio className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  Lock: <Lock className="h-6 w-6" />,
  CreditCard: <CreditCard className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  FileText: <FileText className="h-6 w-6" />,
  Send: <Send className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Search: <Search className="h-6 w-6" />,
  Brain: <Bot className="h-6 w-6" />,
  Mic: <MessageSquare className="h-6 w-6" />,
  Phone: <MessageSquare className="h-6 w-6" />,
  MessageCircle: <MessageSquare className="h-6 w-6" />,
  TrendingUp: <BarChart className="h-6 w-6" />,
  Key: <Lock className="h-6 w-6" />,
  GitBranch: <Code className="h-6 w-6" />,
  GitMerge: <Code className="h-6 w-6" />,
  Box: <Package className="h-6 w-6" />,
  Server: <Database className="h-6 w-6" />,
  Table: <Database className="h-6 w-6" />,
  Sheet: <FileText className="h-6 w-6" />,
  CheckSquare: <Check className="h-6 w-6" />,
  Smartphone: <MessageSquare className="h-6 w-6" />,
  Wallet: <CreditCard className="h-6 w-6" />,
  ShoppingBag: <ShoppingCart className="h-6 w-6" />,
  Hexagon: <Coins className="h-6 w-6" />,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Marketplace() {
  const { user } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('node_plugins')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });
    
    if (error) {
      toast.error('Failed to load plugins');
    } else {
      setPlugins(data || []);
      // Mark system plugins as installed by default
      const systemPlugins = new Set((data || []).filter(p => p.is_system).map(p => p.id));
      setInstalledPlugins(systemPlugins);
    }
    setLoading(false);
  };

  const categories = ['All', ...new Set(plugins.map(p => p.category))];

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = 
      plugin.display_name.toLowerCase().includes(search.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(search.toLowerCase()) ||
      plugin.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (plugin: Plugin) => {
    if (!user) {
      toast.error('Please sign in to install plugins');
      return;
    }

    setInstallingId(plugin.id);
    
    // Simulate installation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (installedPlugins.has(plugin.id)) {
      setInstalledPlugins(prev => {
        const next = new Set(prev);
        next.delete(plugin.id);
        return next;
      });
      toast.success(`Uninstalled ${plugin.display_name}`);
    } else {
      setInstalledPlugins(prev => new Set([...prev, plugin.id]));
      toast.success(`Installed ${plugin.display_name}! It's now available in the node palette.`);
    }
    
    setInstallingId(null);
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return <Package className="h-6 w-6" />;
    return iconMap[iconName] || <Package className="h-6 w-6" />;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'AI': 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
      'Database': 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
      'Cloud': 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
      'Blockchain': 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      'Analytics': 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
      'Security': 'from-rose-500/20 to-red-500/10 border-rose-500/30',
      'Communication': 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
      'E-Commerce': 'from-teal-500/20 to-cyan-500/10 border-teal-500/30',
      'Email': 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30',
      'Development': 'from-slate-500/20 to-gray-500/10 border-slate-500/30',
      'IoT': 'from-lime-500/20 to-green-500/10 border-lime-500/30',
      'Real-time': 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30',
      'Productivity': 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
      'Payments': 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    };
    return colors[category] || 'from-gray-500/20 to-gray-500/10 border-gray-500/30';
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
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Plugin Marketplace</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Submit Plugin
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Plugin Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Extend FlowForge with powerful integrations. Install plugins to unlock new nodes and capabilities.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{plugins.length}</div>
              <div className="text-sm text-muted-foreground">Available Plugins</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-500">{installedPlugins.size}</div>
              <div className="text-sm text-muted-foreground">Installed</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-violet-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-violet-500">{categories.length - 1}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-500">
                {plugins.filter(p => p.is_system).length}
              </div>
              <div className="text-sm text-muted-foreground">Official Plugins</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
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
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
              >
                {category}
                {category !== 'All' && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                    {plugins.filter(p => p.category === category).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Plugins Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No plugins found matching your criteria.</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredPlugins.map((plugin) => {
              const isInstalled = installedPlugins.has(plugin.id);
              const isInstalling = installingId === plugin.id;
              
              return (
                <motion.div key={plugin.id} variants={item}>
                  <Card className={`group hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${getCategoryColor(plugin.category)} border hover:-translate-y-1`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center text-foreground shadow-sm">
                          {getIcon(plugin.icon)}
                        </div>
                        <div className="flex items-center gap-2">
                          {plugin.is_system && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              <Check className="h-3 w-3 mr-1" />
                              Official
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {plugin.display_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-5">
                            v{plugin.version}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {plugin.category}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="mt-2 line-clamp-2">
                        {plugin.description || 'No description available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        variant={isInstalled ? 'outline' : 'default'}
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleInstall(plugin)}
                        disabled={isInstalling}
                      >
                        {isInstalling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isInstalled ? 'Uninstalling...' : 'Installing...'}
                          </>
                        ) : isInstalled ? (
                          <>
                            <Check className="h-4 w-4" />
                            Installed
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Install
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}
