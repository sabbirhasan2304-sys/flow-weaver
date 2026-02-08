import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Zap, ArrowLeft, Plus, Search, Key, Trash2, Edit, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { CredentialForm } from '@/components/credentials/CredentialForm';
import { credentialTypeConfigs, getCredentialTypeConfig } from '@/components/credentials/CredentialFieldsConfig';
import type { Json } from '@/integrations/supabase/types';
import {
  OpenAIIcon, AnthropicIcon, GoogleIcon, SlackIcon, DiscordIcon,
  TelegramIcon, GitHubIcon, StripeIcon, AWSIcon, SupabaseIcon,
  PostgresIcon, MongoDBIcon, SMTPIcon, SendGridIcon, TwilioIcon,
  HTTPIcon, BearerIcon, APIKeyIcon, OAuth2Icon
} from '@/components/icons/ServiceIcons';

interface Credential {
  id: string;
  name: string;
  type: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const getCredentialIcon = (type: string, size: 'sm' | 'md' = 'sm') => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const iconMap: Record<string, React.ReactNode> = {
    openai: <OpenAIIcon className={sizeClass} />,
    anthropic: <AnthropicIcon className={sizeClass} />,
    google: <GoogleIcon className={sizeClass} />,
    slack: <SlackIcon className={sizeClass} />,
    discord: <DiscordIcon className={sizeClass} />,
    telegram: <TelegramIcon className={sizeClass} />,
    github: <GitHubIcon className={sizeClass} />,
    stripe: <StripeIcon className={sizeClass} />,
    aws: <AWSIcon className={sizeClass} />,
    supabase: <SupabaseIcon className={sizeClass} />,
    postgres: <PostgresIcon className={sizeClass} />,
    mongodb: <MongoDBIcon className={sizeClass} />,
    smtp: <SMTPIcon className={sizeClass} />,
    sendgrid: <SendGridIcon className={sizeClass} />,
    twilio: <TwilioIcon className={sizeClass} />,
    http: <HTTPIcon className={sizeClass} />,
    bearer: <BearerIcon className={sizeClass} />,
    apikey: <APIKeyIcon className={sizeClass} />,
    oauth2: <OAuth2Icon className={sizeClass} />,
  };
  return iconMap[type] || <Key className={sizeClass} />;
};

