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
import { 
  Users, CreditCard, BarChart3, Settings, Search, 
  Shield, TrendingUp, Activity, DollarSign, UserCheck,
  Workflow, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, RefreshCw, Download, Filter, Crown,
  Sparkles, Globe, ChevronRight, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UserData {
  id: string;
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
  revenue: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
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
    revenue: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(false);

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
        .select('id, email, full_name, created_at')
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
        setUsers(usersWithSubs);
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
      
      setStats({
        totalUsers: userCount || 0,
        activeSubscriptions: activeSubCount || 0,
        totalWorkflows: workflowCount || 0,
        executionsToday: executionsCount || 0,
        revenue: 0,
      });
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode, className: string }> = {
      active: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-success/10 text-success border-success/20 hover:bg-success/20' },
      trial: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, className: 'bg-warning/10 text-warning border-warning/20' },
      canceled: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, className: 'bg-destructive/10 text-destructive border-destructive/20' },
      past_due: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-destructive/10 text-destructive border-destructive/20' },
      paused: { variant: 'outline', icon: <Clock className="h-3 w-3" />, className: '' },
    };
    const c = config[status] || { variant: 'outline' as const, icon: null, className: '' };
    return (
      <Badge variant={c.variant} className={`gap-1 ${c.className}`}>
        {c.icon}
        {status}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string | undefined) => {
    if (!plan) return <Badge variant="outline" className="text-muted-foreground">No plan</Badge>;
    const config: Record<string, { icon: React.ReactNode, className: string }> = {
      'Enterprise': { icon: <Crown className="h-3 w-3" />, className: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' },
      'Pro': { icon: <Sparkles className="h-3 w-3" />, className: 'bg-gradient-to-r from-primary/20 to-info/20 text-primary border-primary/30' },
      'Starter': { icon: <Zap className="h-3 w-3" />, className: 'bg-secondary text-secondary-foreground' },
      'Free': { icon: null, className: '' },
    };
    const c = config[plan] || { icon: null, className: '' };
    return (
      <Badge variant="outline" className={`gap-1 ${c.className}`}>
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
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      subtitle: 'Paying customers',
      icon: UserCheck,
      trend: '+8%',
      trendUp: true,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Total Workflows',
      value: stats.totalWorkflows,
      subtitle: 'Created workflows',
      icon: Workflow,
      trend: '+23%',
      trendUp: true,
      gradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      title: 'Executions Today',
      value: stats.executionsToday,
      subtitle: 'Workflow runs',
      icon: Zap,
      trend: '+45%',
      trendUp: true,
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Revenue',
      value: `৳${stats.revenue.toLocaleString()}`,
      subtitle: 'This month',
      icon: DollarSign,
      trend: '-2%',
      trendUp: false,
      gradient: 'from-pink-500/10 via-pink-500/5 to-transparent',
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-500',
    },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground text-sm">
                  Manage users, subscriptions, and platform settings
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAdminData} disabled={dataLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => (
            <Card 
              key={stat.title} 
              className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item}>
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Subscriptions</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4 mt-0">
              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">User Management</CardTitle>
                      <CardDescription>View and manage all registered users</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-64 bg-background/50"
                        />
                      </div>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="w-[300px]">User</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((u, index) => (
                            <TableRow 
                              key={u.id} 
                              className="group hover:bg-muted/30 border-border/50 cursor-pointer"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium text-sm">
                                      {(u.full_name || u.email).charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{u.full_name || 'No name'}</div>
                                    <div className="text-sm text-muted-foreground">{u.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getPlanBadge(u.subscription?.plan_name)}
                              </TableCell>
                              <TableCell>
                                {u.subscription ? getStatusBadge(u.subscription.status) : (
                                  <Badge variant="outline" className="text-muted-foreground">-</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(u.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <span className="mr-1">View</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Free', color: 'from-slate-500/10 to-slate-500/5', iconColor: 'text-slate-500', icon: Users },
                  { name: 'Starter', color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500', icon: Zap },
                  { name: 'Pro', color: 'from-primary/10 to-primary/5', iconColor: 'text-primary', icon: Sparkles },
                  { name: 'Enterprise', color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500', icon: Crown },
                ].map((plan) => {
                  const count = users.filter((u) => u.subscription?.plan_name === plan.name).length;
                  return (
                    <Card key={plan.name} className={`border-0 bg-gradient-to-br ${plan.color} shadow-sm hover:shadow-md transition-all`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-muted-foreground">{plan.name}</CardTitle>
                          <plan.icon className={`h-5 w-5 ${plan.iconColor}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{count}</div>
                        <p className="text-xs text-muted-foreground mt-1">users</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Subscription Overview</CardTitle>
                  <CardDescription>Breakdown of user subscriptions by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['active', 'trial', 'canceled', 'past_due', 'paused'].map((status) => {
                      const count = users.filter((u) => u.subscription?.status === status).length;
                      return (
                        <div key={status} className="text-center p-4 rounded-lg bg-muted/30">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground capitalize mt-1">{status.replace('_', ' ')}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4 mt-0">
              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Platform Analytics</CardTitle>
                  <CardDescription>Usage metrics and trends</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Analytics Coming Soon</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                        Track executions, user growth, and revenue with beautiful charts and insights.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Globe className="h-4 w-4 mr-2" />
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-0">
              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Payment Gateway Integrations</CardTitle>
                  <CardDescription>Configure payment providers for your platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'bKash', description: 'Mobile financial service', color: 'from-pink-500/10 to-pink-500/5', configured: false },
                      { name: 'Nagad', description: 'Digital payment platform', color: 'from-orange-500/10 to-orange-500/5', configured: false },
                      { name: 'SSLCommerz', description: 'Payment gateway', color: 'from-blue-500/10 to-blue-500/5', configured: false },
                      { name: 'Stripe', description: 'International payments', color: 'from-violet-500/10 to-violet-500/5', configured: false },
                    ].map((gateway) => (
                      <Card 
                        key={gateway.name}
                        className={`border-0 bg-gradient-to-br ${gateway.color} hover:shadow-md transition-all cursor-pointer group`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-background/50">
                                <Activity className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">{gateway.name}</h4>
                                <p className="text-xs text-muted-foreground">{gateway.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={gateway.configured ? 'bg-success/10 text-success' : ''}>
                                {gateway.configured ? 'Connected' : 'Not Configured'}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Configure
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Additional settings coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}