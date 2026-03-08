import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { History, RotateCcw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWorkflowStore } from '@/stores/workflowStore';

interface Version {
  id: string;
  version_number: number;
  data: any;
  created_at: string;
  description: string | null;
}

interface VersionHistoryProps {
  workflowId: string;
}

export function VersionHistory({ workflowId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { setNodes, setEdges } = useWorkflowStore();

  useEffect(() => {
    if (open) fetchVersions();
  }, [open]);

  const fetchVersions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workflow_versions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Failed to load version history');
    } else {
      setVersions((data as any[]) || []);
    }
    setLoading(false);
  };

  const restoreVersion = async (version: Version) => {
    const workflowData = version.data as { nodes?: any[]; edges?: any[] };
    if (workflowData.nodes) setNodes(workflowData.nodes);
    if (workflowData.edges) setEdges(workflowData.edges);

    // Save to DB
    const { error } = await supabase
      .from('workflows')
      .update({ data: version.data })
      .eq('id', workflowId);

    if (error) {
      toast.error('Failed to restore version');
    } else {
      toast.success(`Restored to version ${version.version_number}`);
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No versions saved yet</p>
              <p className="text-xs mt-1">Versions are created each time you save</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary">v{version.version_number}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                  </div>
                  {version.description && (
                    <p className="text-xs text-muted-foreground mb-2">{version.description}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => restoreVersion(version)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore This Version
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
