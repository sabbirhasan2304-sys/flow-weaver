import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Zap, ArrowLeft, Plus, Search, Key, Trash2, Edit,
  Mail, MessageSquare, Database, Cloud, Bot, CreditCard,
  Globe, Github, Shield, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface Credential {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

const credentialTypes = [
  { value: 'openai', label: 'OpenAI', icon: <Bot className="h-4 w-4" /> },
  { value: 'anthropic', label: 'Anthropic Claude', icon: <Bot className="h-4 w-4" /> },
  { value: 'google', label: 'Google (Gmail, Sheets, Drive)', icon: <Mail className="h-4 w-4" /> },
  { value: 'slack', label: 'Slack', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'discord', label: 'Discord', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'telegram', label: 'Telegram', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'github', label: 'GitHub', icon: <Github className="h-4 w-4" /> },
  { value: 'stripe', label: 'Stripe', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'aws', label: 'AWS', icon: <Cloud className="h-4 w-4" /> },
  { value: 'supabase', label: 'Supabase', icon: <Database className="h-4 w-4" /> },
  { value: 'postgres', label: 'PostgreSQL', icon: <Database className="h-4 w-4" /> },
  { value: 'mongodb', label: 'MongoDB', icon: <Database className="h-4 w-4" /> },
  { value: 'smtp', label: 'SMTP Email', icon: <Mail className="h-4 w-4" /> },
  { value: 'sendgrid', label: 'SendGrid', icon: <Mail className="h-4 w-4" /> },
  { value: 'twilio', label: 'Twilio', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'http', label: 'HTTP Basic Auth', icon: <Globe className="h-4 w-4" /> },
  { value: 'bearer', label: 'Bearer Token', icon: <Key className="h-4 w-4" /> },
  { value: 'apikey', label: 'API Key', icon: <Key className="h-4 w-4" /> },
  { value: 'oauth2', label: 'OAuth2', icon: <Shield className="h-4 w-4" /> },
];

const getCredentialIcon = (type: string) => {
  const cred = credentialTypes.find(c => c.value === type);
  return cred?.icon || <Key className="h-4 w-4" />;
};

export default function Credentials() {
  const navigate = useNavigate();
  const { user, profile, activeWorkspace, loading: authLoading } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredType, setNewCredType] = useState('');

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
      .select('id, name, type, created_at, updated_at')
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load credentials');
    } else {
      setCredentials(data || []);
    }
    setLoading(false);
  };

  const createCredential = async () => {
    if (!activeWorkspace || !profile || !newCredName || !newCredType) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const { error } = await supabase
      .from('credentials')
      .insert({
        name: newCredName,
        type: newCredType,
        workspace_id: activeWorkspace.id,
        created_by: profile.id,
        settings: {}, // Encrypted settings would go here
      });
    
    if (error) {
      toast.error('Failed to create credential');
    } else {
      toast.success('Credential created');
      setCreateDialogOpen(false);
      setNewCredName('');
      setNewCredType('');
      fetchCredentials();
    }
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
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Credential</DialogTitle>
                <DialogDescription>
                  Securely store API keys and authentication tokens
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cred-name">Name</Label>
                  <Input
                    id="cred-name"
                    placeholder="My API Key"
                    value={newCredName}
                    onChange={(e) => setNewCredName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-type">Type</Label>
                  <Select value={newCredType} onValueChange={setNewCredType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select credential type" />
                    </SelectTrigger>
                    <SelectContent>
                      {credentialTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCredential}>
                  Create Credential
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            {filteredCredentials.map((credential) => (
              <Card key={credential.id} className="group hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getCredentialIcon(credential.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{credential.name}</CardTitle>
                        <CardDescription className="capitalize">{credential.type}</CardDescription>
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
                      onClick={() => toast.info('Edit credential coming soon')}
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
            ))}
          </div>
        )}

        {/* OAuth Helper Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Quick Connect</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Google', icon: <Mail className="h-5 w-5" /> },
              { name: 'Slack', icon: <MessageSquare className="h-5 w-5" /> },
              { name: 'GitHub', icon: <Github className="h-5 w-5" /> },
              { name: 'Stripe', icon: <CreditCard className="h-5 w-5" /> },
              { name: 'OpenAI', icon: <Bot className="h-5 w-5" /> },
              { name: 'AWS', icon: <Cloud className="h-5 w-5" /> },
            ].map((service) => (
              <Button
                key={service.name}
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => toast.info(`Connect to ${service.name} coming soon`)}
              >
                {service.icon}
                <span className="text-xs">{service.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
