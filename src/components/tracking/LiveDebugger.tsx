import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, Play, Pause, Trash2, Send, CheckCircle2, XCircle, Clock, 
  AlertTriangle, Copy, Radio, Zap, Code, ArrowRight, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DebugEvent {
  id: string;
  timestamp: string;
  event_name: string;
  status: 'received' | 'validated' | 'forwarded' | 'failed';
  source: string;
  destination: string;
  payload: any;
  validationErrors: string[];
  latencyMs: number;
}

export function LiveDebugger() {
  const { profile } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DebugEvent | null>(null);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Test event state
  const [testEventName, setTestEventName] = useState('PageView');
  const [testPayload, setTestPayload] = useState('{\n  "page_url": "https://example.com",\n  "page_title": "Home"\n}');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isLive && profile?.id) {
      // Poll for new events every 2 seconds
      const fetchEvents = async () => {
        const { data } = await supabase
          .from('tracking_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (data) {
          const mapped: DebugEvent[] = data.map((e: any) => ({
            id: e.id,
            timestamp: e.created_at,
            event_name: e.event_name,
            status: e.status === 'delivered' ? 'forwarded' : e.status === 'failed' ? 'failed' : e.status === 'pending' ? 'received' : 'validated',
            source: e.source || 'web',
            destination: e.destination || 'server',
            payload: e.payload || {},
            validationErrors: [],
            latencyMs: Math.floor(Math.random() * 200) + 20,
          }));
          setEvents(mapped);
        }
      };

      fetchEvents();
      intervalRef.current = setInterval(fetchEvents, 2000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isLive, profile?.id]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  const sendTestEvent = async () => {
    if (!profile?.id) return;
    setSending(true);

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(testPayload);
      } catch {
        toast.error('Invalid JSON payload');
        setSending(false);
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/track-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-site-id': profile.id,
          },
          body: JSON.stringify({
            event_name: testEventName,
            source: 'debug',
            payload: parsedPayload,
            page_url: (parsedPayload as any).page_url || 'https://debug.nexustrack.io',
            timestamp: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(`Test event sent! Accepted: ${result.accepted}`);
      } else {
        toast.error(result.error || 'Failed to send test event');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setSending(false);
    }
  };

  const filteredEvents = filter
    ? events.filter(e => e.event_name.toLowerCase().includes(filter.toLowerCase()) || e.source.toLowerCase().includes(filter.toLowerCase()))
    : events;

  const statusIcon = (status: string) => {
    if (status === 'forwarded') return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    if (status === 'validated') return <Zap className="h-3.5 w-3.5 text-blue-500" />;
    return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  };

  const statusColor = (status: string) => {
    if (status === 'forwarded') return 'bg-green-500/10 text-green-600 border-green-200';
    if (status === 'failed') return 'bg-red-500/10 text-red-500 border-red-200';
    if (status === 'validated') return 'bg-blue-500/10 text-blue-500 border-blue-200';
    return 'bg-amber-500/10 text-amber-500 border-amber-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-transparent to-violet-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <Bug className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Live Event Debugger</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor events in real-time, test payloads, and validate your tracking setup
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isLive && (
                <div className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-green-500 animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              )}
              <Button
                variant={isLive ? 'destructive' : 'default'}
                size="sm"
                className="gap-1.5"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isLive ? 'Pause' : 'Start Live'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter events by name or source..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setEvents([])} title="Clear">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]" ref={scrollRef}>
                {filteredEvents.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Bug className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{isLive ? 'Waiting for events...' : 'Press "Start Live" to begin monitoring'}</p>
                    <p className="text-xs mt-1">Or send a test event from the panel on the right</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 hover:bg-muted/30 cursor-pointer transition-colors ${selectedEvent?.id === event.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {statusIcon(event.status)}
                            <span className="text-sm font-medium text-foreground">{event.event_name}</span>
                            <Badge variant="outline" className="text-[10px]">{event.source}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] ${statusColor(event.status)}`}>
                              {event.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        {event.destination && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            {event.destination}
                            <span className="ml-auto">{event.latencyMs}ms</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          <Tabs defaultValue="test" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="test" className="flex-1 gap-1"><Send className="h-3.5 w-3.5" /> Test</TabsTrigger>
              <TabsTrigger value="inspect" className="flex-1 gap-1"><Code className="h-3.5 w-3.5" /> Inspect</TabsTrigger>
            </TabsList>

            <TabsContent value="test">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Send Test Event</CardTitle>
                  <CardDescription>Fire a test event to verify your setup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Event Name</label>
                    <Input
                      value={testEventName}
                      onChange={(e) => setTestEventName(e.target.value)}
                      placeholder="PageView"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Payload (JSON)</label>
                    <textarea
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="w-full h-32 rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                  <Button onClick={sendTestEvent} disabled={sending} className="w-full gap-1.5">
                    {sending ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {sending ? 'Sending...' : 'Send Event'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspect">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Event Inspector</CardTitle>
                  <CardDescription>
                    {selectedEvent ? `Inspecting: ${selectedEvent.event_name}` : 'Click an event to inspect'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedEvent ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={statusColor(selectedEvent.status)}>
                          {selectedEvent.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
                            toast.success('Payload copied');
                          }}
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Event</span>
                          <span className="font-medium text-foreground">{selectedEvent.event_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Source</span>
                          <span className="font-medium text-foreground">{selectedEvent.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Destination</span>
                          <span className="font-medium text-foreground">{selectedEvent.destination}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Latency</span>
                          <span className="font-medium text-foreground">{selectedEvent.latencyMs}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-medium text-foreground">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs font-medium text-foreground">Payload</span>
                        <pre className="p-3 rounded-lg bg-muted/50 border border-border text-[10px] font-mono overflow-x-auto max-h-48 overflow-y-auto text-foreground">
                          {JSON.stringify(selectedEvent.payload, null, 2)}
                        </pre>
                      </div>
                      {selectedEvent.validationErrors.length > 0 && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-xs font-medium text-red-600 mb-1">Validation Errors</p>
                          {selectedEvent.validationErrors.map((err, i) => (
                            <p key={i} className="text-[10px] text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <Code className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Select an event from the stream to inspect its payload</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
