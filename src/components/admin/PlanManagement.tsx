import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Crown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: unknown;
  limits: unknown;
  is_active: boolean;
  sort_order: number;
}

const defaultLimits = {
  workflows_limit: 5,
  executions_per_month: 100,
  ai_credits: 0,
  team_members: 1,
  custom_nodes: false,
};

export function PlanManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'BDT',
    is_active: true,
    sort_order: 0,
    workflows_limit: 5,
    executions_per_month: 100,
    ai_credits: 0,
    team_members: 1,
    custom_nodes: false,
    features: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans((data || []) as Plan[]);
    } catch (err) {
      toast.error('Failed to fetch plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedPlan(null);
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      currency: 'BDT',
      is_active: true,
      sort_order: plans.length,
      workflows_limit: 5,
      executions_per_month: 100,
      ai_credits: 0,
      team_members: 1,
      custom_nodes: false,
      features: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    const limits = (plan.limits as typeof defaultLimits) || defaultLimits;
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
      workflows_limit: limits.workflows_limit || 5,
      executions_per_month: limits.executions_per_month || 100,
      ai_credits: limits.ai_credits || 0,
      team_members: limits.team_members || 1,
      custom_nodes: limits.custom_nodes || false,
      features: JSON.stringify(plan.features || {}, null, 2),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Plan name is required');
      return;
    }

    setSaving(true);
    try {
      let featuresJson = {};
      if (formData.features.trim()) {
        try {
          featuresJson = JSON.parse(formData.features);
        } catch {
          toast.error('Invalid features JSON');
          setSaving(false);
          return;
        }
      }

      const planData = {
        name: formData.name,
        description: formData.description || null,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly,
        currency: formData.currency,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
        limits: {
          workflows_limit: formData.workflows_limit,
          executions_per_month: formData.executions_per_month,
          ai_credits: formData.ai_credits,
          team_members: formData.team_members,
          custom_nodes: formData.custom_nodes,
        },
        features: featuresJson,
      };

      if (selectedPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', selectedPlan.id);
        if (error) throw error;
        toast.success('Plan updated successfully');
      } else {
        const { error } = await supabase
          .from('plans')
          .insert(planData);
        if (error) throw error;
        toast.success('Plan created successfully');
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error('Failed to save plan');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', selectedPlan.id);

      if (error) throw error;
      toast.success('Plan deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (err) {
      toast.error('Failed to delete plan. It may have active subscriptions.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (plan: Plan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const getLimits = (plan: Plan) => {
    return (plan.limits as typeof defaultLimits) || defaultLimits;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plan Management</h2>
          <p className="text-muted-foreground">Add, edit or delete subscription plans</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          New Plan
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Active Plans
          </CardTitle>
          <CardDescription>Manage all subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Yearly Price</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const limits = getLimits(plan);
                return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>৳{plan.price_monthly.toLocaleString()}</TableCell>
                    <TableCell>৳{plan.price_yearly.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div>{limits.workflows_limit || 0} workflows</div>
                        <div>{limits.executions_per_month || 0} exec/month</div>
                        <div>{limits.ai_credits || 0} AI credits</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(plan)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No plans found. Create your first plan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              Set plan details and limits
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pro Plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description of the plan..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price (৳)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price (৳)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflows_limit">Workflow Limit</Label>
                  <Input
                    id="workflows_limit"
                    type="number"
                    value={formData.workflows_limit}
                    onChange={(e) => setFormData({ ...formData, workflows_limit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executions_per_month">Monthly Executions</Label>
                  <Input
                    id="executions_per_month"
                    type="number"
                    value={formData.executions_per_month}
                    onChange={(e) => setFormData({ ...formData, executions_per_month: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai_credits">AI Credits</Label>
                  <Input
                    id="ai_credits"
                    type="number"
                    value={formData.ai_credits}
                    onChange={(e) => setFormData({ ...formData, ai_credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team_members">Team Members</Label>
                  <Input
                    id="team_members"
                    type="number"
                    value={formData.team_members}
                    onChange={(e) => setFormData({ ...formData, team_members: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="custom_nodes"
                  checked={formData.custom_nodes}
                  onCheckedChange={(checked) => setFormData({ ...formData, custom_nodes: checked })}
                />
                <Label htmlFor="custom_nodes">Custom Nodes Allowed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="features">Additional Features (JSON)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder='{"feature1": true, "feature2": "value"}'
                className="font-mono text-sm"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{selectedPlan?.name}" plan? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
