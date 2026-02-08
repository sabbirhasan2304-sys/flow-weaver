import { useState, useEffect } from 'react';
import { useWorkflowStore, NodeData } from '@/stores/workflowStore';
import { getNodeDefinition } from '@/data/nodeDefinitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, Trash2, Copy, Play, Plus, Key, ExternalLink, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types/nodes';
import { toast } from 'sonner';
import { ExpressionEditor } from './ExpressionEditor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { CredentialForm } from '@/components/credentials/CredentialForm';
import { getCredentialTypeConfig } from '@/components/credentials/CredentialFieldsConfig';
import type { Json } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Credential {
  id: string;
  name: string;
  type: string;
}

export function NodeConfigPanel() {
  const { selectedNode, updateNode, deleteNode, selectNode } = useWorkflowStore();
  const { activeWorkspace, profile } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredType, setNewCredType] = useState('');
  const [newCredSettings, setNewCredSettings] = useState<Record<string, unknown>>({});
  const [addingCredentialForField, setAddingCredentialForField] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  // Node testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status?: number;
    statusText?: string;
    data?: any;
    error?: string;
    time?: number;
  } | null>(null);
  const [showTestResult, setShowTestResult] = useState(false);
  
  // Fetch credentials when workspace is available
  useEffect(() => {
    if (activeWorkspace) {
      fetchCredentials();
    }
  }, [activeWorkspace]);
  
  const fetchCredentials = async () => {
    if (!activeWorkspace) return;
    setCredentialsLoading(true);
    const { data, error } = await supabase
      .from('credentials')
      .select('id, name, type')
      .eq('workspace_id', activeWorkspace.id);
    
    if (!error && data) {
      setCredentials(data);
    }
    setCredentialsLoading(false);
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
    const { data, error } = await supabase
      .from('credentials')
      .insert({
        name: newCredName,
        type: newCredType,
        workspace_id: activeWorkspace.id,
        created_by: profile.id,
        settings: newCredSettings as Json,
      })
      .select('id, name, type')
      .single();
    
    if (error) {
      toast.error('Failed to create credential');
      setCreating(false);
      return;
    }
    
    toast.success('Credential created');
    setCredentials(prev => [...prev, data]);
    
    // Auto-select the new credential for the field
    if (addingCredentialForField && selectedNode) {
      handleConfigChange(addingCredentialForField, data.id);
    }
    
    setShowAddCredential(false);
    setNewCredName('');
    setNewCredType('');
    setNewCredSettings({});
    setAddingCredentialForField(null);
    setCreating(false);
  };
  
  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Settings className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Node Selected</h3>
        <p className="text-sm text-muted-foreground">
          Click on a node in the canvas to configure it
        </p>
      </div>
    );
  }
  
  const definition = getNodeDefinition(selectedNode.data.type);
  const categoryColor = CATEGORY_COLORS[selectedNode.data.category] || '#6366f1';
  const { nodes } = useWorkflowStore();
  
  const handleConfigChange = (field: string, value: unknown) => {
    updateNode(selectedNode.id, {
      config: {
        ...(selectedNode.data.config || {}),
        [field]: value,
      },
    });
  };
  
  const handleLabelChange = (label: string) => {
    updateNode(selectedNode.id, { label });
  };
  
  const handleDelete = () => {
    deleteNode(selectedNode.id);
    selectNode(null);
    toast.success('Node deleted');
  };
  
  const handleDuplicate = () => {
    toast.info('Node duplicated (feature coming soon)');
  };
  
  const handleTestNode = async () => {
    if (!selectedNode) return;
    
    const nodeType = selectedNode.data.type;
    const config = selectedNode.data.config || {};
    
    setIsTesting(true);
    setTestResult(null);
    const startTime = Date.now();
    
    try {
      // Handle HTTP Request node testing
      if (nodeType === 'httpRequest') {
        const method = String(config.method || 'GET');
        const url = String(config.url || '');
        
        if (!url) {
          throw new Error('URL is required');
        }
        
        // Build headers
        const configHeaders = typeof config.headers === 'object' && config.headers !== null
          ? config.headers as Record<string, string>
          : {};
        const headers: Record<string, string> = {
          'Content-Type': String(config.bodyContentType || 'application/json'),
          ...configHeaders
        };
        
        // Handle authentication
        if (config.authentication === 'bearer' && config.credential) {
          const cred = credentials.find(c => c.id === config.credential);
          if (cred) {
            const credSettings = await getCredentialSettings(cred.id);
            if (credSettings?.apiKey || credSettings?.token) {
              headers['Authorization'] = `Bearer ${credSettings.apiKey || credSettings.token}`;
            }
          }
        }
        
        // Build request options
        const options: RequestInit = { method, headers };
        
        if (['POST', 'PUT', 'PATCH'].includes(method) && config.body) {
          options.body = typeof config.body === 'string' 
            ? config.body 
            : JSON.stringify(config.body);
        }
        
        // Add query params
        let finalUrl = url;
        if (config.queryParams && typeof config.queryParams === 'object') {
          const params = new URLSearchParams(config.queryParams as Record<string, string>);
          finalUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
        }
        
        const response = await fetch(finalUrl, options);
        const endTime = Date.now();
        
        let data: any;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        setTestResult({
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          data,
          time: endTime - startTime,
        });
        
        if (response.ok) {
          toast.success(`Test successful (${response.status})`);
        } else {
          toast.warning(`Test returned ${response.status}`);
        }
        setShowTestResult(true);
      } else {
        // For other node types, show a placeholder
        toast.info('Testing for this node type coming soon');
        setTestResult({
          success: true,
          data: { message: 'Node configuration looks valid', config },
          time: Date.now() - startTime,
        });
        setShowTestResult(true);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Test failed',
        time: Date.now() - startTime,
      });
      toast.error(err.message || 'Test failed');
      setShowTestResult(true);
    } finally {
      setIsTesting(false);
    }
  };
  
  const getCredentialSettings = async (credentialId: string) => {
    const { data } = await supabase
      .from('credentials')
      .select('settings')
      .eq('id', credentialId)
      .maybeSingle();
    return data?.settings as Record<string, any> | null;
  };
  
  const renderConfigField = (field: typeof definition.configSchema[0]) => {
    const value = selectedNode.data.config?.[field.name] ?? field.defaultValue ?? '';
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.name}
            value={String(value)}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
        
      case 'textarea':
        return (
          <ExpressionEditor
            value={String(value)}
            onChange={(v) => handleConfigChange(field.name, v)}
            placeholder={field.placeholder || 'Enter value or expression...'}
            availableNodes={nodes.filter(n => n.id !== selectedNode.id).map(n => ({
              id: n.id,
              label: n.data.label,
              data: n.data,
            }))}
          />
        );
        
      case 'number':
        return (
          <Input
            id={field.name}
            type="number"
            value={Number(value)}
            onChange={(e) => handleConfigChange(field.name, Number(e.target.value))}
            placeholder={field.placeholder}
          />
        );
        
      case 'select':
        return (
          <Select
            value={String(value) || undefined}
            onValueChange={(v) => handleConfigChange(field.name, v === '__none__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem 
                  key={option.value || '__none__'} 
                  value={option.value || '__none__'}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleConfigChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm font-normal">
              {field.description || 'Enable'}
            </Label>
          </div>
        );
        
      case 'json':
        return (
          <Textarea
            id={field.name}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleConfigChange(field.name, parsed);
              } catch {
                handleConfigChange(field.name, e.target.value);
              }
            }}
            placeholder="{ }"
            rows={4}
            className="font-mono text-xs"
          />
        );
        
      case 'code':
        return (
          <Textarea
            id={field.name}
            value={String(value)}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={6}
            className="font-mono text-xs"
          />
        );
        
      case 'credential':
        // Auto-detect credential type from field's description OR infer from label
        const inferTypeFromLabel = (label: string): string => {
          const labelLower = label.toLowerCase();
          const typeMap: Record<string, string> = {
            'stripe': 'stripe', 'slack': 'slack', 'discord': 'discord', 'telegram': 'telegram',
            'github': 'github', 'gitlab': 'gitlab', 'google': 'google', 'openai': 'openai',
            'anthropic': 'anthropic', 'aws': 'aws', 'supabase': 'supabase', 'postgres': 'postgres',
            'mongodb': 'mongodb', 'mysql': 'mysql', 'redis': 'redis', 'sendgrid': 'sendgrid',
            'twilio': 'twilio', 'smtp': 'smtp', 'notion': 'notion', 'airtable': 'airtable',
            'shopify': 'shopify', 'woocommerce': 'woocommerce', 'paypal': 'paypal',
            'hubspot': 'hubspot', 'salesforce': 'salesforce', 'jira': 'jira', 'asana': 'asana',
            'trello': 'trello', 'linear': 'linear', 'clickup': 'clickup', 'zoom': 'zoom',
            'teams': 'teams', 'whatsapp': 'whatsapp', 'dropbox': 'dropbox', 'onedrive': 'onedrive',
            'mailchimp': 'mailchimp', 'twitter': 'oauth2', 'x ': 'oauth2', 'linkedin': 'oauth2',
            'facebook': 'oauth2', 'instagram': 'oauth2', 'youtube': 'google',
            'huggingface': 'apikey', 'stability': 'apikey', 'elevenlabs': 'apikey',
            'replicate': 'apikey', 'perplexity': 'apikey', 'typeform': 'apikey',
            'microsoft': 'oauth2', 'imap': 'http', 'bitbucket': 'oauth2',
          };
          for (const [key, type] of Object.entries(typeMap)) {
            if (labelLower.includes(key)) return type;
          }
          return '';
        };
        
        const credentialType = field.description || inferTypeFromLabel(field.label);
        const filteredCredentials = credentialType 
          ? credentials.filter(c => c.type === credentialType)
          : credentials;
        const selectedCred = credentials.find(c => c.id === value);
        const typeConfig = getCredentialTypeConfig(credentialType);
        
        return (
          <div className="space-y-2">
            {credentialType && typeConfig && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Key className="h-3 w-3" />
                {typeConfig.label} credentials
              </p>
            )}
            <Select
              value={String(value) || undefined}
              onValueChange={(v) => {
                if (v === '__add_new__') {
                  setAddingCredentialForField(field.name);
                  // Auto-set the credential type based on the node's requirement
                  if (credentialType) {
                    setNewCredType(credentialType);
                    setNewCredName(`My ${typeConfig?.label || credentialType}`);
                  }
                  setShowAddCredential(true);
                } else {
                  handleConfigChange(field.name, v);
                }
              }}
              disabled={credentialsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={credentialsLoading ? "Loading..." : `Select ${typeConfig?.label || 'credential'}`} />
              </SelectTrigger>
              <SelectContent>
                {filteredCredentials.length === 0 && !credentialsLoading && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No {typeConfig?.label || ''} credentials yet
                  </div>
                )}
                {filteredCredentials.map((cred) => (
                  <SelectItem key={cred.id} value={cred.id}>
                    <div className="flex items-center gap-2">
                      <Key className="h-3 w-3" />
                      <span>{cred.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <SelectItem value="__add_new__">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-3 w-3" />
                    <span>Create new {typeConfig?.label || 'credential'}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedCred && (
              <p className="text-xs text-muted-foreground">
                Connected: {selectedCred.name}
              </p>
            )}
          </div>
        );
        
      default:
        return (
          <Input
            id={field.name}
            value={String(value)}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
          />
        );
    }
  };
  
  return (
    <div className="h-full flex flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
          <div>
            <h3 className="font-medium text-foreground">{selectedNode.data.label}</h3>
            <p className="text-xs text-muted-foreground">{selectedNode.data.category}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => selectNode(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Node name */}
          <div className="space-y-2">
            <Label htmlFor="node-name">Node Name</Label>
            <Input
              id="node-name"
              value={selectedNode.data.label}
              onChange={(e) => handleLabelChange(e.target.value)}
            />
          </div>
          
          <Separator />
          
          {/* Node description */}
          {definition && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                {definition.description}
              </p>
            </div>
          )}
          
          {/* Configuration fields */}
          {definition?.configSchema && definition.configSchema.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Configuration</h4>
              
              {definition.configSchema.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-1">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  {renderConfigField(field)}
                  {field.description && field.type !== 'checkbox' && (
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <Separator />
          
          {/* Expression hint */}
          <div className="rounded-lg border border-border p-3 bg-muted/30">
            <h5 className="text-sm font-medium mb-1">Expressions</h5>
            <p className="text-xs text-muted-foreground mb-2">
              Use expressions to reference data from previous nodes:
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {'{{ $json["field"] }}'}
            </code>
          </div>
        </div>
      </ScrollArea>
      
      {/* Footer actions */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleTestNode}
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDuplicate}
          >
            <Copy className="h-3 w-3 mr-1" />
            Duplicate
          </Button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete Node
        </Button>
      </div>
      
      {/* Add Credential Dialog - Type is auto-detected from node */}
      <Dialog open={showAddCredential} onOpenChange={(open) => {
        setShowAddCredential(open);
        if (!open) {
          setNewCredName('');
          setNewCredType('');
          setNewCredSettings({});
          setAddingCredentialForField(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {newCredType ? `Connect ${getCredentialTypeConfig(newCredType)?.label || newCredType}` : 'Add Credential'}
            </DialogTitle>
            <DialogDescription>
              {newCredType 
                ? `Enter your ${getCredentialTypeConfig(newCredType)?.label || newCredType} credentials to connect this node`
                : 'Create a credential to connect this node to external services'
              }
            </DialogDescription>
          </DialogHeader>
          <CredentialForm
            name={newCredName}
            type={newCredType}
            settings={newCredSettings}
            onNameChange={setNewCredName}
            onTypeChange={(type) => {
              setNewCredType(type);
              setNewCredSettings({});
            }}
            onSettingsChange={setNewCredSettings}
            showTypeSelector={!newCredType} // Hide type selector when auto-detected
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCredential(false)}>
              Cancel
            </Button>
            <Button onClick={createCredential} disabled={creating || !newCredName || !newCredType}>
              {creating ? 'Creating...' : 'Create Credential'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Test Result Dialog */}
      <Dialog open={showTestResult} onOpenChange={setShowTestResult}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {testResult?.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-500" />
              )}
              Test Result
              {testResult?.status && (
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${
                    testResult.status >= 200 && testResult.status < 300 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                  }`}
                >
                  {testResult.status} {testResult.statusText}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4">
              {testResult?.time && (
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {testResult.time}ms
                </span>
              )}
              {testResult?.success ? 'Request completed successfully' : 'Request failed'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            {testResult?.error ? (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-sm text-muted-foreground mt-1">{testResult.error}</p>
              </div>
            ) : testResult?.data ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Response Body</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        typeof testResult.data === 'object' 
                          ? JSON.stringify(testResult.data, null, 2) 
                          : testResult.data
                      );
                      toast.success('Copied to clipboard');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[400px]">
                  {typeof testResult.data === 'object' 
                    ? JSON.stringify(testResult.data, null, 2)
                    : testResult.data
                  }
                </pre>
              </div>
            ) : null}
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowTestResult(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
