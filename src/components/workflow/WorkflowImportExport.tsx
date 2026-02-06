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

      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid workflow format: missing nodes array');
      }

      // Convert to internal format
      const importedNodes = data.nodes.map((n: any, index: number) => ({
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

      const importedEdges = (data.edges || []).map((e: any, index: number) => ({
        id: `edge-${index}-${Date.now()}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: 'hsl(var(--primary))' },
      }));

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
