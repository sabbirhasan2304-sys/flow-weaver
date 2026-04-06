import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  CreditCard, Lock, Shield, Mail, Menu,
  ArrowRight, Download, BookOpen, X
} from 'lucide-react';
import { format } from 'date-fns';
import { SystemHealthWidget } from '@/components/dashboard/SystemHealthWidget';

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
  const location = useLocation();
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
    if (authLoading || subscriptionLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Redirect to plan selection if user doesn't have an active subscription (and is not admin)
    if (!isAdmin && !hasActiveSubscription) {
      navigate('/select-plan');
      return;
    }
    
    if (activeWorkspace) {
      fetchWorkflows();
    }
  }, [user, activeWorkspace, navigate, authLoading, subscriptionLoading, isAdmin, hasActiveSubscription]);

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('biztori-onboarding-dismissed') !== 'true';
  });

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('biztori-onboarding-dismissed', 'true');
  };

  const mobileNavItems = [
    { label: 'Workflows', href: '/dashboard', icon: Folder },
    { label: 'Templates', href: '/templates', icon: Sparkles },
    { label: 'Marketplace', href: '/marketplace', icon: Store },
    { label: 'Executions', href: '/executions', icon: Clock },
    { label: 'Credentials', href: '/credentials', icon: Settings },
    { label: 'Email', href: '/email-marketing', icon: Mail },
    { label: 'Tracking', href: '/tracking', icon: FileCode },
    { label: 'Billing', href: '/billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary-foreground" />
                    </div>
                    BiztoriBD
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col px-4 pb-6">
                  {mobileNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                          isActive ? 'bg-muted text-primary font-medium' : 'text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                  {isAdmin && (
                    <>
                      <div className="h-px bg-border my-3" />
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Admin
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline">BiztoriBD</span>
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
              <Link to="/email-marketing">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </Link>
              <Link to="/tracking">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <FileCode className="h-4 w-4 mr-2" />
                  Tracking
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
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Subscription Badge */}
            <Link to="/billing" className="hidden sm:block">
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

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { icon: Folder, label: 'Workflows', href: '/dashboard' },
            { icon: Sparkles, label: 'Templates', href: '/templates' },
            { icon: Plus, label: 'Create', href: '#create' },
            { icon: Clock, label: 'History', href: '/executions' },
            { icon: Mail, label: 'Email', href: '/email-marketing' },
          ].map((tab) => {
            const isActive = tab.href !== '#create' && location.pathname === tab.href;
            const isCreate = tab.href === '#create';
            
            if (isCreate) {
              return (
                <button
                  key={tab.label}
                  onClick={() => canCreateWorkflow && setCreateDialogOpen(true)}
                  className="flex flex-col items-center gap-0.5 min-w-[56px]"
                >
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Plus className="h-5 w-5 text-primary-foreground" />
                  </div>
                </button>
              );
            }
            
            return (
              <Link
                key={tab.label}
                to={tab.href}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
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
              <Link to="/select-plan">
                <Sparkles className="h-4 w-4" />
                Choose a Plan to Create Workflows
              </Link>
            </Button>
          )}
        </div>

        {/* Quick Stats & Actions */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{workflows.length}</p>
                  <p className="text-xs text-muted-foreground">Workflows</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{workflows.filter(w => w.is_active).length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>
            <Link to="/tracking" className="contents">
              <Card className="bg-card/50 hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileCode className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">NexusTrack</p>
                    <p className="text-xs text-muted-foreground">Server tracking</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/email-marketing" className="contents">
              <Card className="bg-card/50 hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">Campaigns</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* System Health Widget */}
        {isAdmin && !loading && (
          <div className="mb-6">
            <SystemHealthWidget />
          </div>
        )}


        {showOnboarding && !loading && workflows.length === 0 && !search && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent relative overflow-hidden">
            <button onClick={dismissOnboarding} className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Welcome to BiztoriBD! 🎉
              </CardTitle>
              <CardDescription>Get started with your first automation in minutes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Create Workflow</div>
                    <div className="text-xs text-muted-foreground">Start from scratch</div>
                  </div>
                </button>
                <Link
                  to="/templates"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Browse Templates</div>
                    <div className="text-xs text-muted-foreground">Pre-built workflows</div>
                  </div>
                </Link>
                <Link
                  to="/tracking"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileCode className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Setup Tracking</div>
                    <div className="text-xs text-muted-foreground">Connect your website</div>
                  </div>
                </Link>
                <Link
                  to="/docs"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Read Docs</div>
                    <div className="text-xs text-muted-foreground">Guides & tutorials</div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mt-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
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
