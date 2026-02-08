import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Play, Plus, Trash2, ChevronDown, ChevronRight, 
  Clock, CheckCircle2, XCircle, Loader2, Globe,
  Key, Copy, Download, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface TestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;
  size: number;
}

interface Credential {
  id: string;
  name: string;
  type: string;
  settings: Record<string, any>;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500',
  POST: 'bg-amber-500',
  PUT: 'bg-blue-500',
  PATCH: 'bg-violet-500',
  DELETE: 'bg-rose-500',
  HEAD: 'bg-slate-500',
  OPTIONS: 'bg-cyan-500',
};

export function ApiTestPanel() {
  const { activeWorkspace } = useAuth();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ]);
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([]);
  const [body, setBody] = useState('');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'apiKey' | 'credential'>('none');
  const [authValue, setAuthValue] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [apiKeyName, setApiKeyName] = useState('X-API-Key');
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('params');
  const [resultTab, setResultTab] = useState('body');
  const [headersOpen, setHeadersOpen] = useState(true);

  // Fetch credentials when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && activeWorkspace) {
      setCredentialsLoading(true);
      const { data } = await supabase
        .from('credentials')
        .select('id, name, type, settings')
        .eq('workspace_id', activeWorkspace.id);
      if (data) {
        setCredentials(data.map(c => ({
          ...c,
          settings: c.settings as Record<string, any>
        })));
      }
      setCredentialsLoading(false);
    }
  };

  const addKeyValuePair = (setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>) => {
    setter(prev => [...prev, { key: '', value: '', enabled: true }]);
  };

  const updateKeyValuePair = (
    index: number, 
    field: 'key' | 'value' | 'enabled', 
    value: string | boolean,
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  ) => {
    setter(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeKeyValuePair = (index: number, setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const buildUrl = () => {
    try {
      const baseUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(baseUrl);
      queryParams.filter(p => p.enabled && p.key).forEach(p => {
        urlObj.searchParams.append(p.key, p.value);
      });
      return urlObj.toString();
    } catch {
      return url;
    }
  };

  const buildHeaders = () => {
    const headerObj: Record<string, string> = {};
    headers.filter(h => h.enabled && h.key).forEach(h => {
      headerObj[h.key] = h.value;
    });

    // Add auth headers
    switch (authType) {
      case 'bearer':
        headerObj['Authorization'] = `Bearer ${authValue}`;
        break;
      case 'basic':
        const encoded = btoa(`${authUsername}:${authPassword}`);
        headerObj['Authorization'] = `Basic ${encoded}`;
        break;
      case 'apiKey':
        headerObj[apiKeyName] = authValue;
        break;
      case 'credential':
        // Get API key from selected credential
        const cred = credentials.find(c => c.id === selectedCredentialId);
        if (cred?.settings?.apiKey) {
          headerObj['Authorization'] = `Bearer ${cred.settings.apiKey}`;
        } else if (cred?.settings?.token) {
          headerObj['Authorization'] = `Bearer ${cred.settings.token}`;
        }
        break;
    }

    return headerObj;
  };

  const executeRequest = async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    const startTime = Date.now();

    try {
      const finalUrl = buildUrl();
      const finalHeaders = buildHeaders();

      const options: RequestInit = {
        method,
        headers: finalHeaders,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body;
      }

      const response = await fetch(finalUrl, options);
      const endTime = Date.now();
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get response body
      let responseBody: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const bodySize = new Blob([JSON.stringify(responseBody)]).size;

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: endTime - startTime,
        size: bodySize,
      });

      if (response.ok) {
        toast.success(`Request successful (${response.status})`);
      } else {
        toast.warning(`Request returned ${response.status}`);
      }
    } catch (err: any) {
      const endTime = Date.now();
      setError(err.message || 'Request failed');
      toast.error(err.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.body, null, 2));
      toast.success('Response copied to clipboard');
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-500';
    if (status >= 300 && status < 400) return 'text-amber-500';
    if (status >= 400 && status < 500) return 'text-orange-500';
    return 'text-rose-500';
  };

  const KeyValueEditor = ({ 
    items, 
    setter, 
    placeholder 
  }: { 
    items: KeyValuePair[], 
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    placeholder: { key: string, value: string }
  }) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => updateKeyValuePair(index, 'enabled', e.target.checked, setter)}
            className="h-4 w-4 rounded border-muted-foreground/30"
          />
          <Input
            placeholder={placeholder.key}
            value={item.key}
            onChange={(e) => updateKeyValuePair(index, 'key', e.target.value, setter)}
            className="flex-1 h-8 text-sm"
          />
          <Input
            placeholder={placeholder.value}
            value={item.value}
            onChange={(e) => updateKeyValuePair(index, 'value', e.target.value, setter)}
            className="flex-1 h-8 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => removeKeyValuePair(index, setter)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => addKeyValuePair(setter)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Row
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          API Tester
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            API Tester
          </DialogTitle>
          <DialogDescription>
            Test HTTP requests with your credentials before using them in workflows
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Request URL Bar */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex gap-2">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-28">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${METHOD_COLORS[method]}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map(m => (
                    <SelectItem key={m} value={m}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${METHOD_COLORS[m]}`} />
                        {m}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && executeRequest()}
              />
              <Button onClick={executeRequest} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>

          {/* Request Configuration */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left side - Request config */}
            <div className="w-1/2 border-r flex flex-col overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b h-10 px-2">
                  <TabsTrigger value="params" className="text-xs">
                    Params {queryParams.filter(p => p.enabled && p.key).length > 0 && 
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                        {queryParams.filter(p => p.enabled && p.key).length}
                      </Badge>
                    }
                  </TabsTrigger>
                  <TabsTrigger value="headers" className="text-xs">
                    Headers {headers.filter(h => h.enabled && h.key).length > 0 && 
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                        {headers.filter(h => h.enabled && h.key).length}
                      </Badge>
                    }
                  </TabsTrigger>
                  <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
                  <TabsTrigger value="auth" className="text-xs">
                    Auth {authType !== 'none' && 
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] bg-primary/20 text-primary">
                        <Key className="h-2 w-2" />
                      </Badge>
                    }
                  </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <TabsContent value="params" className="m-0">
                      <KeyValueEditor 
                        items={queryParams} 
                        setter={setQueryParams}
                        placeholder={{ key: 'Parameter', value: 'Value' }}
                      />
                    </TabsContent>

                    <TabsContent value="headers" className="m-0">
                      <KeyValueEditor 
                        items={headers} 
                        setter={setHeaders}
                        placeholder={{ key: 'Header', value: 'Value' }}
                      />
                    </TabsContent>

                    <TabsContent value="body" className="m-0">
                      <Textarea
                        placeholder='{"key": "value"}'
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="font-mono text-sm min-h-[200px]"
                      />
                    </TabsContent>

                    <TabsContent value="auth" className="m-0 space-y-4">
                      <div className="space-y-2">
                        <Label>Authentication Type</Label>
                        <Select value={authType} onValueChange={(v: any) => setAuthType(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select auth type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Auth</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="basic">Basic Auth</SelectItem>
                            <SelectItem value="apiKey">API Key</SelectItem>
                            <SelectItem value="credential">Use Saved Credential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <AnimatePresence mode="wait">
                        {authType === 'bearer' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                          >
                            <Label>Bearer Token</Label>
                            <Input
                              type="password"
                              placeholder="Enter your token"
                              value={authValue}
                              onChange={(e) => setAuthValue(e.target.value)}
                            />
                          </motion.div>
                        )}

                        {authType === 'basic' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label>Username</Label>
                              <Input
                                placeholder="Username"
                                value={authUsername}
                                onChange={(e) => setAuthUsername(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Password</Label>
                              <Input
                                type="password"
                                placeholder="Password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                              />
                            </div>
                          </motion.div>
                        )}

                        {authType === 'apiKey' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label>Header Name</Label>
                              <Input
                                placeholder="X-API-Key"
                                value={apiKeyName}
                                onChange={(e) => setApiKeyName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>API Key</Label>
                              <Input
                                type="password"
                                placeholder="Enter your API key"
                                value={authValue}
                                onChange={(e) => setAuthValue(e.target.value)}
                              />
                            </div>
                          </motion.div>
                        )}

                        {authType === 'credential' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                          >
                            <Label>Select Credential</Label>
                            <Select 
                              value={selectedCredentialId} 
                              onValueChange={setSelectedCredentialId}
                              disabled={credentialsLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={credentialsLoading ? "Loading..." : "Select a saved credential"} />
                              </SelectTrigger>
                              <SelectContent>
                                {credentials.length === 0 && !credentialsLoading && (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No credentials saved yet
                                  </div>
                                )}
                                {credentials.map(cred => (
                                  <SelectItem key={cred.id} value={cred.id}>
                                    <div className="flex items-center gap-2">
                                      <Key className="h-3 w-3" />
                                      <span>{cred.name}</span>
                                      <Badge variant="outline" className="text-[10px] ml-1">
                                        {cred.type}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedCredentialId && (
                              <p className="text-xs text-muted-foreground">
                                ✓ Will use saved API key from this credential
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>

            {/* Right side - Response */}
            <div className="w-1/2 flex flex-col overflow-hidden">
              <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/30">
                <span className="text-sm font-medium">Response</span>
                {result && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-mono font-bold ${getStatusColor(result.status)}`}>
                      {result.status} {result.statusText}
                    </span>
                    <span className="text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {result.time}ms
                    </span>
                    <span className="text-muted-foreground">
                      {(result.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}
              </div>

              {!result && !error && !isLoading && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Send className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Send a request to see the response</p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm text-muted-foreground">Sending request...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex-1 p-4">
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Request Failed</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <Tabs value={resultTab} onValueChange={setResultTab} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="w-full justify-start rounded-none border-b h-10 px-2">
                    <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
                    <TabsTrigger value="headers" className="text-xs">
                      Headers
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                        {Object.keys(result.headers).length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="flex-1">
                    <TabsContent value="body" className="m-0 p-4">
                      <div className="flex justify-end mb-2">
                        <Button variant="ghost" size="sm" onClick={copyResult}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {typeof result.body === 'object' 
                          ? JSON.stringify(result.body, null, 2)
                          : result.body
                        }
                      </pre>
                    </TabsContent>

                    <TabsContent value="headers" className="m-0 p-4">
                      <div className="space-y-1">
                        {Object.entries(result.headers).map(([key, value]) => (
                          <div key={key} className="flex text-xs font-mono">
                            <span className="text-primary font-medium min-w-[180px]">{key}:</span>
                            <span className="text-muted-foreground break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
