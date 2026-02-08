import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Zap, Search, ArrowLeft, Star, Download, Eye, Loader2,
  Bot, Mail, ShoppingCart, Database, BarChart,
  MessageSquare, Calendar, FileText, Cloud, Coins,
  Users, Code, Shield, TrendingUp, Sparkles, Layout,
  Play, Clock, CheckCircle2
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  data: Json;
  is_featured: boolean;
  use_count: number;
}

const iconMap: Record<string, React.ReactNode> = {
  'AI & Automation': <Bot className="h-6 w-6" />,
  'Sales & CRM': <TrendingUp className="h-6 w-6" />,
  'Reporting': <BarChart className="h-6 w-6" />,
  'E-Commerce': <ShoppingCart className="h-6 w-6" />,
  'Communication': <MessageSquare className="h-6 w-6" />,
  'Productivity': <Calendar className="h-6 w-6" />,
  'Storage': <Cloud className="h-6 w-6" />,
  'Blockchain': <Coins className="h-6 w-6" />,
  'Development': <Code className="h-6 w-6" />,
  'Security': <Shield className="h-6 w-6" />,
  'Analytics': <BarChart className="h-6 w-6" />,
  'Marketing': <Mail className="h-6 w-6" />,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Templates() {
  const navigate = useNavigate();
  const { user, profile, activeWorkspace } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .order('use_count', { ascending: false });
    
    if (error) {
      toast.error('Failed to load templates');
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const categories = ['All', ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = templates.filter(t => t.is_featured);

  const handleUseTemplate = async (template: Template) => {
    if (!user || !activeWorkspace || !profile) {
      toast.error('Please sign in to use templates');
      return;
    }

    setCreatingId(template.id);

    try {
      // Create workflow from template
      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert({
          name: `${template.name} (from template)`,
          description: template.description,
          workspace_id: activeWorkspace.id,
          created_by: profile.id,
          data: template.data,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment use count
      await supabase
        .from('workflow_templates')
        .update({ use_count: template.use_count + 1 })
        .eq('id', template.id);

      toast.success(`Created workflow from "${template.name}" template!`);
      navigate(`/workflow/${workflow.id}`);
    } catch (error) {
      toast.error('Failed to create workflow from template');
    } finally {
      setCreatingId(null);
    }
  };

  const getIcon = (category: string) => {
    return iconMap[category] || <Layout className="h-6 w-6" />;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'AI & Automation': 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
      'Sales & CRM': 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
      'Reporting': 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
      'E-Commerce': 'from-teal-500/20 to-cyan-500/10 border-teal-500/30',
      'Communication': 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
      'Productivity': 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
      'Storage': 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
      'Blockchain': 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
      'Development': 'from-slate-500/20 to-gray-500/10 border-slate-500/30',
      'Security': 'from-rose-500/20 to-red-500/10 border-rose-500/30',
      'Analytics': 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30',
      'Marketing': 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30',
    };
    return colors[category] || 'from-gray-500/20 to-gray-500/10 border-gray-500/30';
  };

  const getNodeCount = (template: Template): number => {
    try {
      const data = template.data as { nodes?: unknown[] };
      return data?.nodes?.length || 0;
    } catch {
      return 0;
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
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Templates</span>
            </div>
          </div>
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
            Workflow Templates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started quickly with pre-built automation templates. One click to create a fully functional workflow.
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
              <div className="text-3xl font-bold text-primary">{templates.length}</div>
              <div className="text-sm text-muted-foreground">Templates</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-500">{featuredTemplates.length}</div>
              <div className="text-sm text-muted-foreground">Featured</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-500">
                {templates.reduce((acc, t) => acc + t.use_count, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Uses</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-violet-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-violet-500">{categories.length - 1}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
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
                    {templates.filter(t => t.category === category).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {selectedCategory === 'All' && !search && featuredTemplates.length > 0 && (
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-2xl font-bold text-foreground">Featured Templates</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredTemplates.slice(0, 6).map((template) => (
                    <motion.div key={template.id} variants={item}>
                      <Card className={`group hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${getCategoryColor(template.category)} border hover:-translate-y-2 h-full`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-background/80 flex items-center justify-center text-foreground shadow-lg">
                              {getIcon(template.category)}
                            </div>
                            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Featured
                            </Badge>
                          </div>
                          <CardTitle className="mt-4 text-xl">{template.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              {getNodeCount(template)} nodes
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {template.use_count.toLocaleString()} uses
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={() => handleUseTemplate(template)}
                              disabled={creatingId === template.id}
                            >
                              {creatingId === template.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />
                                  Use Template
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Templates */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {selectedCategory === 'All' ? 'All Templates' : selectedCategory}
              </h2>
              
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-20">
                  <Layout className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No templates found matching your criteria.</p>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {filteredTemplates.map((template) => (
                    <motion.div key={template.id} variants={item}>
                      <Card className={`group hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${getCategoryColor(template.category)} border hover:-translate-y-1 h-full flex flex-col`}>
                        <CardHeader className="pb-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-background/80 flex items-center justify-center text-foreground shadow-sm">
                              {getIcon(template.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{template.name}</CardTitle>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {template.category}
                                </Badge>
                                {template.is_featured && (
                                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {template.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {getNodeCount(template)} nodes
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {template.use_count.toLocaleString()} uses
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleUseTemplate(template)}
                            disabled={creatingId === template.id}
                          >
                            {creatingId === template.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Use Template
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
