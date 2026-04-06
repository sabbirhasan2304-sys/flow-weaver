import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, RefreshCw, RotateCcw, AlertTriangle, Activity, Clock, Copy, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTrackingRealtime } from '@/hooks/useTrackingRealtime';

const statusColors: Record<string, string> = {
  delivered: 'bg-green-500/10 text-green-600 border-green-200',
  failed: 'bg-red-500/10 text-red-600 border-red-200',
  retried: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  pending: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

const statusIcons: Record<string, any> = {
  delivered: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-600" />,
  pending: <Clock className="h-3.5 w-3.5 text-blue-600" />,
  retried: <RefreshCw className="h-3.5 w-3.5 text-yellow-600" />,
};

export function EventLog() {
  const { profile } = useAuth();
  useTrackingRealtime(!!profile?.id);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['tracking-events', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Extract unique sources and destinations for filters
  const sources = useMemo(() => {
    const set = new Set(events.map((e: any) => e.source).filter(Boolean));
    return Array.from(set);
  }, [events]);

  const destinationsList = useMemo(() => {
    const set = new Set(events.map((e: any) => e.destination).filter(Boolean));
    return Array.from(set);
  }, [events]);

  const filtered = events.filter((e: any) => {
    if (tab === 'dead-letter' && e.status !== 'failed') return false;
    if (tab === 'retried' && e.retry_count === 0) return false;
    if (tab === 'all' && statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
    if (destinationFilter !== 'all' && e.destination !== destinationFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = e.event_name?.toLowerCase().includes(q);
      const matchPayload = JSON.stringify(e.payload || {}).toLowerCase().includes(q);
      const matchId = e.id?.toLowerCase().includes(q);
      if (!matchName && !matchPayload && !matchId) return false;
    }
    return true;
  });

  // Stats
  const totalCount = events.length;
  const deliveredCount = events.filter((e: any) => e.status === 'delivered').length;
  const failedCount = events.filter((e: any) => e.status === 'failed').length;
  const retriedCount = events.filter((e: any) => e.retry_count > 0).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const ids = filtered.map((e: any) => e.id);
    setSelectedIds(new Set(ids));
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
    const headers = ['id', 'event_name', 'source', 'destination', 'status', 'retry_count', 'event_fingerprint', 'created_at'];
    const csv = [headers.join(','), ...filtered.map((e: any) => headers.map(h => JSON.stringify(e[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tracking-events-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const copyField = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalCount, icon: Activity, color: 'text-primary' },
          { label: 'Delivered', value: deliveredCount, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Failed', value: failedCount, icon: XCircle, color: 'text-red-600' },
          { label: 'Retried', value: retriedCount, icon: RefreshCw, color: 'text-yellow-600' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${s.color}`} />
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Events ({totalCount})</TabsTrigger>
          <TabsTrigger value="dead-letter" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Dead Letter Queue
            {failedCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{failedCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="retried" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retried ({retriedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events, payloads, IDs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {tab === 'all' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="retried">Retried</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        )}
        {sources.length > 0 && (
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {destinationsList.length > 0 && (
          <Select value={destinationFilter} onValueChange={setDestinationFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Destination" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Destinations</SelectItem>
              {destinationsList.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
        {selectedIds.size > 0 && (
          <Button size="sm" onClick={() => replayEvents(Array.from(selectedIds))}>
            <RotateCcw className="h-4 w-4 mr-1" /> Replay ({selectedIds.size})
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={exportCSV} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      {/* Bulk actions */}
      {(tab === 'dead-letter' || selectedIds.size > 0) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button size="sm" variant="ghost" onClick={selectAllFiltered} className="text-xs h-7">
            Select All ({filtered.length})
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-xs h-7">
              Clear Selection
            </Button>
          )}
        </div>
      )}

      {/* Results info */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {totalCount} events
        {search && ` matching "${search}"`}
      </p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden sm:table-cell">Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Retries</TableHead>
                <TableHead className="hidden md:table-cell">Fingerprint</TableHead>
                <TableHead className="hidden md:table-cell">Time</TableHead>
                <TableHead className="w-[60px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading events...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {tab === 'dead-letter' ? (
                      <div><CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" /><p>No failed events — all clear!</p></div>
                    ) : (
                      <div><Activity className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No events found.</p></div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((event: any) => (
                  <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(event.id)} onCheckedChange={() => toggleSelect(event.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcons[event.status]}
                        <span className="font-medium text-sm">{event.event_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{event.source}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{event.destination || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[event.status] || ''}`}>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {event.retry_count > 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600">{event.retry_count}</Badge>
                      ) : '0'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {event.event_fingerprint ? (
                        <code className="text-[10px] text-muted-foreground">{event.event_fingerprint.slice(0, 12)}…</code>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {event.status === 'failed' && (
                        <Button size="sm" variant="ghost" onClick={() => replayEvents([event.id])} title="Replay">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event Detail Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Event Details</SheetTitle></SheetHeader>
          {selectedEvent && (
            <div className="mt-4 space-y-4">
              {/* Status + Meta */}
              <div className="flex items-center gap-2">
                {statusIcons[selectedEvent.status]}
                <Badge variant="outline" className={statusColors[selectedEvent.status] || ''}>{selectedEvent.status}</Badge>
                {selectedEvent.retry_count > 0 && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">{selectedEvent.retry_count} retries</Badge>
                )}
              </div>

              {/* Key fields */}
              {[
                { label: 'Event ID', value: selectedEvent.id },
                { label: 'Event Name', value: selectedEvent.event_name },
                { label: 'Source', value: selectedEvent.source },
                { label: 'Destination', value: selectedEvent.destination || '—' },
                { label: 'Fingerprint', value: selectedEvent.event_fingerprint || '—' },
                { label: 'Time', value: new Date(selectedEvent.created_at).toLocaleString() },
              ].map((field) => (
                <div key={field.label}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    {field.value !== '—' && (
                      <Button size="sm" variant="ghost" className="h-5 px-1" onClick={() => copyField(field.value, field.label)}>
                        {copiedField === field.label ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground font-mono break-all">{field.value}</p>
                </div>
              ))}

              {/* Error */}
              {selectedEvent.status === 'failed' && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Error</p>
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200">
                    {(selectedEvent.response as any)?.error || 'Destination returned an error or was unreachable. Check destination credentials and retry.'}
                  </p>
                  <Button size="sm" className="mt-2" onClick={() => replayEvents([selectedEvent.id])}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Replay This Event
                  </Button>
                </div>
              )}

              {/* Payload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground">Payload</p>
                  <Button size="sm" variant="ghost" className="h-5 px-1" onClick={() => copyField(JSON.stringify(selectedEvent.payload, null, 2), 'Payload')}>
                    {copiedField === 'Payload' ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[250px] font-mono border">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              {/* Response */}
              {selectedEvent.response && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Response</p>
                    <Button size="sm" variant="ghost" className="h-5 px-1" onClick={() => copyField(JSON.stringify(selectedEvent.response, null, 2), 'Response')}>
                      {copiedField === 'Response' ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[200px] font-mono border">
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