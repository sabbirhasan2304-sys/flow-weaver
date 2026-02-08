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
import { Zap, ArrowLeft, Plus, Search, Key, Trash2, Edit, Shield, Sparkles, Info, Check } from 'lucide-react';
import { format } from 'date-fns';
import { CredentialForm } from '@/components/credentials/CredentialForm';
import { credentialTypeConfigs, getCredentialTypeConfig } from '@/components/credentials/CredentialFieldsConfig';
import type { Json } from '@/integrations/supabase/types';
import {
  OpenAIIcon, AnthropicIcon, GoogleIcon, SlackIcon, DiscordIcon,
  TelegramIcon, GitHubIcon, StripeIcon, AWSIcon, SupabaseIcon,
  PostgresIcon, MongoDBIcon, SMTPIcon, SendGridIcon, TwilioIcon,
  HTTPIcon, BearerIcon, APIKeyIcon, OAuth2Icon,
  ShopifyIcon, NotionIcon, AirtableIcon, TrelloIcon, JiraIcon, AsanaIcon,
  ClickUpIcon, LinearIcon, ZoomIcon, TeamsIcon, WhatsAppIcon,
  PayPalIcon, DropboxIcon, OneDriveIcon, HubSpotIcon, SalesforceIcon,
  GmailIcon, MailchimpIcon, WooCommerceIcon, GitLabIcon, RedisIcon,
  MySQLIcon, BkashIcon, NagadIcon, OutlookIcon, SquareIcon,
} from '@/components/icons/ServiceIcons';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Credential {
  id: string;
  name: string;
  type: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Services that have platform-provided credentials available as fallback
const PLATFORM_PROVIDED_SERVICES = [
  'openai', 'anthropic', 'google', 'slack', 'discord', 'telegram',
  'sendgrid', 'twilio', 'stripe', 'github'
];

const getCredentialIcon = (type: string, size: 'sm' | 'md' = 'sm') => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const iconMap: Record<string, React.ReactNode> = {
    // Core / AI
    openai: <OpenAIIcon className={sizeClass} />,
    anthropic: <AnthropicIcon className={sizeClass} />,

    // Google ecosystem
    google: <GoogleIcon className={sizeClass} />,
    gmail: <GmailIcon className={sizeClass} />,
    outlook: <OutlookIcon className={sizeClass} />,

    // Messaging
    slack: <SlackIcon className={sizeClass} />,
    discord: <DiscordIcon className={sizeClass} />,
    telegram: <TelegramIcon className={sizeClass} />,
    whatsapp: <WhatsAppIcon className={sizeClass} />,

    // Dev tools
    github: <GitHubIcon className={sizeClass} />,
    gitlab: <GitLabIcon className={sizeClass} />,

    // Payments / Commerce
    stripe: <StripeIcon className={sizeClass} />,
    paypal: <PayPalIcon className={sizeClass} />,
    square: <SquareIcon className={sizeClass} />,
    shopify: <ShopifyIcon className={sizeClass} />,
    woocommerce: <WooCommerceIcon className={sizeClass} />,
    bkash: <BkashIcon className={sizeClass} />,
    nagad: <NagadIcon className={sizeClass} />,

    // Cloud / DB
    aws: <AWSIcon className={sizeClass} />,
    supabase: <SupabaseIcon className={sizeClass} />,
    postgres: <PostgresIcon className={sizeClass} />,
    mongodb: <MongoDBIcon className={sizeClass} />,
    mysql: <MySQLIcon className={sizeClass} />,
    redis: <RedisIcon className={sizeClass} />,

    // Email providers
    smtp: <SMTPIcon className={sizeClass} />,
    sendgrid: <SendGridIcon className={sizeClass} />,
    twilio: <TwilioIcon className={sizeClass} />,
    mailchimp: <MailchimpIcon className={sizeClass} />,

    // Productivity
    notion: <NotionIcon className={sizeClass} />,
    airtable: <AirtableIcon className={sizeClass} />,
    trello: <TrelloIcon className={sizeClass} />,
    jira: <JiraIcon className={sizeClass} />,
    asana: <AsanaIcon className={sizeClass} />,
    clickup: <ClickUpIcon className={sizeClass} />,
    linear: <LinearIcon className={sizeClass} />,

    // Sales
    hubspot: <HubSpotIcon className={sizeClass} />,
    salesforce: <SalesforceIcon className={sizeClass} />,

    // Files
    dropbox: <DropboxIcon className={sizeClass} />,
    onedrive: <OneDriveIcon className={sizeClass} />,

    // Meetings
    zoom: <ZoomIcon className={sizeClass} />,
    teams: <TeamsIcon className={sizeClass} />,

    // Generic auth types
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
        </div>
      </header>

      {/* Create Credential Dialog - opens when service icon is clicked */}
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

      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="p-4 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Your Credentials, Your Control</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Add your own API keys to use your account limits and billing. All credentials are encrypted at rest and never exposed in logs.
              </p>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Platform Fallback
                </Badge>
                <span className="text-muted-foreground">
                  Services with this badge can use our shared credentials if you don't have your own
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="mb-8 border-muted">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              How Credentials Work
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Use Your Own Keys</p>
                  <p className="text-muted-foreground text-xs">Add your API keys to use your own account limits, billing, and have full control over usage.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">2</span>
                </div>
                <div>
                  <p className="font-medium">Or Use Platform Credits</p>
                  <p className="text-muted-foreground text-xs">Don't have keys? Some services can use our shared credentials, charged via AI credits from your balance.</p>
                </div>
              </div>
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
          <div className="text-center py-16 px-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Key className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">No custom credentials yet</h3>
            <p className="text-muted-foreground mb-2 max-w-md mx-auto">
              Add your own API keys to use your account limits, or use platform credentials charged via AI credits.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
              <Sparkles className="h-4 w-4 inline mr-1" />
              Services with platform fallback will work automatically using your AI credits
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your Own Credentials
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

        {/* Quick Connect Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Connect a Service</h2>
              <p className="text-sm text-muted-foreground">Click on a service to add your own credentials</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1">
                <Sparkles className="h-3 w-3" />
                Platform Available
              </Badge>
              <span>= Can use our shared credentials</span>
            </div>
          </div>
          <TooltipProvider>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {credentialTypeConfigs.map((config) => {
                const hasPlatformFallback = PLATFORM_PROVIDED_SERVICES.includes(config.value);
                const userHasCredential = credentials.some(c => c.type === config.value);
                
                return (
                  <Tooltip key={config.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={`h-auto py-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all relative ${
                          userHasCredential ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                        }`}
                        onClick={() => {
                          setNewCredType(config.value);
                          setNewCredName(`My ${config.label}`);
                          setNewCredSettings({});
                          setCreateDialogOpen(true);
                        }}
                      >
                        {/* Platform fallback badge */}
                        {hasPlatformFallback && !userHasCredential && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-amber-500 text-white border-0">
                              <Sparkles className="h-3 w-3" />
                            </Badge>
                          </div>
                        )}
                        {/* User has credential badge */}
                        {userHasCredential && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-emerald-500 text-white border-0">
                              <Check className="h-3 w-3" />
                            </Badge>
                          </div>
                        )}
                        {getCredentialIcon(config.value, 'md')}
                        <span className="text-xs text-center">{config.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                      {hasPlatformFallback && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          ✨ Platform fallback available - uses your AI credits
                        </p>
                      )}
                      {userHasCredential && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          ✓ You have credentials configured
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* Platform Credits Info */}
        <Card className="mt-8 border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Using Platform Credentials</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  For services marked with <Sparkles className="h-3 w-3 inline text-amber-500" />, if you don't add your own credentials, 
                  workflows will use our shared API keys. Usage is charged from your AI credits balance:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>OpenAI/Anthropic:</strong> 1 credit per 1K tokens</li>
                  <li>• <strong>Email/SMS:</strong> 0.5 credits per message</li>
                  <li>• <strong>Other APIs:</strong> 0.1 credits per request</li>
                </ul>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-amber-600 dark:text-amber-400" asChild>
                  <a href="/billing">Manage AI Credits →</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
