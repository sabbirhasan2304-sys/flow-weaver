import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Save, Play, Trash2 } from 'lucide-react';
import { trackingNodeDefinitions, getNodesByCategory, type TrackingNodeDef } from './trackingNodeDefinitions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

function TrackingNode({ data }: { data: any }) {
  return (
    <div className="rounded-lg border-2 bg-background shadow-md px-4 py-3 min-w-[160px]" style={{ borderColor: data.color }}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{data.icon}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{data.label}</p>
          <Badge variant="outline" className="text-[10px] mt-0.5">{data.category}</Badge>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { trackingNode: TrackingNode };

export function PipelineBuilder() {
  const { profile } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pipelineName, setPipelineName] = useState('');
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'source' | 'transform' | 'destination'>('source');
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  }, [setEdges]);

  const addNode = (def: TrackingNodeDef) => {
    const newNode: Node = {
      id: `${def.type}-${Date.now()}`,
      type: 'trackingNode',
      position: { x: 250 + Math.random() * 200, y: 100 + nodes.length * 120 },
      data: { label: def.label, icon: def.icon, category: def.category, color: def.color, nodeType: def.type },
    };
    setNodes((nds) => [...nds, newNode]);
    setAddNodeOpen(false);
  };

  const savePipeline = async () => {
    if (!profile?.id || !pipelineName.trim()) {
      toast.error('Please enter a pipeline name');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('tracking_pipelines').insert({
      user_id: profile.id,
      name: pipelineName,
      status: 'draft',
      pipeline_data: { nodes, edges } as any,
    });
    setSaving(false);
    if (error) {
      toast.error('Failed to save pipeline');
    } else {
      toast.success('Pipeline saved!');
    }
  };

  const categories = ['source', 'transform', 'destination'] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Pipeline name..."
          value={pipelineName}
          onChange={(e) => setPipelineName(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => setAddNodeOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Node
        </Button>
        <Button size="sm" variant="outline" onClick={savePipeline} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[500px] rounded-lg overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-muted/30"
            >
              <Background gap={20} size={1} />
              <Controls />
              <MiniMap zoomable pannable className="!bg-background" />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Add Node Dialog */}
      <Dialog open={addNodeOpen} onOpenChange={setAddNodeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Tracking Node</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat}s
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
            {getNodesByCategory(selectedCategory).map((def) => (
              <button
                key={def.type}
                onClick={() => addNode(def)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <span className="text-xl">{def.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{def.label}</p>
                  <p className="text-xs text-muted-foreground">{def.description}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
