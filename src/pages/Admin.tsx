import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Users, CreditCard, BarChart3, Settings, Search, 
  Shield, TrendingUp, Activity, DollarSign, UserCheck,
  Workflow, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight,
  RefreshCw, Download, Filter, Crown,
  Sparkles, Globe, ChevronRight, CheckCircle2, XCircle, Clock,
  Database, Server, Cpu, HardDrive, Eye, Mail, UserCog, Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanManagement } from '@/components/admin/PlanManagement';
import { UserManagement } from '@/components/admin/UserManagement';

interface UserData {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  subscription?: {
    plan_name: string;
    status: string;
  };
}

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalWorkflows: number;
  executionsToday: number;
  totalExecutions: number;
  revenue: number;
  totalAiTokens: number;
  totalStorage: number;
}

interface UsageStats {
  aiTokensUsed: number;
  executionsCount: number;
  storageUsed: number;
  estimatedAiCost: number;
  estimatedCloudCost: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, transition: { duration: 0.2 } }
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalWorkflows: 0,
    executionsToday: 0,
    totalExecutions: 0,
    revenue: 0,
    totalAiTokens: 0,
    totalStorage: 0,
  });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    aiTokensUsed: 0,
    executionsCount: 0,
    storageUsed: 0,
    estimatedAiCost: 0,
    estimatedCloudCost: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) return;
    fetchAdminData();
  }, [user, isAdmin, authLoading, adminLoading]);

  const fetchAdminData = async () => {
    try {
      setDataLoading(true);
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (profilesData) {
        const usersWithSubs = await Promise.all(
          profilesData.map(async (profile) => {
            const { data: subData } = await supabase
              .from('subscriptions')
              .select('status, plan:plans(name)')
              .eq('profile_id', profile.id)
              .single();
            
            return {
              ...profile,
              subscription: subData ? {
                plan_name: (subData.plan as { name: string } | null)?.name || 'Unknown',
                status: subData.status,
              } : undefined,
            };
          })
        );
        setUsers(usersWithSubs as UserData[]);
      }

      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeSubCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const { count: workflowCount } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: executionsCount } = await supabase
        .from('executions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', today.toISOString());

      const { count: totalExecutionsCount } = await supabase
        .from('executions')
        .select('*', { count: 'exact', head: true });

      // Fetch usage tracking data
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('ai_tokens_used, executions_count, storage_bytes_used');

      let totalAiTokens = 0;
      let totalStorage = 0;
      let totalExecs = 0;

      if (usageData) {
        usageData.forEach((u) => {
          totalAiTokens += u.ai_tokens_used || 0;
          totalStorage += u.storage_bytes_used || 0;
          totalExecs += u.executions_count || 0;
        });
      }

      // Fetch payment transactions for revenue
      const { data: paymentsData } = await supabase
        .from('payment_transactions')
        .select('amount, status')
        .eq('status', 'completed');

      const totalRevenue = paymentsData?.reduce((acc, p) => acc + p.amount, 0) || 0;

      // Calculate estimated costs in BDT (pricing model)
      // AI: ৳0.25 per 1K tokens, Cloud: ৳0.12 per execution + ৳0.012 per MB storage
      const estimatedAiCost = (totalAiTokens / 1000) * 0.25;
      const storageMB = totalStorage / (1024 * 1024);
      const estimatedCloudCost = (totalExecs * 0.001) + (storageMB * 0.0001);
      
      setStats({
        totalUsers: userCount || 0,
        activeSubscriptions: activeSubCount || 0,
        totalWorkflows: workflowCount || 0,
        executionsToday: executionsCount || 0,
        totalExecutions: totalExecutionsCount || 0,
        revenue: totalRevenue,
        totalAiTokens,
        totalStorage,
      });

      setUsageStats({
        aiTokensUsed: totalAiTokens,
        executionsCount: totalExecs,
        storageUsed: totalStorage,
        estimatedAiCost,
        estimatedCloudCost,
      });
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode, className: string }> = {
      active: { icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
      trial: { icon: <Clock className="h-3 w-3" />, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      canceled: { icon: <XCircle className="h-3 w-3" />, className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      past_due: { icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      paused: { icon: <Clock className="h-3 w-3" />, className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
    };
    const c = config[status] || { icon: null, className: '' };
    return (
      <Badge variant="outline" className={`gap-1.5 font-medium ${c.className}`}>
        {c.icon}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getPlanBadge = (plan: string | undefined) => {
    if (!plan) return <Badge variant="outline" className="text-muted-foreground">No plan</Badge>;
    const config: Record<string, { icon: React.ReactNode, className: string }> = {
      'Enterprise': { icon: <Crown className="h-3 w-3" />, className: 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
      'Pro': { icon: <Sparkles className="h-3 w-3" />, className: 'bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' },
      'Starter': { icon: <Zap className="h-3 w-3" />, className: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
      'Free': { icon: null, className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
    };
    const c = config[plan] || { icon: null, className: '' };
    return (
      <Badge variant="outline" className={`gap-1.5 font-medium ${c.className}`}>
        {c.icon}
        {plan}
      </Badge>
    );
  };

  if (authLoading || adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
            <p className="text-muted-foreground animate-pulse">Loading admin panel...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: 'Registered accounts',
      icon: Users,
      trend: '+12%',
      trendUp: true,
      color: 'blue',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      subtitle: 'Paying customers',
      icon: UserCheck,
      trend: '+8%',
      trendUp: true,
      color: 'emerald',
    },
    {
      title: 'Total Workflows',
      value: stats.totalWorkflows,
      subtitle: 'Created workflows',
      icon: Workflow,
      trend: '+23%',
      trendUp: true,
      color: 'violet',
    },
    {
      title: 'Executions Today',
      value: stats.executionsToday,
      subtitle: 'Workflow runs',
      icon: Zap,
      trend: '+45%',
      trendUp: true,
      color: 'amber',
    },
    {
      title: 'Revenue',
      value: `৳${stats.revenue.toLocaleString()}`,
      subtitle: 'This month',
      icon: DollarSign,
      trend: '-2%',
      trendUp: false,
      color: 'rose',
    },
  ];

  const colorClasses: Record<string, { bg: string, iconBg: string, icon: string, border: string }> = {
    blue: { bg: 'from-blue-500/10 via-blue-500/5 to-transparent', iconBg: 'bg-blue-500/10', icon: 'text-blue-500', border: 'border-blue-500/20' },
    emerald: { bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent', iconBg: 'bg-emerald-500/10', icon: 'text-emerald-500', border: 'border-emerald-500/20' },
    violet: { bg: 'from-violet-500/10 via-violet-500/5 to-transparent', iconBg: 'bg-violet-500/10', icon: 'text-violet-500', border: 'border-violet-500/20' },
    amber: { bg: 'from-amber-500/10 via-amber-500/5 to-transparent', iconBg: 'bg-amber-500/10', icon: 'text-amber-500', border: 'border-amber-500/20' },
    rose: { bg: 'from-rose-500/10 via-rose-500/5 to-transparent', iconBg: 'bg-rose-500/10', icon: 'text-rose-500', border: 'border-rose-500/20' },
  };

  // Calculate actual system stats based on real data
  const storagePercentage = stats.totalStorage > 0 ? Math.min(100, (stats.totalStorage / (1024 * 1024 * 1024)) * 100) : 0; // Assuming 1GB limit
  const systemStats = [
    { label: 'Total Executions', value: stats.totalExecutions, icon: Zap, displayValue: formatNumber(stats.totalExecutions), isCount: true },
    { label: 'AI Tokens Used', value: usageStats.aiTokensUsed, icon: Sparkles, displayValue: formatNumber(usageStats.aiTokensUsed), isCount: true },
    { label: 'Storage Used', value: storagePercentage, icon: HardDrive, displayValue: formatBytes(stats.totalStorage), isCount: false },
    { label: 'Active Workflows', value: stats.totalWorkflows, icon: Workflow, displayValue: stats.totalWorkflows.toString(), isCount: true },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8 pb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-violet-600 shadow-lg shadow-primary/25">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage users, subscriptions, and platform settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAdminData} 
              disabled={dataLoading}
              className="gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/5 hover:border-primary/30">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => {
            const colors = colorClasses[stat.color];
            return (
              <motion.div
                key={stat.title}
                variants={cardHover}
                initial="rest"
                whileHover="hover"
              >
                <Card className={`relative overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.bg} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-black/5 to-transparent rounded-full translate-y-12 -translate-x-12" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2.5 rounded-xl ${colors.iconBg} ring-1 ring-white/10`}>
                      <stat.icon className={`h-4 w-4 ${colors.icon}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${stat.trendUp ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'}`}>
                        {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {stat.trend}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* AI & Cloud Usage Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Usage Card */}
          <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Usage</CardTitle>
                    <CardDescription>Token usage and estimated costs</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {formatNumber(usageStats.aiTokensUsed)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Tokens Used</div>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    ৳{usageStats.estimatedAiCost.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Estimated Cost</div>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credit-based: 1 credit/message</span>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                    Platform AI
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Usage Card */}
          <Card className="border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
                    <Cloud className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Cloud Usage</CardTitle>
                    <CardDescription>Executions, storage, and costs</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {formatNumber(stats.totalExecutions)}
                  </div>
                  <div className="text-xs text-muted-foreground">Executions</div>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {formatBytes(stats.totalStorage)}
                  </div>
                  <div className="text-xs text-muted-foreground">Storage</div>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    ৳{usageStats.estimatedCloudCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Est. Cost</div>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rate: ৳0.12/exec + ৳0.012/MB</span>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
                    Cloud
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Stats Bar */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-card via-card to-primary/5">
            <CardContent className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {systemStats.map((sys) => (
                  <div key={sys.label} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <sys.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">{sys.label}</span>
                        <span className="text-xs font-bold text-primary">{sys.displayValue}</span>
                      </div>
                      {!sys.isCount && (
                        <Progress value={sys.value} className="h-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1.5 h-auto rounded-xl border border-border/50">
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground px-4 py-2"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{stats.totalUsers}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="subscriptions" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground px-4 py-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Subscriptions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground px-4 py-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="plans" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground px-4 py-2"
              >
                <Crown className="h-4 w-4" />
                <span>Plans</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground px-4 py-2"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* Users Tab */}
              <TabsContent value="users" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserManagement />
                </motion.div>
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Free', color: 'slate', icon: Users, gradient: 'from-slate-500/15 to-slate-500/5' },
                      { name: 'Starter', color: 'blue', icon: Zap, gradient: 'from-blue-500/15 to-blue-500/5' },
                      { name: 'Pro', color: 'violet', icon: Sparkles, gradient: 'from-violet-500/15 to-violet-500/5' },
                      { name: 'Enterprise', color: 'amber', icon: Crown, gradient: 'from-amber-500/15 to-amber-500/5' },
                    ].map((plan) => {
                      const count = users.filter((u) => u.subscription?.plan_name === plan.name).length;
                      const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                      return (
                        <motion.div
                          key={plan.name}
                          variants={cardHover}
                          initial="rest"
                          whileHover="hover"
                        >
                          <Card className={`border-0 bg-gradient-to-br ${plan.gradient} shadow-sm hover:shadow-lg transition-all cursor-pointer`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{plan.name}</CardTitle>
                                <plan.icon className={`h-5 w-5 text-${plan.color}-500`} />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="text-4xl font-bold tracking-tight">{count}</div>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-muted-foreground">users</p>
                                <Badge variant="secondary" className="text-[10px] h-5">{percentage}%</Badge>
                              </div>
                              <Progress value={percentage} className="mt-3 h-1.5" />
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Subscription Status Overview
                      </CardTitle>
                      <CardDescription>Breakdown of user subscriptions by status</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {['active', 'trial', 'canceled', 'past_due', 'paused'].map((status) => {
                          const count = users.filter((u) => u.subscription?.status === status).length;
                          const statusColors: Record<string, string> = {
                            active: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                            trial: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
                            canceled: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
                            past_due: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
                            paused: 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400',
                          };
                          return (
                            <div 
                              key={status} 
                              className={`text-center p-4 rounded-xl border ${statusColors[status]} transition-all hover:scale-105 cursor-pointer`}
                            >
                              <div className="text-3xl font-bold">{count}</div>
                              <div className="text-xs font-medium capitalize mt-1">{status.replace('_', ' ')}</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Platform Analytics
                      </CardTitle>
                      <CardDescription>Usage metrics and trends</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
                          <TrendingUp className="h-10 w-10 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">Analytics Coming Soon</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
                            Track executions, user growth, and revenue with beautiful charts and real-time insights.
                          </p>
                        </div>
                        <Button className="gap-2">
                          <Globe className="h-4 w-4" />
                          Get Notified
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Plans Tab */}
              <TabsContent value="plans" className="space-y-6 mt-0">
                <PlanManagement />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Payment Gateway Integrations
                      </CardTitle>
                      <CardDescription>Configure payment providers for your platform</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: 'bKash', description: 'Mobile financial service', color: 'from-pink-500/15 to-pink-500/5', borderColor: 'border-pink-500/20', configured: false },
                          { name: 'Nagad', description: 'Digital payment platform', color: 'from-orange-500/15 to-orange-500/5', borderColor: 'border-orange-500/20', configured: false },
                          { name: 'SSLCommerz', description: 'Payment gateway', color: 'from-blue-500/15 to-blue-500/5', borderColor: 'border-blue-500/20', configured: false },
                          { name: 'Stripe', description: 'International payments', color: 'from-violet-500/15 to-violet-500/5', borderColor: 'border-violet-500/20', configured: false },
                        ].map((gateway) => (
                          <motion.div
                            key={gateway.name}
                            variants={cardHover}
                            initial="rest"
                            whileHover="hover"
                          >
                            <Card className={`border ${gateway.borderColor} bg-gradient-to-br ${gateway.color} hover:shadow-lg transition-all cursor-pointer`}>
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-background/80 shadow-sm">
                                      <Activity className="h-6 w-6 text-foreground" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-lg">{gateway.name}</h4>
                                      <p className="text-sm text-muted-foreground">{gateway.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge 
                                      variant="outline" 
                                      className={gateway.configured ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}
                                    >
                                      {gateway.configured ? 'Connected' : 'Not Configured'}
                                    </Badge>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      Configure
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        System Settings
                      </CardTitle>
                      <CardDescription>Configure platform-wide settings</CardDescription>
                    </CardHeader>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="p-4 rounded-2xl bg-muted/50 mb-4">
                          <Settings className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">Additional Settings Coming Soon</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2">
                          More configuration options will be available in future updates.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
