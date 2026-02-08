import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, Activity, Search, RefreshCw, Trash2, 
  Eye, CheckCircle2, XCircle, TrendingUp, Code,
  Clock, Globe, ArrowUpRight, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
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
  created_at: string;
  api_key_id: string;
}

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsToday: number;
  uniqueEndpoints: number;
}

export function ApiManagement() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageLogs, setUsageLogs] = useState<ApiUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<UsageStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    requestsToday: 0,
    uniqueEndpoints: 0,
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
        .limit(500);

      if (logsError) throw logsError;
      setUsageLogs(logsData || []);

      // Calculate stats
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

      setStats({
        totalRequests: logs.length,
        successfulRequests: successLogs.length,
        failedRequests: failedLogs.length,
        avgResponseTime: Math.round(avgTime),
        requestsToday: todayLogs.length,
        uniqueEndpoints: endpoints.size,
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
    if (!confirm("Are you sure you want to delete this API key?")) return;

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

  const filteredKeys = apiKeys.filter(
    (key) =>
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.profile?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    { label: 'Total Requests', value: stats.totalRequests, icon: Activity, color: 'blue' },
    { label: 'Requests Today', value: stats.requestsToday, icon: TrendingUp, color: 'emerald' },
    { label: 'Success Rate', value: `${stats.totalRequests > 0 ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) : 0}%`, icon: CheckCircle2, color: 'violet' },
    { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, icon: Clock, color: 'amber' },
    { label: 'Active Keys', value: apiKeys.filter(k => k.is_active).length, icon: Key, color: 'cyan' },
    { label: 'Unique Endpoints', value: stats.uniqueEndpoints, icon: Globe, color: 'rose' },
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
                  <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
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

      {/* API Keys Table */}
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
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        <div className="flex items-center gap-1">
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

      {/* Recent API Calls */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Recent API Calls</CardTitle>
              <CardDescription>Latest API requests across all keys</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No API calls recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  usageLogs.slice(0, 100).map((log) => (
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
