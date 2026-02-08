import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Zap, Plus, Search, MoreHorizontal, 
  Play, Pause, Edit, Trash2, Copy,
  Clock, CheckCircle2, XCircle, 
  LayoutGrid, List, Filter,
  LogOut, Settings, User, ChevronDown,
  Folder, FileCode, Sparkles, Store,
  CreditCard, Lock, Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut, activeWorkspace, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const { subscription, isWithinLimits, loading: subscriptionLoading } = useSubscription();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  // Check if user has active subscription (admins bypass)
  const hasActiveSubscription = isAdmin || (subscription && 
    (subscription.status === 'active' || subscription.status === 'trial'));
  
  // Check workflow limits (admins bypass)
  const canCreateWorkflow = isAdmin || (hasActiveSubscription && isWithinLimits('workflows', workflows.length));

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (activeWorkspace) {
      fetchWorkflows();
    }
  }, [user, activeWorkspace, navigate, authLoading]);

  const fetchWorkflows = async () => {
    if (!activeWorkspace) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('workspace_id', activeWorkspace.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load workflows');
    } else {
      setWorkflows(data || []);
    }
    setLoading(false);
  };

  const createWorkflow = async () => {
    if (!activeWorkspace || !profile) return;
    
    // Check subscription before creating
    if (!canCreateWorkflow) {
      toast.error('Please subscribe to create workflows');
      navigate('/billing');
      return;
    }
    
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        name: newWorkflowName || 'Untitled Workflow',
        description: newWorkflowDescription || null,
        workspace_id: activeWorkspace.id,
        created_by: profile.id,
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to create workflow');
    } else {
      toast.success('Workflow created');
      setCreateDialogOpen(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      navigate(`/workflow/${data.id}`);
    }
  };

  const toggleWorkflowActive = async (workflow: Workflow) => {
    const { error } = await supabase
      .from('workflows')
      .update({ is_active: !workflow.is_active })
      .eq('id', workflow.id);
    
    if (error) {
      toast.error('Failed to update workflow');
    } else {
      toast.success(workflow.is_active ? 'Workflow deactivated' : 'Workflow activated');
      fetchWorkflows();
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);
    
    if (error) {
      toast.error('Failed to delete workflow');
    } else {
      toast.success('Workflow deleted');
      fetchWorkflows();
    }
  };

  const duplicateWorkflow = async (workflow: Workflow) => {
    if (!activeWorkspace || !profile) return;
    
    const { data: originalData } = await supabase
      .from('workflows')
      .select('data')
      .eq('id', workflow.id)
      .single();
    
    const { error } = await supabase
      .from('workflows')
      .insert({
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        workspace_id: activeWorkspace.id,
        created_by: profile.id,
        data: originalData?.data || { nodes: [], edges: [] },
        tags: workflow.tags,
      });
    
    if (error) {
      toast.error('Failed to duplicate workflow');
    } else {
      toast.success('Workflow duplicated');
      fetchWorkflows();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">FlowForge</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-foreground">
                <Folder className="h-4 w-4 mr-2" />
                Workflows
              </Button>
              <Link to="/templates">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Store className="h-4 w-4 mr-2" />
                  Marketplace
                </Button>
              </Link>
              <Link to="/executions">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  Executions
                </Button>
              </Link>
              <Link to="/credentials">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Settings className="h-4 w-4 mr-2" />
                  Credentials
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Subscription Badge */}
            <Link to="/billing">
              <SubscriptionBadge />
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <span className="hidden md:inline">{profile?.full_name || profile?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile?.full_name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {profile?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Plans
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your automation workflows
            </p>
          </div>
          
          {hasActiveSubscription ? (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canCreateWorkflow}>
                  {canCreateWorkflow ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      New Workflow
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Workflow Limit Reached
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workflow</DialogTitle>
                  <DialogDescription>
                    Give your workflow a name and optional description
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-name">Name</Label>
                    <Input
                      id="workflow-name"
                      placeholder="My Awesome Workflow"
                      value={newWorkflowName}
                      onChange={(e) => setNewWorkflowName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workflow-description">Description (optional)</Label>
                    <Textarea
                      id="workflow-description"
                      placeholder="What does this workflow do?"
                      value={newWorkflowDescription}
                      onChange={(e) => setNewWorkflowDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWorkflow}>
                    Create Workflow
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button asChild className="gap-2">
              <Link to="/billing">
                <Sparkles className="h-4 w-4" />
                Subscribe to Create Workflows
              </Link>
            </Button>
          )}
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Workflows Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading workflows...</p>
            </div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileCode className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {search ? 'No workflows found' : 'No workflows yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search 
                ? 'Try a different search term' 
                : 'Create your first workflow to get started'
              }
            </p>
            {!search && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => (
              <Card 
                key={workflow.id} 
                className="group hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/workflow/${workflow.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {workflow.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {workflow.description || 'No description'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workflow/${workflow.id}`);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          duplicateWorkflow(workflow);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          toggleWorkflowActive(workflow);
                        }}>
                          {workflow.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWorkflow(workflow.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {workflow.is_active ? (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(workflow.updated_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorkflows.map((workflow) => (
              <Card 
                key={workflow.id} 
                className="group hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/workflow/${workflow.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{workflow.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {workflow.description || 'No description'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {workflow.is_active ? (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(workflow.updated_at), 'MMM d, yyyy')}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workflow/${workflow.id}`);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          duplicateWorkflow(workflow);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWorkflow(workflow.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
