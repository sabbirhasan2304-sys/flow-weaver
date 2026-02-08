import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartConfig
} from '@/components/ui/chart';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Activity, Zap, Users, Clock, 
  CheckCircle2, XCircle, Loader2, PlayCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
  Calendar, Workflow, Sparkles, Globe, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay, subHours } from 'date-fns';

interface ExecutionData {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  triggered_by: string | null;
}

interface DailyStats {
  date: string;
  executions: number;
  successful: number;
  failed: number;
}

interface HourlyStats {
  hour: string;
  executions: number;
}

interface WorkflowStats {
  workflow_id: string;
  workflow_name: string;
  executions: number;
  success_rate: number;
}

const chartConfig: ChartConfig = {
  executions: { label: 'Executions', color: 'hsl(var(--primary))' },
  successful: { label: 'Successful', color: 'hsl(142.1 76.2% 36.3%)' },
  failed: { label: 'Failed', color: 'hsl(346.8 77.2% 49.8%)' },
};

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function ActiveAnalytics() {
  const [recentExecutions, setRecentExecutions] = useState<ExecutionData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [topWorkflows, setTopWorkflows] = useState<WorkflowStats[]>([]);
  const [liveStats, setLiveStats] = useState({
    activeNow: 0,
    todayExecutions: 0,
    successRate: 0,
    avgDuration: 0,
    pendingExecutions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');

  useEffect(() => {
    fetchAnalytics();
    
    // Set up real-time subscription for executions
    const channel = supabase
      .channel('admin-analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'executions' },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch recent executions with workflow names
      const { data: execData } = await supabase
        .from('executions')
        .select('id, workflow_id, status, started_at, finished_at, triggered_by')
        .order('started_at', { ascending: false })
        .limit(50);

      if (execData) {
        // Get workflow names
        const workflowIds = [...new Set(execData.map(e => e.workflow_id))];
        const { data: workflows } = await supabase
          .from('workflows')
          .select('id, name')
          .in('id', workflowIds);

        const workflowMap = new Map(workflows?.map(w => [w.id, w.name]) || []);
        
        const enrichedExecs = execData.map(e => ({
          ...e,
          workflow_name: workflowMap.get(e.workflow_id) || 'Unknown Workflow',
        }));
        
        setRecentExecutions(enrichedExecs);
      }

      // Calculate daily stats for last 7 days
      const last7Days: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { data: dayExecs } = await supabase
          .from('executions')
          .select('status')
          .gte('started_at', dayStart)
          .lte('started_at', dayEnd);

        last7Days.push({
          date: format(date, 'EEE'),
          executions: dayExecs?.length || 0,
          successful: dayExecs?.filter(e => e.status === 'completed').length || 0,
          failed: dayExecs?.filter(e => e.status === 'failed').length || 0,
        });
      }
      setDailyStats(last7Days);

      // Calculate hourly stats for last 24 hours
      const hourlyData: HourlyStats[] = [];
      for (let i = 23; i >= 0; i--) {
        const hourStart = subHours(new Date(), i);
        const hourEnd = subHours(new Date(), i - 1);

        const { data: hourExecs } = await supabase
          .from('executions')
          .select('id')
          .gte('started_at', hourStart.toISOString())
          .lt('started_at', hourEnd.toISOString());

        hourlyData.push({
          hour: format(hourStart, 'HH:mm'),
          executions: hourExecs?.length || 0,
        });
      }
      setHourlyStats(hourlyData);

      // Calculate top workflows
      const { data: allExecs } = await supabase
        .from('executions')
        .select('workflow_id, status')
        .gte('started_at', subDays(new Date(), 30).toISOString());

      if (allExecs) {
        const workflowStats = new Map<string, { total: number; successful: number }>();
        
        allExecs.forEach(e => {
          const current = workflowStats.get(e.workflow_id) || { total: 0, successful: 0 };
          current.total++;
          if (e.status === 'completed') current.successful++;
          workflowStats.set(e.workflow_id, current);
        });

        const { data: wfNames } = await supabase
          .from('workflows')
          .select('id, name')
          .in('id', Array.from(workflowStats.keys()));

        const nameMap = new Map(wfNames?.map(w => [w.id, w.name]) || []);

        const topWfs: WorkflowStats[] = Array.from(workflowStats.entries())
          .map(([id, stats]) => ({
            workflow_id: id,
            workflow_name: nameMap.get(id) || 'Unknown',
            executions: stats.total,
            success_rate: Math.round((stats.successful / stats.total) * 100),
          }))
          .sort((a, b) => b.executions - a.executions)
          .slice(0, 5);

        setTopWorkflows(topWfs);
      }

      // Calculate live stats
      const today = startOfDay(new Date()).toISOString();
      const { data: todayExecs } = await supabase
        .from('executions')
        .select('status, started_at, finished_at')
        .gte('started_at', today);

      const { data: runningExecs } = await supabase
        .from('executions')
        .select('id')
        .eq('status', 'running');

      const { data: pendingExecs } = await supabase
        .from('executions')
        .select('id')
        .eq('status', 'pending');

      const completedToday = todayExecs?.filter(e => e.status === 'completed') || [];
      const avgDuration = completedToday.length > 0
        ? completedToday.reduce((acc, e) => {
            if (e.finished_at && e.started_at) {
              return acc + (new Date(e.finished_at).getTime() - new Date(e.started_at).getTime());
            }
            return acc;
          }, 0) / completedToday.length / 1000
        : 0;

      setLiveStats({
        activeNow: runningExecs?.length || 0,
        todayExecutions: todayExecs?.length || 0,
        successRate: todayExecs?.length 
          ? Math.round((completedToday.length / todayExecs.length) * 100) 
          : 0,
        avgDuration: Math.round(avgDuration),
        pendingExecutions: pendingExecs?.length || 0,
      });

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <PlayCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      running: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    };
    return (
      <Badge variant="outline" className={`gap-1.5 ${config[status] || ''}`}>
        {getStatusIcon(status)}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const pieData = topWorkflows.map((wf, i) => ({
    name: wf.workflow_name,
    value: wf.executions,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Live Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { 
            label: 'Active Now', 
            value: liveStats.activeNow, 
            icon: Activity, 
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            pulse: liveStats.activeNow > 0,
          },
          { 
            label: 'Today\'s Executions', 
            value: liveStats.todayExecutions, 
            icon: Zap, 
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          { 
            label: 'Success Rate', 
            value: `${liveStats.successRate}%`, 
            icon: CheckCircle2, 
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          { 
            label: 'Avg Duration', 
            value: `${liveStats.avgDuration}s`, 
            icon: Timer, 
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
          { 
            label: 'Pending', 
            value: liveStats.pendingExecutions, 
            icon: Clock, 
            color: 'text-violet-500',
            bg: 'bg-violet-500/10',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border shadow-sm hover:shadow-md transition-all ${stat.bg} border-transparent`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg} relative`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    {stat.pulse && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Execution Trends
                </CardTitle>
                <CardDescription>Last 7 days activity</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Button 
                  variant={chartType === 'area' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setChartType('area')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={chartType === 'bar' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={chartType === 'line' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setChartType('line')}
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              {chartType === 'area' ? (
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="fillSuccessful" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(346.8 77.2% 49.8%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(346.8 77.2% 49.8%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="hsl(142.1 76.2% 36.3%)" 
                    fill="url(#fillSuccessful)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(346.8 77.2% 49.8%)" 
                    fill="url(#fillFailed)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="successful" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="hsl(346.8 77.2% 49.8%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="hsl(142.1 76.2% 36.3%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142.1 76.2% 36.3%)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(346.8 77.2% 49.8%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(346.8 77.2% 49.8%)' }}
                  />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Workflows Pie */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              Top Workflows
            </CardTitle>
            <CardDescription>By execution count (30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {topWorkflows.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {topWorkflows.slice(0, 3).map((wf, i) => (
                    <div key={wf.workflow_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="truncate max-w-[120px]">{wf.workflow_name}</span>
                      </div>
                      <span className="font-medium">{wf.executions}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No workflow data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity & Recent Executions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Activity */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              24-Hour Activity
            </CardTitle>
            <CardDescription>Executions per hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="hour" 
                  className="text-xs" 
                  tickFormatter={(value) => value.split(':')[0]}
                />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="executions" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Executions Feed */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Activity
                </CardTitle>
                <CardDescription>Real-time execution feed</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchAnalytics}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[220px]">
              <div className="space-y-1 p-4 pt-0">
                {recentExecutions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent executions
                  </div>
                ) : (
                  recentExecutions.slice(0, 10).map((exec, i) => (
                    <motion.div
                      key={exec.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getStatusIcon(exec.status)}
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {exec.workflow_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(exec.started_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(exec.status)}
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Performance Table */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Workflow Performance
          </CardTitle>
          <CardDescription>Detailed metrics for your top workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topWorkflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No workflow data available
              </div>
            ) : (
              topWorkflows.map((wf, i) => (
                <motion.div
                  key={wf.workflow_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-lg font-bold text-muted-foreground w-6">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{wf.workflow_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {wf.executions} executions
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{wf.success_rate}%</div>
                      <div className="text-xs text-muted-foreground">success</div>
                    </div>
                    <div className="w-24">
                      <Progress 
                        value={wf.success_rate} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
