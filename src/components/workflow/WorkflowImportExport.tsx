import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileJson, FileText, Copy, Check } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { toast } from 'sonner';

interface WorkflowImportExportProps {
  workflowName?: string;
}

export function WorkflowImportExport({ workflowName = 'workflow' }: WorkflowImportExportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml'>('json');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { nodes, edges, loadWorkflow } = useWorkflowStore();

  const exportWorkflow = (format: 'json' | 'yaml') => {
    const workflowData = {
      name: workflowName,
      version: '1.0',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.data.type,
        label: n.data.label,
        category: n.data.category,
        position: n.position,
        config: n.data.config,
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
      })),
    };

    let content: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify(workflowData, null, 2);
      filename = `${workflowName.replace(/\s+/g, '_')}.json`;
    } else {
      // Simple YAML conversion
      content = convertToYaml(workflowData);
      filename = `${workflowName.replace(/\s+/g, '_')}.yaml`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Workflow exported as ${format.toUpperCase()}`);
    setExportDialogOpen(false);
  };

  const convertToYaml = (obj: unknown, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => `${spaces}- ${convertToYaml(item, indent + 1).trim()}`).join('\n');
    }
    
    if (obj !== null && typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return entries.map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${convertToYaml(value, indent + 1)}`;
        }
        return `${spaces}${key}: ${JSON.stringify(value)}`;
      }).join('\n');
    }
    
    return String(obj);
  };

  const parseYaml = (yaml: string): unknown => {
    // Simple YAML parser for basic structures
    try {
      // Try JSON first (YAML is a superset of JSON)
      return JSON.parse(yaml);
    } catch {
      // Basic YAML parsing (handles simple key: value pairs)
      const lines = yaml.split('\n');
      const result: Record<string, unknown> = {};
      let currentArray: unknown[] | null = null;
      let arrayKey = '';

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        if (trimmed.startsWith('- ')) {
          if (currentArray) {
            currentArray.push(trimmed.slice(2));
          }
        } else if (trimmed.includes(':')) {
          const colonIndex = trimmed.indexOf(':');
          const key = trimmed.slice(0, colonIndex).trim();
          const value = trimmed.slice(colonIndex + 1).trim();

          if (value === '') {
            // Start of nested object or array
            currentArray = [];
            arrayKey = key;
          } else {
            result[key] = value.replace(/^["']|["']$/g, '');
            if (currentArray && arrayKey) {
              result[arrayKey] = currentArray;
              currentArray = null;
              arrayKey = '';
            }
          }
        }
      });

      return result;
    }
  };

  // Map n8n node types to internal node types
  const mapN8nType = (n8nType: string): { type: string; category: string } => {
    const typeMap: Record<string, { type: string; category: string }> = {
      'n8n-nodes-base.formTrigger': { type: 'form-trigger', category: 'Triggers' },
      'n8n-nodes-base.webhook': { type: 'webhook-trigger', category: 'Triggers' },
      'n8n-nodes-base.scheduleTrigger': { type: 'schedule-trigger', category: 'Triggers' },
      'n8n-nodes-base.manualTrigger': { type: 'manual-trigger', category: 'Triggers' },
      'n8n-nodes-base.emailTrigger': { type: 'email-trigger', category: 'Triggers' },
      'n8n-nodes-base.httpRequest': { type: 'http-request', category: 'Actions' },
      'n8n-nodes-base.if': { type: 'if-condition', category: 'Logic & Flow' },
      'n8n-nodes-base.switch': { type: 'switch', category: 'Logic & Flow' },
      'n8n-nodes-base.splitInBatches': { type: 'loop', category: 'Logic & Flow' },
      'n8n-nodes-base.merge': { type: 'merge', category: 'Logic & Flow' },
      'n8n-nodes-base.set': { type: 'set-data', category: 'Data Manipulation' },
      'n8n-nodes-base.code': { type: 'code-node', category: 'Actions' },
      'n8n-nodes-base.function': { type: 'code-node', category: 'Actions' },
      'n8n-nodes-base.googleSheets': { type: 'google-sheets', category: 'Productivity' },
      'n8n-nodes-base.slack': { type: 'slack-message', category: 'Communication' },
      'n8n-nodes-base.gmail': { type: 'gmail-send', category: 'Communication' },
      'n8n-nodes-base.sendEmail': { type: 'send-email', category: 'Actions' },
      'n8n-nodes-base.discord': { type: 'discord-message', category: 'Communication' },
      'n8n-nodes-base.telegram': { type: 'telegram-message', category: 'Communication' },
      'n8n-nodes-base.notion': { type: 'notion-page', category: 'Productivity' },
      'n8n-nodes-base.airtable': { type: 'airtable-record', category: 'Productivity' },
      'n8n-nodes-base.postgres': { type: 'postgres-query', category: 'Databases' },
      'n8n-nodes-base.mysql': { type: 'mysql-query', category: 'Databases' },
      'n8n-nodes-base.mongoDb': { type: 'mongodb-query', category: 'Databases' },
      'n8n-nodes-base.redis': { type: 'redis-command', category: 'Databases' },
      'n8n-nodes-base.stripe': { type: 'stripe-charge', category: 'Payments' },
      'n8n-nodes-base.wait': { type: 'delay', category: 'Logic & Flow' },
      'n8n-nodes-base.noOp': { type: 'no-op', category: 'Logic & Flow' },
      'n8n-nodes-base.stickyNote': { type: 'sticky-note', category: 'Custom Nodes' },
      'n8n-nodes-base.respondToWebhook': { type: 'webhook-response', category: 'Actions' },
      '@n8n/n8n-nodes-langchain.agent': { type: 'openai-gpt', category: 'AI & Machine Learning' },
      '@n8n/n8n-nodes-langchain.lmChatOpenAi': { type: 'openai-gpt', category: 'AI & Machine Learning' },
      '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': { type: 'google-gemini', category: 'AI & Machine Learning' },
      '@n8n/n8n-nodes-langchain.lmChatAnthropic': { type: 'anthropic-claude', category: 'AI & Machine Learning' },
      '@n8n/n8n-nodes-langchain.outputParserStructured': { type: 'json-parse', category: 'Data Manipulation' },
      'n8n-nodes-base.stickyNote': { type: 'sticky-note', category: 'Custom Nodes' },
    };

    if (typeMap[n8nType]) return typeMap[n8nType];

    // Fallback: try to derive a reasonable type
    const shortName = n8nType.replace('n8n-nodes-base.', '').replace('@n8n/n8n-nodes-langchain.', '');
    return { type: shortName, category: 'Actions' };
  };

  const isN8nFormat = (data: any): boolean => {
    // n8n exports have nodes with "type" like "n8n-nodes-base.xxx" and "connections" object
    return (
      data.nodes?.some?.((n: any) => 
        typeof n.type === 'string' && (n.type.includes('n8n-nodes-base') || n.type.includes('n8n-nodes-langchain'))
      ) || 
      data.connections !== undefined
    );
  };

  const convertN8nWorkflow = (data: any) => {
    // Filter out sticky notes and hidden sub-nodes
    const visibleNodes = (data.nodes || []).filter((n: any) => n.type !== 'n8n-nodes-base.stickyNote');

    const importedNodes = visibleNodes.map((n: any, index: number) => {
      const mapped = mapN8nType(n.type);
      return {
        id: n.id || `imported-${index}-${Date.now()}`,
        type: 'workflowNode',
        position: n.position 
          ? { x: n.position[0] ?? n.position.x ?? 100 + index * 250, y: n.position[1] ?? n.position.y ?? 100 }
          : { x: 100 + index * 250, y: 100 },
        data: {
          label: n.name || mapped.type,
          type: mapped.type,
          category: mapped.category,
          config: n.parameters || {},
        },
      };
    });

    // Convert n8n connections format: { "NodeName": { "main": [[{ "node": "TargetName", "type": "main", "index": 0 }]] } }
    const importedEdges: any[] = [];
    const nodeNameToId: Record<string, string> = {};
    visibleNodes.forEach((n: any, i: number) => {
      nodeNameToId[n.name] = n.id || `imported-${i}-${Date.now()}`;
    });

    if (data.connections) {
      Object.entries(data.connections).forEach(([sourceName, outputs]: [string, any]) => {
        const sourceId = nodeNameToId[sourceName];
        if (!sourceId || !outputs?.main) return;

        outputs.main.forEach((connections: any[]) => {
          if (!Array.isArray(connections)) return;
          connections.forEach((conn: any) => {
            const targetId = nodeNameToId[conn.node];
            if (targetId) {
              importedEdges.push({
                id: `edge-${importedEdges.length}-${Date.now()}`,
                source: sourceId,
                target: targetId,
                type: 'default',
                animated: true,
                style: { strokeWidth: 2, stroke: 'hsl(var(--primary) / 0.5)' },
              });
            }
          });
        });
      });
    }

    return { nodes: importedNodes, edges: importedEdges };
  };

  const importWorkflow = () => {
    if (!importData.trim()) {
      toast.error('Please paste workflow data');
      return;
    }

    try {
      let data: any;
      
      // Try JSON first, then YAML
      try {
        data = JSON.parse(importData);
      } catch {
        data = parseYaml(importData);
      }

      let importedNodes: any[];
      let importedEdges: any[];

      if (isN8nFormat(data)) {
        // n8n workflow format
        const converted = convertN8nWorkflow(data);
        importedNodes = converted.nodes;
        importedEdges = converted.edges;
        toast.info(`Detected n8n format — converted ${importedNodes.length} nodes`);
      } else {
        // Internal format
        if (!data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('Invalid workflow format: missing nodes array');
        }

        importedNodes = data.nodes.map((n: any, index: number) => ({
          id: n.id || `imported-${index}-${Date.now()}`,
          type: 'workflowNode',
          position: n.position || { x: 100 + index * 200, y: 100 },
          data: {
            label: n.label || n.type,
            type: n.type,
            category: n.category || 'Actions',
            config: n.config || {},
          },
        }));

        importedEdges = (data.edges || []).map((e: any, index: number) => ({
          id: `edge-${index}-${Date.now()}`,
          source: e.source,
          target: e.target,
          type: 'default',
          animated: true,
          style: { strokeWidth: 2, stroke: 'hsl(var(--primary) / 0.5)' },
        }));
      }

      loadWorkflow({ nodes: importedNodes, edges: importedEdges });
      toast.success(`Imported ${importedNodes.length} nodes and ${importedEdges.length} connections`);
      setImportDialogOpen(false);
      setImportData('');
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const getExportPreview = () => {
    const preview = {
      nodes: nodes.length,
      edges: edges.length,
      categories: [...new Set(nodes.map(n => n.data.category))],
    };
    return JSON.stringify(preview, null, 2);
  };

  const copyToClipboard = async () => {
    const workflowData = {
      name: workflowName,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.data.type,
        label: n.data.label,
        position: n.position,
        config: n.data.config,
      })),
      edges: edges.map(e => ({ source: e.source, target: e.target })),
    };

    await navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => exportWorkflow('json')}>
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportWorkflow('yaml')}>
            <FileText className="h-4 w-4 mr-2" />
            Export as YAML
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyToClipboard}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy to Clipboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Workflow</DialogTitle>
            <DialogDescription>
              Paste workflow JSON/YAML or upload a file
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Upload File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileImport}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
            </div>
            
            <div>
              <Label>Or Paste Data</Label>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder='{"nodes": [...], "edges": [...]}'
                className="font-mono text-xs h-40"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={importWorkflow}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
