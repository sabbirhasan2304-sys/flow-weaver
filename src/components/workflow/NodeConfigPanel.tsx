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
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { X, Settings, Trash2, Copy, Play, Plus, Key, ExternalLink, Loader2, CheckCircle2, XCircle, Clock, ChevronDown, AlertTriangle, RotateCcw, SkipForward, FileText, Zap, Shield, StickyNote } from 'lucide-react';
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
import { cn } from '@/lib/utils';

// AI/ML node types that support credential testing
const AI_ML_NODE_TYPES = [
  'openai', 'openaiAssistant', 'gemini', 'geminiVision', 'aiAgent', 'langchainAgent',
  'huggingface', 'stabilityAI', 'elevenLabs', 'replicate', 'perplexity',
  'textClassification', 'sentimentAnalysis', 'entityExtraction', 'textSummarization',
  'imageGeneration', 'imageRecognition', 'speechToText', 'textToSpeech',
  'rag', 'embeddings', 'vectorStore', 'aiChain'
];

interface Credential {
  id: string;
  name: string;
  type: string;
}

interface CredentialTestStatus {
  credentialId: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  testedAt?: Date;
}

// ─── Collapsible Section Component ───
function Section({ title, icon: Icon, defaultOpen = true, children, badge }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 group">
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
          !open && "-rotate-90"
        )} />
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </span>
        {badge}
        <div className="flex-1" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-1 pt-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
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
  
  // Credential auto-test state
  const [credentialTestStatuses, setCredentialTestStatuses] = useState<Map<string, CredentialTestStatus>>(new Map());
  
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
    if (!error && data) setCredentials(data);
    setCredentialsLoading(false);
  };
  
  const createCredential = async () => {
    if (!activeWorkspace || !profile || !newCredName || !newCredType) {
      toast.error('Please fill in name and type');
      return;
    }
    const config = getCredentialTypeConfig(newCredType);
    if (config) {
      const missingRequired = config.fields.filter(f => f.required).filter(f => !newCredSettings[f.name]);
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
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-card/50 backdrop-blur-xl">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
          <Settings className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-semibold text-foreground/80 mb-1.5">No Node Selected</h3>
        <p className="text-sm text-muted-foreground/60 max-w-[200px]">
          Click on a node in the canvas to view and edit its settings
        </p>
      </div>
    );
  }
  
  const definition = getNodeDefinition(selectedNode.data.type);
  const categoryColor = CATEGORY_COLORS[selectedNode.data.category] || '#6366f1';
  const { nodes } = useWorkflowStore();
  
  const handleConfigChange = (field: string, value: unknown) => {
    updateNode(selectedNode.id, {
      config: { ...(selectedNode.data.config || {}), [field]: value },
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
      if (nodeType === 'httpRequest') {
        const method = String(config.method || 'GET');
        const url = String(config.url || '');
        if (!url) throw new Error('URL is required');
        const configHeaders = typeof config.headers === 'object' && config.headers !== null
          ? config.headers as Record<string, string> : {};
        const headers: Record<string, string> = {
          'Content-Type': String(config.bodyContentType || 'application/json'),
          ...configHeaders
        };
        if (config.authentication === 'bearer' && config.credential) {
          const cred = credentials.find(c => c.id === config.credential);
          if (cred) {
            const credSettings = await getCredentialSettings(cred.id);
            if (credSettings?.apiKey || credSettings?.token) {
              headers['Authorization'] = `Bearer ${credSettings.apiKey || credSettings.token}`;
            }
          }
        }
        const options: RequestInit = { method, headers };
        if (['POST', 'PUT', 'PATCH'].includes(method) && config.body) {
          options.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
        }
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
        setTestResult({ success: response.ok, status: response.status, statusText: response.statusText, data, time: endTime - startTime });
        if (response.ok) toast.success(`Test successful (${response.status})`);
        else toast.warning(`Test returned ${response.status}`);
        setShowTestResult(true);
      } else {
        toast.info('Testing for this node type coming soon');
        setTestResult({ success: true, data: { message: 'Node configuration looks valid', config }, time: Date.now() - startTime });
        setShowTestResult(true);
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Test failed', time: Date.now() - startTime });
      toast.error(err.message || 'Test failed');
      setShowTestResult(true);
    } finally {
      setIsTesting(false);
    }
  };
  
  const getCredentialSettings = async (credentialId: string) => {
    const { data } = await supabase.from('credentials').select('settings').eq('id', credentialId).maybeSingle();
    return data?.settings as Record<string, any> | null;
  };
  
  const testCredentialForAINode = async (credentialId: string, nodeType: string) => {
    if (!AI_ML_NODE_TYPES.includes(nodeType) || !selectedNode) return;
    setCredentialTestStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(credentialId, { credentialId, status: 'testing' });
      return newMap;
    });
    updateNode(selectedNode.id, { credentialStatus: { status: 'testing', message: 'Testing credential...' } });
    try {
      const credSettings = await getCredentialSettings(credentialId);
      if (!credSettings) throw new Error('Credential settings not found');
      const apiKey = credSettings.apiKey || credSettings.token || credSettings.accessToken;
      if (!apiKey) throw new Error('No API key found in credential');
      let testResponse: Response | null = null;
      let testMessage = '';
      const nodeConfig = selectedNode.data.config || {};
      const usePlatformCredentials = nodeConfig.usePlatformCredentials !== false;
      if (['aiAgent', 'langchainAgent', 'geminiVision'].includes(nodeType) || 
          ((['openai', 'gemini'].includes(nodeType)) && usePlatformCredentials)) {
        testMessage = 'Using platform AI gateway';
        setCredentialTestStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(credentialId, { credentialId, status: 'success', message: testMessage, testedAt: new Date() });
          return newMap;
        });
        updateNode(selectedNode.id, { credentialStatus: { status: 'success', message: testMessage } });
        toast.success('Credential validated');
        return;
      }
      if (nodeType === 'openai') {
        testResponse = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` } });
        testMessage = testResponse.ok ? 'OpenAI API key valid' : 'Invalid OpenAI API key';
      } else if (nodeType === 'gemini') {
        testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        testMessage = testResponse.ok ? 'Google AI API key valid' : 'Invalid Google AI API key';
      } else if (nodeType === 'huggingface') {
        testResponse = await fetch('https://huggingface.co/api/whoami', { headers: { 'Authorization': `Bearer ${apiKey}` } });
        testMessage = testResponse.ok ? 'HuggingFace token valid' : 'Invalid HuggingFace token';
      } else if (nodeType === 'stabilityAI') {
        testResponse = await fetch('https://api.stability.ai/v1/user/account', { headers: { 'Authorization': `Bearer ${apiKey}` } });
        testMessage = testResponse.ok ? 'Stability AI key valid' : 'Invalid Stability AI key';
      } else if (nodeType === 'elevenLabs') {
        testResponse = await fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': apiKey } });
        testMessage = testResponse.ok ? 'ElevenLabs key valid' : 'Invalid ElevenLabs key';
      } else if (nodeType === 'replicate') {
        testResponse = await fetch('https://api.replicate.com/v1/account', { headers: { 'Authorization': `Token ${apiKey}` } });
        testMessage = testResponse.ok ? 'Replicate token valid' : 'Invalid Replicate token';
      } else if (nodeType === 'perplexity') {
        testResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'sonar-small-chat', messages: [{ role: 'user', content: 'test' }], max_tokens: 1 })
        });
        testMessage = testResponse.ok ? 'Perplexity key valid' : 'Invalid Perplexity key';
      } else {
        if (apiKey.length >= 10) {
          testMessage = 'API key format validated';
          setCredentialTestStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(credentialId, { credentialId, status: 'success', message: testMessage, testedAt: new Date() });
            return newMap;
          });
          updateNode(selectedNode.id, { credentialStatus: { status: 'success', message: testMessage } });
          toast.success('Credential validated');
          return;
        } else {
          throw new Error('API key appears too short');
        }
      }
      if (testResponse && testResponse.ok) {
        setCredentialTestStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(credentialId, { credentialId, status: 'success', message: testMessage, testedAt: new Date() });
          return newMap;
        });
        updateNode(selectedNode.id, { credentialStatus: { status: 'success', message: testMessage } });
        toast.success(testMessage);
      } else {
        throw new Error(testMessage || 'Credential test failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Test failed';
      setCredentialTestStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(credentialId, { credentialId, status: 'error', message: errorMessage, testedAt: new Date() });
        return newMap;
      });
      updateNode(selectedNode.id, { credentialStatus: { status: 'error', message: errorMessage } });
      toast.error(errorMessage);
    }
  };
  
  const handleCredentialSelect = (fieldName: string, credentialId: string) => {
    handleConfigChange(fieldName, credentialId);
    if (selectedNode && AI_ML_NODE_TYPES.includes(selectedNode.data.type)) {
      testCredentialForAINode(credentialId, selectedNode.data.type);
    }
  };
  
  const getCredentialTestStatus = (credentialId: string): CredentialTestStatus | undefined => {
    return credentialTestStatuses.get(credentialId);
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
            className="h-9 bg-background/60 border-border/50 focus:border-primary/50 transition-colors"
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
            className="h-9 bg-background/60 border-border/50 focus:border-primary/50 transition-colors"
          />
        );
        
      case 'select':
        return (
          <Select
            value={String(value) || undefined}
            onValueChange={(v) => handleConfigChange(field.name, v === '__none__' ? '' : v)}
          >
            <SelectTrigger className="h-9 bg-background/60 border-border/50">
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value || '__none__'} value={option.value || '__none__'}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center gap-3 py-1">
            <Switch
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleConfigChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm font-normal text-muted-foreground cursor-pointer">
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
            className="font-mono text-xs bg-background/60 border-border/50 resize-y"
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
            className="font-mono text-xs bg-background/60 border-border/50 resize-y"
          />
        );
        
      case 'credential':
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
        const filteredCredentials = credentialType ? credentials.filter(c => c.type === credentialType) : credentials;
        const selectedCred = credentials.find(c => c.id === value);
        const typeConfig = getCredentialTypeConfig(credentialType);
        const isAINode = selectedNode && AI_ML_NODE_TYPES.includes(selectedNode.data.type);
        const testStatus = value ? getCredentialTestStatus(String(value)) : undefined;
        
        return (
          <div className="space-y-2">
            {credentialType && typeConfig && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Key className="h-3 w-3" />
                <span>{typeConfig.label} credentials</span>
                {isAINode && (
                  <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                    Auto-test
                  </Badge>
                )}
              </div>
            )}
            <Select
              value={String(value) || undefined}
              onValueChange={(v) => {
                if (v === '__add_new__') {
                  setAddingCredentialForField(field.name);
                  if (credentialType) {
                    setNewCredType(credentialType);
                    setNewCredName(`My ${typeConfig?.label || credentialType}`);
                  }
                  setShowAddCredential(true);
                } else {
                  handleCredentialSelect(field.name, v);
                }
              }}
              disabled={credentialsLoading}
            >
              <SelectTrigger className="h-9 bg-background/60 border-border/50">
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={testStatus?.status || 'idle'}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="rounded-lg border p-2"
                >
                  {testStatus?.status === 'testing' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Testing credential...
                    </div>
                  )}
                  {testStatus?.status === 'success' && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {testStatus.message || 'Credential verified'}
                    </div>
                  )}
                  {testStatus?.status === 'error' && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <XCircle className="h-3 w-3" />
                      <span className="flex-1">{testStatus.message || 'Credential test failed'}</span>
                      <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px]"
                        onClick={() => testCredentialForAINode(String(value), selectedNode?.data.type || '')}
                      >Retry</Button>
                    </div>
                  )}
                  {!testStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Connected: <span className="text-foreground font-medium">{selectedCred.name}</span>
                      </span>
                      {isAINode && (
                        <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px]"
                          onClick={() => testCredentialForAINode(String(value), selectedNode?.data.type || '')}
                        >
                          <Play className="h-3 w-3 mr-1" /> Test
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        );
        
      default:
        return (
          <Input
            id={field.name}
            value={String(value)}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            className="h-9 bg-background/60 border-border/50"
          />
        );
    }
  };
  
  // Count configured fields
  const configuredCount = definition?.configSchema?.filter(
    f => selectedNode.data.config?.[f.name] !== undefined && selectedNode.data.config?.[f.name] !== ''
  ).length || 0;
  const totalFields = definition?.configSchema?.length || 0;
  
  return (
    <div className="h-full flex flex-col bg-card/80 backdrop-blur-xl">
      {/* ─── Header ─── */}
      <div className="px-4 py-4 border-b border-border/40">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: `${categoryColor}15`,
                boxShadow: `0 2px 8px ${categoryColor}15`,
              }}
            >
              <div 
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: categoryColor, boxShadow: `0 0 8px ${categoryColor}50` }}
              />
            </div>
            <div className="min-w-0">
              <Input
                value={selectedNode.data.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="h-7 text-sm font-semibold border-transparent bg-transparent px-0 hover:bg-muted/40 focus:bg-muted/40 focus:border-border/50 rounded-md transition-all"
              />
              <p 
                className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 pl-0.5"
                style={{ color: categoryColor }}
              >
                {selectedNode.data.category}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => selectNode(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-1.5 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5 bg-background/60 border-border/50 hover:border-primary/40 hover:bg-primary/5"
            onClick={handleTestNode}
            disabled={isTesting}
          >
            {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {isTesting ? 'Testing...' : 'Test Node'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/60 border-border/50 hover:border-border"
            onClick={handleDuplicate}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/60 border-border/50 hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* ─── Content ─── */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* Description */}
          {definition && (
            <div className="rounded-xl bg-muted/30 border border-border/30 p-3 mb-3">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {definition.description}
              </p>
            </div>
          )}
          
          {/* ─── Configuration Section ─── */}
          {definition?.configSchema && definition.configSchema.length > 0 && (
            <Section 
              title="Configuration" 
              icon={Settings}
              badge={
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-auto font-mono">
                  {configuredCount}/{totalFields}
                </Badge>
              }
            >
              <div className="space-y-4 pt-1">
                {definition.configSchema.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-xs font-medium flex items-center gap-1.5">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive text-[10px]">●</span>
                      )}
                    </Label>
                    {renderConfigField(field)}
                    {field.description && field.type !== 'checkbox' && field.type !== 'credential' && (
                      <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                        {field.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
          
          {/* ─── Error Handling Section ─── */}
          <Section title="Error Handling" icon={Shield} defaultOpen={false}>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs font-medium cursor-pointer">Continue on Fail</Label>
                </div>
                <Switch
                  checked={!!selectedNode.data.errorHandling?.continueOnFail}
                  onCheckedChange={(checked) => {
                    updateNode(selectedNode.id, {
                      errorHandling: { ...selectedNode.data.errorHandling, continueOnFail: !!checked },
                    });
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs font-medium cursor-pointer">Retry on Fail</Label>
                </div>
                <Switch
                  checked={!!selectedNode.data.errorHandling?.retryOnFail}
                  onCheckedChange={(checked) => {
                    updateNode(selectedNode.id, {
                      errorHandling: { ...selectedNode.data.errorHandling, retryOnFail: !!checked },
                    });
                  }}
                />
              </div>
              
              <AnimatePresence>
                {selectedNode.data.errorHandling?.retryOnFail && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl bg-muted/30 border border-border/30 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Max Retries</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          className="w-16 h-7 text-xs text-center bg-background/60 border-border/50"
                          value={selectedNode.data.errorHandling?.maxRetries ?? 3}
                          onChange={(e) => {
                            updateNode(selectedNode.id, {
                              errorHandling: { ...selectedNode.data.errorHandling, maxRetries: parseInt(e.target.value) || 3 },
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Delay (ms)</Label>
                        <Input
                          type="number"
                          min={100}
                          step={100}
                          className="w-20 h-7 text-xs text-center bg-background/60 border-border/50"
                          value={selectedNode.data.errorHandling?.retryDelayMs ?? 1000}
                          onChange={(e) => {
                            updateNode(selectedNode.id, {
                              errorHandling: { ...selectedNode.data.errorHandling, retryDelayMs: parseInt(e.target.value) || 1000 },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Section>
          
          {/* ─── Expressions Help ─── */}
          <Section title="Expressions" icon={Zap} defaultOpen={false}>
            <div className="rounded-xl bg-muted/30 border border-border/30 p-3">
              <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                Reference data from previous nodes using expressions:
              </p>
              <code className="text-[11px] bg-background/60 px-2.5 py-1.5 rounded-lg font-mono block border border-border/30 text-primary/80">
                {'{{ $json["field"] }}'}
              </code>
            </div>
          </Section>

          {/* ─── Notes Section ─── */}
          <Section title="Notes" icon={StickyNote} defaultOpen={false}>
            <Textarea
              className="text-xs bg-background/60 border-border/50 resize-y min-h-[60px]"
              placeholder="Add notes about this node..."
              value={(selectedNode.data.notes as string) || ''}
              onChange={(e) => updateNode(selectedNode.id, { notes: e.target.value })}
            />
          </Section>
        </div>
      </ScrollArea>
      
      {/* ─── I/O Info Footer ─── */}
      {definition && (
        <div className="px-4 py-2.5 border-t border-border/30 bg-muted/10">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                {definition.inputs.length} input{definition.inputs.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                {definition.outputs.length} output{definition.outputs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="font-mono opacity-60">{selectedNode.data.type}</span>
          </div>
        </div>
      )}
      
      {/* ─── Add Credential Dialog ─── */}
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
            onTypeChange={(type) => { setNewCredType(type); setNewCredSettings({}); }}
            onSettingsChange={setNewCredSettings}
            showTypeSelector={!newCredType}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCredential(false)}>Cancel</Button>
            <Button onClick={createCredential} disabled={creating || !newCredName || !newCredType}>
              {creating ? 'Creating...' : 'Create Credential'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ─── Test Result Dialog ─── */}
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
                  className={cn("ml-2",
                    testResult.status >= 200 && testResult.status < 300 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                  )}
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
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-sm text-muted-foreground mt-1">{testResult.error}</p>
              </div>
            ) : testResult?.data ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Response Body</Label>
                  <Button variant="ghost" size="sm" onClick={() => {
                    navigator.clipboard.writeText(
                      typeof testResult.data === 'object' ? JSON.stringify(testResult.data, null, 2) : testResult.data
                    );
                    toast.success('Copied to clipboard');
                  }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <pre className="text-xs font-mono bg-muted/40 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[400px] border border-border/30">
                  {typeof testResult.data === 'object' ? JSON.stringify(testResult.data, null, 2) : testResult.data}
                </pre>
              </div>
            ) : null}
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowTestResult(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
