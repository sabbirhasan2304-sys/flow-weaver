import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Zap, ArrowLeft, Search, RefreshCcw, Play, XCircle, 
  CheckCircle2, Clock, AlertCircle, ChevronRight, Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Execution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  input_data: any;
  output_data: any;
  workflows?: {
    name: string;
  };
}

export default function Executions() {
  const navigate = useNavigate();
  const { user, activeWorkspace, loading: authLoading } = useAuth();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (activeWorkspace) {
      fetchExecutions();
    }
  }, [user, activeWorkspace, authLoading]);

  const fetchExecutions = async () => {
    if (!activeWorkspace) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('executions')
      .select(`
        *,
        workflows!inner(name, workspace_id)
      `)
      .eq('workflows.workspace_id', activeWorkspace.id)
      .order('started_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Failed to fetch executions:', error);
      toast.error('Failed to load execution history');
    } else {
      setExecutions(data || []);
    }
    setLoading(false);
  };

  const retryExecution = async (execution: Execution) => {
    toast.success('Retrying execution...');
    // In real implementation, this would trigger a new execution
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/20 text-success">Success</Badge>;
      case 'error':
        return <Badge className="bg-destructive/20 text-destructive">Error</Badge>;
      case 'running':
        return <Badge className="bg-warning/20 text-warning">Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.workflows?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: executions.length,
    success: executions.filter(e => e.status === 'success').length,
    error: executions.filter(e => e.status === 'error').length,
    running: executions.filter(e => e.status === 'running').length,
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
              <span className="text-xl font-bold text-foreground">Execution History</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={fetchExecutions}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.success}</div>
                  <div className="text-sm text-muted-foreground">Success</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.error}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.running}</div>
                  <div className="text-sm text-muted-foreground">Running</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by workflow name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Executions List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Executions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredExecutions.length === 0 ? (
                  <div className="text-center py-20">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No executions found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredExecutions.map((execution) => (
                        <div
                          key={execution.id}
                          className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedExecution?.id === execution.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedExecution(execution)}
                        >
                          {getStatusIcon(execution.status)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {execution.workflows?.name || 'Unknown Workflow'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
                            </div>
                          </div>
                          {getStatusBadge(execution.status)}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div>
            <Card className="sticky top-24">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Execution Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedExecution ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Workflow</div>
                      <div className="font-medium">{selectedExecution.workflows?.name}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="mt-1">{getStatusBadge(selectedExecution.status)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Started</div>
                      <div className="font-medium">
                        {format(new Date(selectedExecution.started_at), 'PPpp')}
                      </div>
                    </div>
                    
                    {selectedExecution.finished_at && (
                      <div>
                        <div className="text-sm text-muted-foreground">Finished</div>
                        <div className="font-medium">
                          {format(new Date(selectedExecution.finished_at), 'PPpp')}
                        </div>
                      </div>
                    )}
                    
                    {selectedExecution.error_message && (
                      <div>
                        <div className="text-sm text-muted-foreground">Error</div>
                        <div className="mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                          {selectedExecution.error_message}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/workflow/${selectedExecution.workflow_id}`)}
                      >
                        View Workflow
                      </Button>
                      {selectedExecution.status === 'error' && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => retryExecution(selectedExecution)}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Retry Execution
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an execution to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
