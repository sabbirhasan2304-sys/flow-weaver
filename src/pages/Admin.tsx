import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, CreditCard, BarChart3, Settings, 
  Shield, Activity, DollarSign, UserCheck,
  Workflow, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight,
  RefreshCw, Download, Crown,
  Sparkles, CheckCircle2, XCircle, Clock,
  HardDrive, Mail, Cloud, Code, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanManagement } from '@/components/admin/PlanManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { ActiveAnalytics } from '@/components/admin/ActiveAnalytics';
import { ApiManagement } from '@/components/admin/ApiManagement';
import { BackendProviderSettings } from '@/components/tracking/BackendProviderSettings';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminEmailOverview } from '@/components/admin/AdminEmailOverview';
import { AdminPlatformSettings } from '@/components/admin/AdminPlatformSettings';
import { DataManagement } from '@/components/admin/DataManagement';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalWorkflows: number;
  executionsToday: number;
  totalExecutions: number;
  revenue: number;
  totalAiTokens: number;
  totalStorage: number;
  // For trends
  usersLastWeek: number;
  usersThisWeek: number;
  subsLastWeek: number;
  subsThisWeek: number;
  workflowsLastWeek: number;
  workflowsThisWeek: number;
  execYesterday: number;
}

interface UsageStats {
  aiTokensUsed: number;
  executionsCount: number;
  storageUsed: number;
  estimatedAiCost: number;
  estimatedCloudCost: number;
}

