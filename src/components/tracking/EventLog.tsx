import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Download, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

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

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['tracking-events', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const filtered = events.filter((e: any) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search && !e.event_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['event_name', 'source', 'destination', 'status', 'retry_count', 'created_at'];
    const csv = [headers.join(','), ...filtered.map((e: any) => headers.map(h => JSON.stringify(e[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tracking-events.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="retried">Retried</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
        <Button size="sm" variant="outline" onClick={exportCSV} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden sm:table-cell">Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Retries</TableHead>
                <TableHead className="hidden md:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No events found. Events will appear here once your pipelines start processing.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((event: any) => (
                  <TableRow key={event.id} className="cursor-pointer" onClick={() => setSelectedEvent(event)}>
                    <TableCell className="font-medium">{event.event_name}</TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell className="hidden sm:table-cell">{event.destination || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[event.status] || ''}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{event.retry_count}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event Detail Drawer */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
          </SheetHeader>
          {selectedEvent && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Name</p>
                <p className="text-foreground">{selectedEvent.event_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="outline" className={statusColors[selectedEvent.status] || ''}>
                  {selectedEvent.status}
                </Badge>
              </div>
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
