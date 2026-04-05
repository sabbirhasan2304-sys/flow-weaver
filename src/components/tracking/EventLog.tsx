import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  delivered: 'bg-green-500/10 text-green-600 border-green-200',
  failed: 'bg-red-500/10 text-red-600 border-red-200',
  retried: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  pending: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

export function EventLog() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState('all');

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['tracking-events', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const filtered = events.filter((e: any) => {
    if (tab === 'dead-letter' && e.status !== 'failed') return false;
    if (tab === 'all' && statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search && !e.event_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFailed = () => {
    const failedIds = filtered.filter((e: any) => e.status === 'failed').map((e: any) => e.id);
    setSelectedIds(new Set(failedIds));
  };

  const replayEvents = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const { data, error } = await supabase.functions.invoke('replay-tracking-event', {
        body: { event_ids: ids },
      });
      if (error) throw error;
      toast.success(data?.message || `${ids.length} event(s) replayed`);
      setSelectedIds(new Set());
      refetch();
    } catch {
      toast.error('Replay failed');
    }
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['event_name', 'source', 'destination', 'status', 'retry_count', 'created_at'];
    const csv = [headers.join(','), ...filtered.map((e: any) => headers.map(h => JSON.stringify(e[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tracking-events.csv'; a.click();
  };

  const failedCount = events.filter((e: any) => e.status === 'failed').length;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="dead-letter" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Dead Letter Queue
            {failedCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{failedCount}</Badge>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {tab === 'all' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="retried">Retried</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
        {tab === 'dead-letter' && (
          <>
            <Button size="sm" variant="outline" onClick={selectAllFailed}>Select All Failed</Button>
            <Button size="sm" onClick={() => replayEvents(Array.from(selectedIds))} disabled={selectedIds.size === 0}>
              <RotateCcw className="h-4 w-4 mr-1" /> Replay ({selectedIds.size})
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={exportCSV} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {tab === 'dead-letter' && <TableHead className="w-[40px]"></TableHead>}
                <TableHead>Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden sm:table-cell">Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Retries</TableHead>
                <TableHead className="hidden md:table-cell">Time</TableHead>
                {tab === 'dead-letter' && <TableHead className="w-[80px]">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {tab === 'dead-letter' ? 'No failed events — all clear!' : 'No events found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((event: any) => (
                  <TableRow key={event.id} className="cursor-pointer" onClick={() => setSelectedEvent(event)}>
                    {tab === 'dead-letter' && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(event.id)} onCheckedChange={() => toggleSelect(event.id)} />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{event.event_name}</TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell className="hidden sm:table-cell">{event.destination || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[event.status] || ''}>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{event.retry_count}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</TableCell>
                    {tab === 'dead-letter' && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => replayEvents([event.id])}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Event Details</SheetTitle></SheetHeader>
          {selectedEvent && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Name</p>
                <p className="text-foreground">{selectedEvent.event_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="outline" className={statusColors[selectedEvent.status] || ''}>{selectedEvent.status}</Badge>
              </div>
              {selectedEvent.status === 'failed' && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Error Explanation</p>
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                    {(selectedEvent.response as any)?.error || 'Destination returned an error or was unreachable. Check destination credentials and retry.'}
                  </p>
                  <Button size="sm" className="mt-2" onClick={() => replayEvents([selectedEvent.id])}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Replay This Event
                  </Button>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payload</p>
                <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
              {selectedEvent.response && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response</p>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedEvent.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
