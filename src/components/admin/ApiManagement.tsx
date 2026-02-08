import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, Activity, Search, RefreshCw, Trash2, 
  Eye, CheckCircle2, XCircle, TrendingUp, Code,
  Clock, Globe, ArrowUpRight, BarChart3, Users,
  Settings, Shield, AlertTriangle, Edit, Copy,
  Download, Filter, Calendar, Zap, Lock, Unlock
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[] | unknown;
  rate_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  profile_id: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
}

interface ApiUsageLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
  api_key_id: string;
}

interface UserApiStats {
  profileId: string;
  email: string;
  fullName: string | null;
  totalKeys: number;
  activeKeys: number;
  totalRequests: number;
  successRate: number;
  lastActivity: string | null;
  avgResponseTime: number;
}

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsToday: number;
  uniqueEndpoints: number;
  totalUsers: number;
  activeUsers: number;
}

export function ApiManagement() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageLogs, setUsageLogs] = useState<ApiUsageLog[]>([]);
  const [userStats, setUserStats] = useState<UserApiStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [selectedUser, setSelectedUser] = useState<UserApiStats | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [editRateLimit, setEditRateLimit] = useState(1000);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [stats, setStats] = useState<UsageStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    requestsToday: 0,
    uniqueEndpoints: 0,
    totalUsers: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all API keys with profile info
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (keysError) throw keysError;

      // Fetch profiles for each key
      const keysWithProfiles = await Promise.all(
        (keysData || []).map(async (key) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', key.profile_id)
            .single();
          return { ...key, profile };
        })
      );

      setApiKeys(keysWithProfiles);

      // Fetch usage logs
      const { data: logsData, error: logsError } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;
      setUsageLogs(logsData || []);

      // Calculate user-level stats
      const userStatsMap = new Map<string, UserApiStats>();
      
      for (const key of keysWithProfiles) {
        const profileId = key.profile_id;
        if (!userStatsMap.has(profileId)) {
          userStatsMap.set(profileId, {
            profileId,
            email: key.profile?.email || 'Unknown',
            fullName: key.profile?.full_name || null,
            totalKeys: 0,
            activeKeys: 0,
            totalRequests: 0,
            successRate: 0,
            lastActivity: null,
            avgResponseTime: 0,
          });
        }
        
        const userStat = userStatsMap.get(profileId)!;
        userStat.totalKeys++;
        if (key.is_active) userStat.activeKeys++;
        if (key.last_used_at) {
          if (!userStat.lastActivity || new Date(key.last_used_at) > new Date(userStat.lastActivity)) {
            userStat.lastActivity = key.last_used_at;
          }
        }
      }

      // Calculate request stats per user
      const keyToProfile = new Map<string, string>();
      keysWithProfiles.forEach(key => keyToProfile.set(key.id, key.profile_id));

      const userRequestStats = new Map<string, { total: number; success: number; totalTime: number }>();
      
      for (const log of logsData || []) {
        const profileId = keyToProfile.get(log.api_key_id);
        if (profileId) {
          if (!userRequestStats.has(profileId)) {
            userRequestStats.set(profileId, { total: 0, success: 0, totalTime: 0 });
          }
          const stats = userRequestStats.get(profileId)!;
          stats.total++;
          if (log.status_code >= 200 && log.status_code < 300) stats.success++;
          stats.totalTime += log.response_time_ms || 0;
        }
      }

      userRequestStats.forEach((reqStats, profileId) => {
        const userStat = userStatsMap.get(profileId);
        if (userStat) {
          userStat.totalRequests = reqStats.total;
          userStat.successRate = reqStats.total > 0 ? (reqStats.success / reqStats.total) * 100 : 0;
          userStat.avgResponseTime = reqStats.total > 0 ? Math.round(reqStats.totalTime / reqStats.total) : 0;
        }
      });

      setUserStats(Array.from(userStatsMap.values()).sort((a, b) => b.totalRequests - a.totalRequests));

      // Calculate global stats
      const logs = logsData || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const successLogs = logs.filter(l => l.status_code >= 200 && l.status_code < 300);
      const failedLogs = logs.filter(l => l.status_code >= 400);
      const todayLogs = logs.filter(l => new Date(l.created_at) >= today);
      const endpoints = new Set(logs.map(l => l.endpoint));
      const avgTime = logs.length > 0 
        ? logs.reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / logs.length 
        : 0;

      const usersWithKeys = new Set(keysWithProfiles.map(k => k.profile_id));
      const usersWithActivity = new Set(
        keysWithProfiles.filter(k => k.last_used_at).map(k => k.profile_id)
      );

      setStats({
        totalRequests: logs.length,
        successfulRequests: successLogs.length,
        failedRequests: failedLogs.length,
        avgResponseTime: Math.round(avgTime),
        requestsToday: todayLogs.length,
        uniqueEndpoints: endpoints.size,
        totalUsers: usersWithKeys.size,
        activeUsers: usersWithActivity.size,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId);

      if (error) throw error;
      fetchData();

      toast({
        title: isActive ? "Key Disabled" : "Key Enabled",
        description: `API key has been ${isActive ? 'disabled' : 'enabled'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
      fetchData();

      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (key: ApiKey) => {
    setSelectedKey(key);
    setEditRateLimit(key.rate_limit);
    setEditPermissions(Array.isArray(key.permissions) ? key.permissions : ['read']);
    setEditDialogOpen(true);
  };

  const saveKeyChanges = async () => {
    if (!selectedKey) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          rate_limit: editRateLimit,
          permissions: editPermissions,
        })
        .eq('id', selectedKey.id);

      if (error) throw error;

      setEditDialogOpen(false);
      fetchData();

      toast({
        title: "Key Updated",
        description: "API key settings have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disableAllUserKeys = async (profileId: string) => {
    if (!confirm("Are you sure you want to disable ALL API keys for this user?")) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('profile_id', profileId);

      if (error) throw error;
      fetchData();
      setUserDetailsOpen(false);

      toast({
        title: "Keys Disabled",
        description: "All API keys for this user have been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const enableAllUserKeys = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: true })
        .eq('profile_id', profileId);

      if (error) throw error;
      fetchData();
      setUserDetailsOpen(false);

      toast({
        title: "Keys Enabled",
        description: "All API keys for this user have been enabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAllUserKeys = async (profileId: string) => {
    if (!confirm("Are you sure you want to DELETE ALL API keys for this user? This action cannot be undone!")) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('profile_id', profileId);

      if (error) throw error;
      fetchData();
      setUserDetailsOpen(false);

      toast({
        title: "Keys Deleted",
        description: "All API keys for this user have been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportLogsAsCsv = () => {
    const headers = ['Timestamp', 'Method', 'Endpoint', 'Status', 'Response Time (ms)', 'IP Address', 'User Agent'];
    const rows = usageLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.method,
      log.endpoint,
      log.status_code,
      log.response_time_ms,
      log.ip_address || '',
      log.user_agent || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredKeys = apiKeys.filter((key) => {
    const matchesSearch = 
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.profile?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && key.is_active) ||
      (statusFilter === 'disabled' && !key.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const getUserKeys = (profileId: string) => {
    return apiKeys.filter(k => k.profile_id === profileId);
  };

  const getUserLogs = (profileId: string) => {
    const userKeyIds = apiKeys.filter(k => k.profile_id === profileId).map(k => k.id);
    return usageLogs.filter(log => userKeyIds.includes(log.api_key_id));
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-primary/10 text-primary';
      case 'POST': return 'bg-emerald-500/10 text-emerald-600';
      case 'PUT': return 'bg-amber-500/10 text-amber-600';
      case 'DELETE': return 'bg-rose-500/10 text-rose-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-emerald-500';
    if (code >= 400 && code < 500) return 'text-amber-500';
    return 'text-rose-500';
  };

  const statCards = [
    { label: 'Total Requests', value: stats.totalRequests, icon: Activity, color: 'text-blue-500' },
    { label: 'Requests Today', value: stats.requestsToday, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Success Rate', value: `${stats.totalRequests > 0 ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) : 0}%`, icon: CheckCircle2, color: 'text-violet-500' },
    { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, icon: Clock, color: 'text-amber-500' },
    { label: 'API Users', value: stats.totalUsers, icon: Users, color: 'text-cyan-500' },
    { label: 'Active Users', value: stats.activeUsers, icon: Zap, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="border shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            API Users
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            All Keys
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Request Logs
          </TabsTrigger>
        </TabsList>

        {/* API Users Tab */}
        <TabsContent value="users">
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>API Users Overview</CardTitle>
                    <CardDescription>Users with API keys and their usage statistics</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>User</TableHead>
                      <TableHead>API Keys</TableHead>
                      <TableHead>Total Requests</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : userStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No API users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      userStats.map((user) => (
                        <TableRow key={user.profileId} className="hover:bg-muted/30">
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.fullName || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                                {user.activeKeys} active
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                / {user.totalKeys} total
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.totalRequests.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={user.successRate} 
                                className="w-16 h-2"
                              />
                              <span className={`text-sm ${user.successRate >= 90 ? 'text-emerald-500' : user.successRate >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                                {Math.round(user.successRate)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">{user.avgResponseTime}ms</span>
                          </TableCell>
                          <TableCell>
                            {user.lastActivity 
                              ? format(new Date(user.lastActivity), 'MMM d, HH:mm')
                              : <span className="text-muted-foreground text-xs">Never</span>
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUserDetailsOpen(true);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => disableAllUserKeys(user.profileId)}
                                title="Disable All Keys"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* All Keys Tab */}
        <TabsContent value="keys">
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>All API Keys</CardTitle>
                    <CardDescription>Manage API keys across all users</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-56"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Name</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Key Prefix</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No API keys found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKeys.map((key) => (
                        <TableRow key={key.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{key.profile?.full_name || 'Unknown'}</div>
                              <div className="text-muted-foreground text-xs">{key.profile?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{key.key_prefix}...</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {(Array.isArray(key.permissions) ? key.permissions : []).map((perm: string) => (
                                <Badge key={perm} variant="secondary" className="text-[10px]">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{key.rate_limit}/hr</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={key.is_active 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              }
                            >
                              {key.is_active ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              {key.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {key.last_used_at 
                              ? format(new Date(key.last_used_at), 'MMM d, HH:mm')
                              : <span className="text-muted-foreground text-xs">Never</span>
                            }
                          </TableCell>
                          <TableCell>
                            {key.expires_at 
                              ? <span className={new Date(key.expires_at) < new Date() ? 'text-rose-500' : ''}>
                                  {format(new Date(key.expires_at), 'MMM d, yyyy')}
                                </span>
                              : <span className="text-muted-foreground text-xs">Never</span>
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(key)}
                                title="Edit Settings"
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleKeyStatus(key.id, key.is_active)}
                                title={key.is_active ? "Disable" : "Enable"}
                                className="h-8 w-8"
                              >
                                {key.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteApiKey(key.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Request Logs Tab */}
        <TabsContent value="logs">
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>API Request Logs</CardTitle>
                    <CardDescription>Recent API requests across all keys</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportLogsAsCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No API calls recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      usageLogs.slice(0, 200).map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getMethodColor(log.method)}>
                              {log.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">
                            {log.endpoint}
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${getStatusColor(log.status_code)}`}>
                              {log.status_code}
                            </span>
                          </TableCell>
                          <TableCell>{log.response_time_ms}ms</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {log.ip_address || 'unknown'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">
                            {log.user_agent || 'unknown'}
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
      </Tabs>

      {/* Edit Key Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key Settings</DialogTitle>
            <DialogDescription>
              Modify rate limits and permissions for this API key
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input value={selectedKey?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Input value={selectedKey?.profile?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Rate Limit (requests per hour)</Label>
              <Input 
                type="number" 
                value={editRateLimit} 
                onChange={(e) => setEditRateLimit(parseInt(e.target.value) || 1000)}
                min={1}
                max={100000}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex gap-2 flex-wrap">
                {['read', 'write', 'execute'].map((perm) => (
                  <Button
                    key={perm}
                    type="button"
                    variant={editPermissions.includes(perm) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (editPermissions.includes(perm)) {
                        setEditPermissions(editPermissions.filter(p => p !== perm));
                      } else {
                        setEditPermissions([...editPermissions, perm]);
                      }
                    }}
                  >
                    {perm}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveKeyChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User API Details</DialogTitle>
            <DialogDescription>
              {selectedUser?.fullName || 'Unknown'} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{selectedUser.totalKeys}</div>
                    <div className="text-xs text-muted-foreground">Total Keys</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-500">{selectedUser.activeKeys}</div>
                    <div className="text-xs text-muted-foreground">Active Keys</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{selectedUser.totalRequests.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Requests</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{Math.round(selectedUser.successRate)}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </CardContent>
                </Card>
              </div>

              {/* User's Keys */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Keys ({getUserKeys(selectedUser.profileId).length})
                </h4>
                <div className="space-y-2">
                  {getUserKeys(selectedUser.profileId).map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={key.is_active 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : 'bg-rose-500/10 text-rose-600'
                          }
                        >
                          {key.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                        <div>
                          <div className="font-medium">{key.name}</div>
                          <code className="text-xs text-muted-foreground">{key.key_prefix}...</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {key.rate_limit}/hr
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleKeyStatus(key.id, key.is_active)}
                        >
                          {key.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity ({getUserLogs(selectedUser.profileId).length} requests)
                </h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {getUserLogs(selectedUser.profileId).slice(0, 20).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getMethodColor(log.method)}>
                            {log.method}
                          </Badge>
                          <span className="font-mono text-xs">{log.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          <span className={getStatusColor(log.status_code)}>{log.status_code}</span>
                          <span>{log.response_time_ms}ms</span>
                          <span>{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                        </div>
                      </div>
                    ))}
                    {getUserLogs(selectedUser.profileId).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No API activity recorded
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => enableAllUserKeys(selectedUser.profileId)}
                  className="flex-1"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Enable All Keys
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => disableAllUserKeys(selectedUser.profileId)}
                  className="flex-1"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Disable All Keys
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteAllUserKeys(selectedUser.profileId)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
