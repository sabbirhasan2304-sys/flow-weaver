import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { nodeDefinitions, getCategoriesWithCounts } from '@/data/nodeDefinitions';
import { CATEGORY_COLORS } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflowStore';
import { 
  LayoutGrid, Search, TrendingUp, Layers, 
  CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff,
  Star, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function NodeDashboard() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { nodes } = useWorkflowStore();

  const categoryCounts = useMemo(() => getCategoriesWithCounts(), []);
  const totalNodes = nodeDefinitions.length;

  // Nodes used in current workflow
  const usedNodeTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach(n => {
      const type = n.data?.type as string;
      if (type) counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  // Connection health from current workflow
  const connectionHealth = useMemo(() => {
    let connected = 0;
    let error = 0;
    let unconfigured = 0;

    nodes.forEach(n => {
      const status = (n.data as any)?.credentialStatus?.status;
      if (status === 'success') connected++;
      else if (status === 'error') error++;
      else unconfigured++;
    });

    return { connected, error, unconfigured, total: nodes.length };
  }, [nodes]);

  // Filtered node list
  const filteredDefinitions = useMemo(() => {
    let defs = nodeDefinitions;
    if (selectedCategory) {
      defs = defs.filter(d => d.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      defs = defs.filter(d =>
        d.displayName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );
    }
    return defs;
  }, [search, selectedCategory]);

  // Favorites from localStorage
  const favorites = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('biztori-favorite-nodes') || '[]') as string[];
    } catch { return []; }
  }, [open]);

  // Recently used
  const recents = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('biztori-recent-nodes') || '[]') as string[];
    } catch { return []; }
  }, [open]);

  const sortedCategories = useMemo(() => {
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]);
  }, [categoryCounts]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Nodes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Node Dashboard
            <Badge variant="secondary" className="ml-2 text-xs">{totalNodes} nodes</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Total Nodes</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{totalNodes}</div>
            <div className="text-[10px] text-muted-foreground">{Object.keys(categoryCounts).length} categories</div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">In Workflow</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{nodes.length}</div>
            <div className="text-[10px] text-muted-foreground">{Object.keys(usedNodeTypes).length} unique types</div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">Connected</span>
            </div>
            <div className="text-2xl font-bold text-emerald-500">{connectionHealth.connected}</div>
            <div className="text-[10px] text-muted-foreground">of {connectionHealth.total} nodes</div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              {connectionHealth.error > 0 ? (
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <Wifi className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {connectionHealth.error > 0 ? 'Errors' : 'Health'}
              </span>
            </div>
            <div className={cn("text-2xl font-bold", connectionHealth.error > 0 ? "text-destructive" : "text-primary")}>
              {connectionHealth.error > 0 ? connectionHealth.error : '100%'}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {connectionHealth.error > 0 ? 'need attention' : 'all healthy'}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
              !selectedCategory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            )}
          >
            All ({totalNodes})
          </button>
          {sortedCategories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5',
                selectedCategory === cat
                  ? 'text-primary-foreground border-transparent'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              )}
              style={selectedCategory === cat ? { 
                backgroundColor: CATEGORY_COLORS[cat] || '#6366f1'
              } : undefined}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6366f1' }}
              />
              {cat} ({count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes by name, type, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick Sections */}
        {!search && !selectedCategory && (favorites.length > 0 || recents.length > 0) && (
          <div className="flex gap-4 text-xs">
            {favorites.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-3 w-3 text-amber-500" />
                <span>{favorites.length} favorites</span>
              </div>
            )}
            {recents.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{recents.length} recent</span>
              </div>
            )}
          </div>
        )}

        {/* Node Grid */}
        <ScrollArea className="flex-1 -mx-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-2 pb-4">
            {filteredDefinitions.map(node => {
              const isUsed = !!usedNodeTypes[node.type];
              const useCount = usedNodeTypes[node.type] || 0;
              const isFav = favorites.includes(node.type);
              return (
                <div
                  key={node.type}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border transition-all',
                    isUsed
                      ? 'border-primary/20 bg-primary/5'
                      : 'border-border/50 bg-card hover:bg-muted/50'
                  )}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: `${node.color}15` }}
                  >
                    <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: node.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{node.displayName}</span>
                      {isFav && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate block">{node.category}</span>
                  </div>
                  {isUsed && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      ×{useCount}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
