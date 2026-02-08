import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Search, Filter, Eye, Mail, UserCog, Shield, 
  Coins, CreditCard, MoreHorizontal, Pencil, Trash2,
  CheckCircle2, XCircle, Clock, Crown, Zap, Sparkles,
  Plus, Minus, AlertTriangle, UserX, UserCheck, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface UserData {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  subscription?: {
    id: string;
    plan_id: string;
    plan_name: string;
    status: string;
  };
  credits?: {
    balance: number;
    total_purchased: number;
    total_used: number;
  };
  role?: 'admin' | 'user';
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });
  const [creditsAmount, setCreditsAmount] = useState('');
  const [creditsAction, setCreditsAction] = useState<'add' | 'remove'>('add');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newPlanId, setNewPlanId] = useState('');

  useEffect(() => {
    fetchEnhancedUsers();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('id, name, price_monthly').order('sort_order');
    if (data) setPlans(data);
  };

  const fetchEnhancedUsers = async () => {
    setIsRefreshing(true);
    try {
      // Fetch profiles with subscriptions
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch users');
        return;
      }

      if (!profilesData) {
        setUsers([]);
        return;
      }

      const enhancedUsers = await Promise.all(
        profilesData.map(async (profile) => {
          // Get subscription - use maybeSingle() to avoid 406 errors
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('id, plan_id, status, plan:plans(name)')
            .eq('profile_id', profile.id)
            .maybeSingle();

          // Get credits - use maybeSingle() to avoid 406 errors
          const { data: creditsData } = await supabase
            .from('user_credits')
            .select('balance, total_purchased, total_used')
            .eq('profile_id', profile.id)
            .maybeSingle();

          // Get role - use maybeSingle() to avoid 406 errors
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          return {
            ...profile,
            subscription: subData ? {
              id: subData.id,
              plan_id: subData.plan_id,
              plan_name: (subData.plan as { name: string } | null)?.name || 'Unknown',
              status: subData.status,
            } : undefined,
            credits: creditsData ? {
              balance: Number(creditsData.balance),
              total_purchased: Number(creditsData.total_purchased),
              total_used: Number(creditsData.total_used),
            } : { balance: 0, total_purchased: 0, total_used: 0 },
            role: (roleData?.role as 'admin' | 'user') || 'user',
          };
        })
      );

      setUsers(enhancedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesPlan = filterPlan === 'all' || u.subscription?.plan_name === filterPlan;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({ full_name: user.full_name || '', email: user.email });
    setIsEditDialogOpen(true);
  };

  const handleManageCredits = (user: UserData) => {
    setSelectedUser(user);
    setCreditsAmount('');
    setCreditsAction('add');
    setIsCreditsDialogOpen(true);
  };

  const handleManageRole = (user: UserData) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setIsRoleDialogOpen(true);
  };

  const handleManageSubscription = (user: UserData) => {
    setSelectedUser(user);
    setNewPlanId(user.subscription?.plan_id || '');
    setIsSubscriptionDialogOpen(true);
  };

  const handleDeleteUser = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      // Delete user's related data in order (respecting foreign keys)
      // 1. Delete credit transactions
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('profile_id', selectedUser.id);

      // 2. Delete user credits
      await supabase
        .from('user_credits')
        .delete()
        .eq('profile_id', selectedUser.id);

      // 3. Delete subscriptions
      await supabase
        .from('subscriptions')
        .delete()
        .eq('profile_id', selectedUser.id);

      // 4. Delete usage tracking
      await supabase
        .from('usage_tracking')
        .delete()
        .eq('profile_id', selectedUser.id);

      // 5. Delete workflow shares
      await supabase
        .from('workflow_shares')
        .delete()
        .eq('profile_id', selectedUser.id);

      // 6. Delete workspace members
      await supabase
        .from('workspace_members')
        .delete()
        .eq('profile_id', selectedUser.id);

      // 7. Delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      // 8. Delete profile (this should cascade to auth.users via trigger if set up)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`User ${selectedUser.email} has been removed`);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchEnhancedUsers();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to remove user. Some data may have been deleted.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserProfile = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editForm.full_name })
        .eq('id', selectedUser.id);

      if (error) throw error;
      toast.success('User profile updated');
      setIsEditDialogOpen(false);
      fetchEnhancedUsers();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredits = async () => {
    if (!selectedUser || !creditsAmount) return;
    setIsLoading(true);
    try {
      const amount = parseFloat(creditsAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Invalid amount');
        return;
      }

      if (creditsAction === 'add') {
        const { error } = await supabase.rpc('add_credits', {
          p_profile_id: selectedUser.id,
          p_amount: amount,
          p_type: 'bonus',
          p_description: 'Admin credit adjustment',
        });
        if (error) throw error;
        toast.success(`Added ${amount} credits to ${selectedUser.email}`);
      } else {
        const { error } = await supabase.rpc('deduct_credits', {
          p_profile_id: selectedUser.id,
          p_amount: amount,
          p_description: 'Admin credit adjustment',
        });
        if (error) throw error;
        toast.success(`Removed ${amount} credits from ${selectedUser.email}`);
      }

      setIsCreditsDialogOpen(false);
      fetchEnhancedUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update credits');
    } finally {
      setIsLoading(false);
    }
  };

  const saveRole = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      // Update or insert role
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedUser.user_id,
          role: newRole,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success(`Role updated to ${newRole}`);
      setIsRoleDialogOpen(false);
      fetchEnhancedUsers();
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSubscription = async () => {
    if (!selectedUser || !newPlanId) return;
    setIsLoading(true);
    try {
      if (selectedUser.subscription?.id) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            plan_id: newPlanId,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedUser.subscription.id);
        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            profile_id: selectedUser.id,
            plan_id: newPlanId,
            status: 'active',
          });
        if (error) throw error;
      }

      toast.success('Subscription updated');
      setIsSubscriptionDialogOpen(false);
      fetchEnhancedUsers();
    } catch (error) {
      toast.error('Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

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

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        User
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 bg-background"
                />
              </div>
              <Select value={filterRole} onValueChange={(v: any) => setFilterRole(v)}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchEnhancedUsers} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead className="w-[280px] font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Credits</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 opacity-50" />
                        <span>No users found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="group hover:bg-muted/50 border-b border-border/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary font-semibold text-sm">
                              {(u.full_name || u.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{u.full_name || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role || 'user')}</TableCell>
                      <TableCell>{getPlanBadge(u.subscription?.plan_name)}</TableCell>
                      <TableCell>
                        {u.subscription ? getStatusBadge(u.subscription.status) : (
                          <Badge variant="outline" className="text-muted-foreground">—</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-medium">{u.credits?.balance?.toFixed(0) || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewUser(u)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(u)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleManageRole(u)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageCredits(u)}>
                              <Coins className="h-4 w-4 mr-2" />
                              Manage Credits
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageSubscription(u)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Change Plan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(u)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary text-xl font-bold">
                    {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.full_name || 'No name'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    {getRoleBadge(selectedUser.role || 'user')}
                    {getPlanBadge(selectedUser.subscription?.plan_name)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1">
                    {selectedUser.subscription ? getStatusBadge(selectedUser.subscription.status) : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">AI Credits</div>
                  <div className="text-xl font-bold text-amber-500 flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {selectedUser.credits?.balance?.toFixed(0) || 0}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Total Purchased</div>
                  <div className="font-medium">{selectedUser.credits?.total_purchased?.toFixed(0) || 0} credits</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Total Used</div>
                  <div className="font-medium">{selectedUser.credits?.total_used?.toFixed(0) || 0} credits</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Joined</div>
                <div className="font-medium">
                  {new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit User Profile
            </DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveUserProfile} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Credits Dialog */}
      <Dialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Manage Credits
            </DialogTitle>
            <DialogDescription>
              Add or remove credits for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-sm text-muted-foreground">Current Balance</div>
              <div className="text-3xl font-bold text-amber-500">
                {selectedUser?.credits?.balance?.toFixed(0) || 0} credits
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={creditsAction === 'add' ? 'default' : 'outline'}
                onClick={() => setCreditsAction('add')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button
                variant={creditsAction === 'remove' ? 'destructive' : 'outline'}
                onClick={() => setCreditsAction('remove')}
                className="flex-1"
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                placeholder="Enter credit amount"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreditsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveCredits} 
              disabled={isLoading || !creditsAmount}
              variant={creditsAction === 'remove' ? 'destructive' : 'default'}
            >
              {isLoading ? 'Processing...' : creditsAction === 'add' ? 'Add Credits' : 'Remove Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Manage Role
            </DialogTitle>
            <DialogDescription>
              Change role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">Current Role</div>
              {getRoleBadge(selectedUser?.role || 'user')}
            </div>
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      User
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-rose-500" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRole === 'admin' && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm">
                <AlertTriangle className="h-4 w-4 inline mr-2 text-rose-500" />
                Admins have full access to manage users, plans, and platform settings.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRole} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Subscription Dialog */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Change Subscription
            </DialogTitle>
            <DialogDescription>
              Update subscription for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">Current Plan</div>
              {getPlanBadge(selectedUser?.subscription?.plan_name)}
            </div>
            <div className="space-y-2">
              <Label>New Plan</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{plan.name}</span>
                        <span className="text-muted-foreground">
                          {plan.price_monthly === 0 ? 'Free' : `৳${plan.price_monthly}/mo`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSubscription} disabled={isLoading || !newPlanId}>
              {isLoading ? 'Updating...' : 'Update Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Remove User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-destructive/20">
                    <AvatarFallback className="bg-destructive/10 text-destructive font-semibold">
                      {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedUser.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  The following data will be deleted:
                </p>
                <ul className="ml-6 list-disc text-xs space-y-1">
                  <li>User profile and account</li>
                  <li>All subscriptions and billing history</li>
                  <li>AI credits and transaction history</li>
                  <li>Workspace memberships</li>
                  <li>Workflow access permissions</li>
                  <li>Usage tracking data</li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
