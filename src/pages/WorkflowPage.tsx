import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WorkflowEditor } from '@/components/workflow/WorkflowEditor';
import { SubscriptionGate } from '@/components/subscription/SubscriptionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Zap, ArrowLeft, Save, Play, Pause, 
  Settings, Share2, MoreHorizontal,
  CheckCircle2, Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Json } from '@/integrations/supabase/types';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  data: Json;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

// Ref to trigger save from header
let canvasSaveRef: (() => void) | null = null;
export function setCanvasSaveRef(fn: (() => void) | null) {
  canvasSaveRef = fn;
}

export default function WorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (id) {
      fetchWorkflow();
    }
  }, [id, user, authLoading, navigate]);

  const fetchWorkflow = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      toast.error('Workflow not found');
      navigate('/dashboard');
    } else {
      setWorkflow(data);
      setWorkflowName(data.name);
    }
    setLoading(false);
  };

  const handleSave = async (data: { nodes: any[]; edges: any[] }) => {
    if (!workflow) return;
    
    setSaving(true);

    // Save version snapshot before updating
    try {
      await supabase
        .from('workflow_versions')
        .insert({
          workflow_id: workflow.id,
          version_number: workflow.version,
          data: workflow.data,
          created_by: user ? undefined : undefined, // profile_id handled via RLS
          description: `Auto-save v${workflow.version}`,
        } as any);
    } catch (e) {
      console.warn('Failed to save version snapshot:', e);
    }

    const { error } = await supabase
      .from('workflows')
      .update({
        name: workflowName,
        data: data as unknown as Json,
        version: workflow.version + 1,
      })
      .eq('id', workflow.id);
    
    if (error) {
      toast.error('Failed to save workflow');
    } else {
      setWorkflow({ ...workflow, version: workflow.version + 1, data: data as unknown as Json });
      setLastSaved(new Date());
      toast.success('Workflow saved');
    }
    setSaving(false);
  };

  const handleNameChange = async () => {
    if (!workflow || workflowName === workflow.name) {
      setIsEditing(false);
      return;
    }
    
    const { error } = await supabase
      .from('workflows')
      .update({ name: workflowName })
      .eq('id', workflow.id);
    
    if (error) {
      toast.error('Failed to update name');
      setWorkflowName(workflow.name);
    } else {
      setWorkflow({ ...workflow, name: workflowName });
    }
    setIsEditing(false);
  };

  const toggleActive = async () => {
    if (!workflow) return;
    
    const { error } = await supabase
      .from('workflows')
      .update({ is_active: !workflow.is_active })
      .eq('id', workflow.id);
    
    if (error) {
      toast.error('Failed to update workflow');
    } else {
      setWorkflow({ ...workflow, is_active: !workflow.is_active });
      toast.success(workflow.is_active ? 'Workflow deactivated' : 'Workflow activated');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <SubscriptionGate feature="Workflow Editor">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 h-14 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              
              {isEditing ? (
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  onBlur={handleNameChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameChange();
                    if (e.key === 'Escape') {
                      setWorkflowName(workflow.name);
                      setIsEditing(false);
                    }
                  }}
                  className="h-8 w-[200px]"
                  autoFocus
                />
              ) : (
                <button
                  className="text-lg font-medium hover:bg-muted px-2 py-1 rounded-md transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  {workflow.name}
                </button>
              )}
              
              {workflow.is_active ? (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleActive}
            >
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
            </Button>
            
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Workflow link copied to clipboard');
            }}>
              <Share2 className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.info('Workflow settings coming soon')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Workflow Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const json = JSON.stringify(workflow.data, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${workflow.name}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Exported as JSON');
                }}>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/executions">View Executions</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={async () => {
                  const { error } = await supabase.from('workflows').delete().eq('id', workflow.id);
                  if (error) { toast.error('Failed to delete'); }
                  else { toast.success('Workflow deleted'); navigate('/dashboard'); }
                }}>
                  Delete Workflow
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" onClick={() => canvasSaveRef?.()} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </header>
        
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <WorkflowEditor
            workflowId={workflow.id}
            workflowName={workflow.name}
            initialData={workflow.data as { nodes?: any[]; edges?: any[] }}
            onSave={handleSave}
          />
        </div>
      </div>
    </SubscriptionGate>
  );
}