export default function Credentials() {
  const navigate = useNavigate();
  const { user, profile, activeWorkspace, loading: authLoading } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredType, setNewCredType] = useState('');
  const [newCredSettings, setNewCredSettings] = useState<Record<string, unknown>>({});
  const [creating, setCreating] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [editCredName, setEditCredName] = useState('');
  const [editCredSettings, setEditCredSettings] = useState<Record<string, unknown>>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (activeWorkspace) {
      fetchCredentials();
    }
  }, [user, activeWorkspace, authLoading]);

  const fetchCredentials = async () => {
    if (!activeWorkspace) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('credentials')
      .select('id, name, type, settings, created_at, updated_at')
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load credentials');
    } else {
      setCredentials((data || []).map(c => ({
        ...c,
        settings: (c.settings as Record<string, unknown>) || {},
      })));
    }
    setLoading(false);
  };

  const resetCreateForm = () => {
    setNewCredName('');
    setNewCredType('');
    setNewCredSettings({});
  };

  const createCredential = async () => {
    if (!activeWorkspace || !profile || !newCredName || !newCredType) {
      toast.error('Please fill in name and type');
      return;
    }
    
    // Validate required fields
    const config = getCredentialTypeConfig(newCredType);
    if (config) {
      const missingRequired = config.fields
        .filter(f => f.required)
        .filter(f => !newCredSettings[f.name]);
      
      if (missingRequired.length > 0) {
        toast.error(`Please fill in: ${missingRequired.map(f => f.label).join(', ')}`);
        return;
      }
    }
    
    setCreating(true);
    const { error } = await supabase
      .from('credentials')
      .insert({
        name: newCredName,
        type: newCredType,
        workspace_id: activeWorkspace.id,
        created_by: profile.id,
        settings: newCredSettings as Json,
      });
    
    if (error) {
      toast.error('Failed to create credential');
    } else {
      toast.success('Credential created');
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchCredentials();
    }
    setCreating(false);
  };

  const openEditDialog = (credential: Credential) => {
    setEditingCredential(credential);
    setEditCredName(credential.name);
    setEditCredSettings(credential.settings || {});
    setEditDialogOpen(true);
  };

  const updateCredential = async () => {
    if (!editingCredential || !editCredName) {
      toast.error('Please fill in the name');
      return;
    }
    
    // Validate required fields
    const config = getCredentialTypeConfig(editingCredential.type);
    if (config) {
      const missingRequired = config.fields
        .filter(f => f.required)
        .filter(f => !editCredSettings[f.name]);
      
      if (missingRequired.length > 0) {
        toast.error(`Please fill in: ${missingRequired.map(f => f.label).join(', ')}`);
        return;
      }
    }
    
    setUpdating(true);
    const { error } = await supabase
      .from('credentials')
      .update({
        name: editCredName,
        settings: editCredSettings as Json,
      })
      .eq('id', editingCredential.id);
    
    if (error) {
      toast.error('Failed to update credential');
    } else {
      toast.success('Credential updated');
      setEditDialogOpen(false);
      setEditingCredential(null);
      fetchCredentials();
    }
    setUpdating(false);
  };

  const deleteCredential = async (id: string) => {
    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete credential');
    } else {
      toast.success('Credential deleted');
      fetchCredentials();
    }
  };

  const filteredCredentials = credentials.filter(cred =>
    cred.name.toLowerCase().includes(search.toLowerCase()) ||
    cred.type.toLowerCase().includes(search.toLowerCase())
  );

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
              <span className="text-xl font-bold text-foreground">Credentials</span>
            </div>
          </div>
          
          {/* Only show Add Credential button if type is pre-selected via service icons */}
          {newCredType ? (
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) resetCreateForm();
            }}>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Connect {getCredentialTypeConfig(newCredType)?.label || newCredType}
                  </DialogTitle>
                  <DialogDescription>
                    Enter your {getCredentialTypeConfig(newCredType)?.label || newCredType} credentials
                  </DialogDescription>
                </DialogHeader>
                <CredentialForm
                  name={newCredName}
                  type={newCredType}
                  settings={newCredSettings}
                  onNameChange={setNewCredName}
                  onTypeChange={() => {}}
                  onSettingsChange={setNewCredSettings}
                  showTypeSelector={false}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setCreateDialogOpen(false);
                    resetCreateForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={createCredential} disabled={creating || !newCredName}>
                    {creating ? 'Connecting...' : 'Connect'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-medium">Secure Credential Storage</h3>
              <p className="text-sm text-muted-foreground">
                All credentials are encrypted at rest. API keys and tokens are never exposed in logs or workflows.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search credentials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Credentials List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-20">
            <Key className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No credentials yet</h3>
            <p className="text-muted-foreground mb-4">
              Add credentials to connect your workflows to external services
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((credential) => {
              const config = getCredentialTypeConfig(credential.type);
              return (
                <Card key={credential.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getCredentialIcon(credential.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{credential.name}</CardTitle>
                          <CardDescription>{config?.label || credential.type}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>Created {format(new Date(credential.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(credential)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteCredential(credential.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Connect Section - like n8n/Zapier */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-2">Connect a Service</h2>
          <p className="text-sm text-muted-foreground mb-4">Click on a service to add credentials</p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {credentialTypeConfigs.map((config) => (
              <Button
                key={config.value}
                variant="outline"
                className="h-auto py-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => {
                  setNewCredType(config.value);
                  setNewCredName(`My ${config.label}`);
                  setNewCredSettings({});
                  setCreateDialogOpen(true);
                }}
              >
                {getCredentialIcon(config.value, 'md')}
                <span className="text-xs text-center">{config.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setEditingCredential(null);
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Credential</DialogTitle>
            <DialogDescription>
              Update your credential settings
            </DialogDescription>
          </DialogHeader>
          {editingCredential && (
            <CredentialForm
              name={editCredName}
              type={editingCredential.type}
              settings={editCredSettings}
              onNameChange={setEditCredName}
              onTypeChange={() => {}} // Type can't be changed after creation
              onSettingsChange={setEditCredSettings}
              showTypeSelector={false}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateCredential} disabled={updating || !editCredName}>
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
