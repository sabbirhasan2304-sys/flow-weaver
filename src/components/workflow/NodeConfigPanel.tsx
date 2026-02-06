import { useWorkflowStore, NodeData } from '@/stores/workflowStore';
import { getNodeDefinition } from '@/data/nodeDefinitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Settings, Trash2, Copy, Play } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types/nodes';
import { toast } from 'sonner';
import { ExpressionEditor } from './ExpressionEditor';

export function NodeConfigPanel() {
  const { selectedNode, updateNode, deleteNode, selectNode } = useWorkflowStore();
  
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
  
  const handleTestNode = () => {
    toast.info('Testing node (feature coming soon)');
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
        return (
          <Select
            value={String(value)}
            onValueChange={(v) => handleConfigChange(field.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select credential" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">+ Add new credential</SelectItem>
            </SelectContent>
          </Select>
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
          >
            <Play className="h-3 w-3 mr-1" />
            Test
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
    </div>
  );
}