// Subscription counts from direct queries
interface SubCounts {
  active: number;
  trial: number;
  canceled: number;
  past_due: number;
  paused: number;
  byPlan: Record<string, number>;
  total: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
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
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, activeSubscriptions: 0, totalWorkflows: 0,
    executionsToday: 0, totalExecutions: 0, revenue: 0,
    totalAiTokens: 0, totalStorage: 0,
    usersLastWeek: 0, usersThisWeek: 0,
    subsLastWeek: 0, subsThisWeek: 0,
    workflowsLastWeek: 0, workflowsThisWeek: 0,
    execYesterday: 0,
  });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    aiTokensUsed: 0, executionsCount: 0, storageUsed: 0, estimatedAiCost: 0, estimatedCloudCost: 0,
  });
  const [subCounts, setSubCounts] = useState<SubCounts>({
    active: 0, trial: 0, canceled: 0, past_due: 0, paused: 0, byPlan: {}, total: 0,
  });
  const [errorCount, setErrorCount] = useState(0);
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
      const now = new Date();
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const oneWeekAgo = new Date(now); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const [
        { count: userCount },
        { count: activeSubCount },
        { count: workflowCount },
        { count: execTodayCount },
        { count: totalExecCount },
        { count: usersThisWeek },
        { count: usersLastWeek },
        { count: workflowsThisWeek },
        { count: workflowsLastWeek },
        { count: execYesterday },
        { count: errCount },
        { data: paymentsData },
        { data: usageData },
        { data: subsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('workflows').select('*', { count: 'exact', head: true }),
        supabase.from('executions').select('*', { count: 'exact', head: true }).gte('started_at', today.toISOString()),
        supabase.from('executions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', oneWeekAgo.toISOString()),
        supabase.from('workflows').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('workflows').select('*', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', oneWeekAgo.toISOString()),
        supabase.from('executions').select('*', { count: 'exact', head: true }).gte('started_at', yesterday.toISOString()).lt('started_at', today.toISOString()),
        supabase.from('error_logs').select('*', { count: 'exact', head: true }),
        supabase.from('payment_transactions').select('amount, status').eq('status', 'completed'),
        supabase.from('usage_tracking').select('ai_tokens_used, executions_count, storage_bytes_used'),
        supabase.from('subscriptions').select('status, plan:plans(name)'),
      ]);

      // Process subscription counts directly from DB
      const sc: SubCounts = { active: 0, trial: 0, canceled: 0, past_due: 0, paused: 0, byPlan: {}, total: 0 };
      subsData?.forEach((s: any) => {
        sc.total++;
        if (s.status in sc && typeof (sc as any)[s.status] === 'number') {
          (sc as any)[s.status]++;
        }
        const planName = s.plan?.name || 'Unknown';
        sc.byPlan[planName] = (sc.byPlan[planName] || 0) + 1;
      });
      setSubCounts(sc);

      let totalAiTokens = 0, totalStorage = 0, totalExecs = 0;
      usageData?.forEach((u: any) => {
        totalAiTokens += u.ai_tokens_used || 0;
        totalStorage += u.storage_bytes_used || 0;
        totalExecs += u.executions_count || 0;
      });

      const totalRevenue = paymentsData?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
      const estimatedAiCost = (totalAiTokens / 1000) * 0.25;
      const storageMB = totalStorage / (1024 * 1024);
      const estimatedCloudCost = (totalExecs * 0.001) + (storageMB * 0.0001);

      setStats({
        totalUsers: userCount || 0,
        activeSubscriptions: activeSubCount || 0,
        totalWorkflows: workflowCount || 0,
        executionsToday: execTodayCount || 0,
        totalExecutions: totalExecCount || 0,
        revenue: totalRevenue,
        totalAiTokens, totalStorage,
        usersThisWeek: usersThisWeek || 0,
        usersLastWeek: usersLastWeek || 0,
        subsThisWeek: 0, subsLastWeek: 0, // subscriptions don't have easy period comparison
        workflowsThisWeek: workflowsThisWeek || 0,
        workflowsLastWeek: workflowsLastWeek || 0,
        execYesterday: execYesterday || 0,
      });

      setUsageStats({ aiTokensUsed: totalAiTokens, executionsCount: totalExecs, storageUsed: totalStorage, estimatedAiCost, estimatedCloudCost });
      setErrorCount(errCount || 0);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const calcTrend = (current: number, previous: number): { text: string; up: boolean | null } => {
    if (previous === 0 && current === 0) return { text: '—', up: null };
    if (previous === 0) return { text: `+${current}`, up: true };
    const pct = ((current - previous) / previous) * 100;
    if (pct === 0) return { text: '0%', up: null };
    return { text: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`, up: pct > 0 };
  };

  const handleExport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      stats,
      usageStats,
      subscriptionCounts: subCounts,
      errorCount,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Admin report exported');
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

  if (!isAdmin) return null;

  const userTrend = calcTrend(stats.usersThisWeek, stats.usersLastWeek);
  const wfTrend = calcTrend(stats.workflowsThisWeek, stats.workflowsLastWeek);
  const execTrend = calcTrend(stats.executionsToday, stats.execYesterday);

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, subtitle: 'Registered accounts', icon: Users, trend: userTrend, color: 'blue' },
    { title: 'Active Subscriptions', value: stats.activeSubscriptions, subtitle: 'Paying customers', icon: UserCheck, trend: { text: formatNumber(subCounts.active), up: null as boolean | null }, color: 'emerald' },
    { title: 'Total Workflows', value: stats.totalWorkflows, subtitle: 'Created workflows', icon: Workflow, trend: wfTrend, color: 'violet' },
    { title: 'Executions Today', value: stats.executionsToday, subtitle: 'Workflow runs', icon: Zap, trend: execTrend, color: 'amber' },
    { title: 'Revenue', value: `৳${stats.revenue.toLocaleString()}`, subtitle: 'All time', icon: DollarSign, trend: { text: '—', up: null as boolean | null }, color: 'rose' },
  ];

  const colorClasses: Record<string, { bg: string, iconBg: string, icon: string, border: string }> = {
    blue: { bg: 'from-blue-500/10 via-blue-500/5 to-transparent', iconBg: 'bg-blue-500/10', icon: 'text-blue-500', border: 'border-blue-500/20' },
    emerald: { bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent', iconBg: 'bg-emerald-500/10', icon: 'text-emerald-500', border: 'border-emerald-500/20' },
    violet: { bg: 'from-violet-500/10 via-violet-500/5 to-transparent', iconBg: 'bg-violet-500/10', icon: 'text-violet-500', border: 'border-violet-500/20' },
    amber: { bg: 'from-amber-500/10 via-amber-500/5 to-transparent', iconBg: 'bg-amber-500/10', icon: 'text-amber-500', border: 'border-amber-500/20' },
    rose: { bg: 'from-rose-500/10 via-rose-500/5 to-transparent', iconBg: 'bg-rose-500/10', icon: 'text-rose-500', border: 'border-rose-500/20' },
  };

  const storagePercentage = stats.totalStorage > 0 ? Math.min(100, (stats.totalStorage / (1024 * 1024 * 1024)) * 100) : 0;
  const systemStats = [
    { label: 'Total Executions', value: stats.totalExecutions, icon: Zap, displayValue: formatNumber(stats.totalExecutions), isCount: true },
    { label: 'AI Tokens Used', value: usageStats.aiTokensUsed, icon: Sparkles, displayValue: formatNumber(usageStats.aiTokensUsed), isCount: true },
    { label: 'Storage Used', value: storagePercentage, icon: HardDrive, displayValue: formatBytes(stats.totalStorage), isCount: false },
    { label: 'Active Workflows', value: stats.totalWorkflows, icon: Workflow, displayValue: stats.totalWorkflows.toString(), isCount: true },
  ];

  const tabTriggerClass = "flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground px-4 py-2";

  return (
    <DashboardLayout>
      <motion.div className="space-y-8 pb-8" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-violet-600 shadow-lg shadow-primary/25">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage users, subscriptions, and platform settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAdminData} disabled={dataLoading} className="gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all">
              <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => {
            const colors = colorClasses[stat.color];
            return (
              <motion.div key={stat.title} variants={cardHover} initial="rest" whileHover="hover">
                <Card className={`relative overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.bg} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
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
                      {stat.trend.up !== null ? (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${stat.trend.up ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'}`}>
                          {stat.trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {stat.trend.text}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-muted-foreground bg-muted/50">
                          <Minus className="h-3 w-3" />
                          {stat.trend.text}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* AI & Cloud Usage Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Usage</CardTitle>
                  <CardDescription>Token usage and estimated costs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatNumber(usageStats.aiTokensUsed)}</div>
                  <div className="text-sm text-muted-foreground">Total Tokens Used</div>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">৳{usageStats.estimatedAiCost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Estimated Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
                  <Cloud className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cloud Usage</CardTitle>
                  <CardDescription>Executions, storage, and costs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{formatNumber(stats.totalExecutions)}</div>
                  <div className="text-xs text-muted-foreground">Executions</div>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{formatBytes(stats.totalStorage)}</div>
                  <div className="text-xs text-muted-foreground">Storage</div>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">৳{usageStats.estimatedCloudCost.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Est. Cost</div>
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
                      {!sys.isCount && <Progress value={sys.value} className="h-1.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={item}>
          <AdminActivityFeed />
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1.5 h-auto rounded-xl border border-border/50 flex-wrap">
              <TabsTrigger value="users" className={tabTriggerClass}>
                <Users className="h-4 w-4" /><span>Users</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{stats.totalUsers}</Badge>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className={tabTriggerClass}>
                <CreditCard className="h-4 w-4" /><span>Subscriptions</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className={tabTriggerClass}>
                <BarChart3 className="h-4 w-4" /><span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="email" className={tabTriggerClass}>
                <Mail className="h-4 w-4" /><span>Email</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className={tabTriggerClass}>
                <Crown className="h-4 w-4" /><span>Plans</span>
              </TabsTrigger>
              <TabsTrigger value="api" className={tabTriggerClass}>
                <Code className="h-4 w-4" /><span>API</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className={tabTriggerClass}>
                <Settings className="h-4 w-4" /><span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="crashes" className={tabTriggerClass}>
                <AlertTriangle className="h-4 w-4" /><span>Crashes</span>
                {errorCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{errorCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="data" className={tabTriggerClass}>
                <Database className="h-4 w-4" /><span>Data</span>
              </TabsTrigger>
              <TabsTrigger value="backend" className={tabTriggerClass}>
                <Cloud className="h-4 w-4" /><span>Backend</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="users" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <UserManagement />
                </motion.div>
              </TabsContent>

              <TabsContent value="subscriptions" className="space-y-6 mt-0">
                <SubscriptionsTab subCounts={subCounts} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <ActiveAnalytics />
                </motion.div>
              </TabsContent>

              <TabsContent value="email" className="mt-0">
                <AdminEmailOverview />
              </TabsContent>

              <TabsContent value="plans" className="space-y-6 mt-0">
                <PlanManagement />
              </TabsContent>

              <TabsContent value="api" className="space-y-6 mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <ApiManagement />
                </motion.div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0">
                <AdminPlatformSettings />
              </TabsContent>

              <TabsContent value="crashes" className="mt-0">
                <CrashReportsPanel onCountChange={setErrorCount} />
              </TabsContent>

              <TabsContent value="data" className="mt-0">
                <DataManagement />
              </TabsContent>

              <TabsContent value="backend" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <BackendProviderSettings />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

// --- Subscriptions Tab with real counts ---
function SubscriptionsTab({ subCounts }: { subCounts: SubCounts }) {
  const planConfigs = [
    { name: 'Free', color: 'slate', icon: Users, gradient: 'from-slate-500/15 to-slate-500/5' },
    { name: 'Starter', color: 'blue', icon: Zap, gradient: 'from-blue-500/15 to-blue-500/5' },
    { name: 'Pro', color: 'violet', icon: Sparkles, gradient: 'from-violet-500/15 to-violet-500/5' },
    { name: 'Enterprise', color: 'amber', icon: Crown, gradient: 'from-amber-500/15 to-amber-500/5' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {planConfigs.map((plan) => {
          const count = subCounts.byPlan[plan.name] || 0;
          const percentage = subCounts.total > 0 ? Math.round((count / subCounts.total) * 100) : 0;
          return (
            <motion.div key={plan.name} variants={cardHover} initial="rest" whileHover="hover">
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
          <CardDescription>Breakdown by status (queried directly from database)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(['active', 'trial', 'canceled', 'past_due', 'paused'] as const).map((status) => {
              const count = subCounts[status];
              const statusColors: Record<string, string> = {
                active: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                trial: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
                canceled: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
                past_due: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
                paused: 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400',
              };
              return (
                <div key={status} className={`text-center p-4 rounded-xl border ${statusColors[status]} transition-all hover:scale-105 cursor-pointer`}>
                  <div className="text-3xl font-bold">{count}</div>
                  <div className="text-xs font-medium capitalize mt-1">{status.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Enhanced Crash Reports ---
function CrashReportsPanel({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs(data || []);
    onCountChange?.(count || 0);
    setLoading(false);
  };

  const classifySeverity = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('warning') || lower.includes('warn')) return 'warning';
    if (lower.includes('info')) return 'info';
    return 'error';
  };

  const filteredLogs = severityFilter === 'all' ? logs : logs.filter(l => classifySeverity(l.error_message) === severityFilter);

  const severityBadge = (severity: string) => {
    const map: Record<string, { variant: 'destructive' | 'default' | 'secondary'; label: string }> = {
      error: { variant: 'destructive', label: 'Error' },
      warning: { variant: 'default', label: 'Warning' },
      info: { variant: 'secondary', label: 'Info' },
    };
    const s = map[severity] || map.error;
    return <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Crash Reports
            {logs.length > 0 && <Badge variant="destructive" className="ml-2">{logs.length}</Badge>}
          </CardTitle>
          <CardDescription>Recent application errors logged from users</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-primary" />
            {severityFilter === 'all' ? 'No crash reports — your app is running smoothly!' : `No ${severityFilter} level reports found`}
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => {
                  const severity = classifySeverity(log.error_message);
                  return (
                    <React.Fragment key={log.id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        <TableCell className="whitespace-nowrap text-xs">{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm font-mono">{log.error_message}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{log.url}</TableCell>
                        <TableCell>{severityBadge(severity)}</TableCell>
                      </TableRow>
                      {expandedId === log.id && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              {log.user_id && <p className="text-xs text-muted-foreground">User: {log.user_id}</p>}
                              <p className="text-xs text-muted-foreground">Browser: {log.user_agent?.slice(0, 120)}</p>
                              {log.error_stack && (
                                <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-[11px] whitespace-pre-wrap font-mono">{log.error_stack}</pre>
                              )}
                              {log.component_stack && (
                                <details className="mt-1">
                                  <summary className="text-xs cursor-pointer text-muted-foreground">Component Stack</summary>
                                  <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-[11px] whitespace-pre-wrap font-mono">{log.component_stack}</pre>
                                </details>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
