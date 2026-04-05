import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wand2, ArrowRight, CheckCircle2, AlertTriangle, Copy, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Mapping {
  source_field: string;
  destination_field: string;
  transform: string;
  default_value?: string;
  confidence: number;
  notes?: string;
}

interface MappingResult {
  mappings: Mapping[];
  unmapped_required: { field: string; suggestion: string }[];
  detected_event_type: string;
  summary: string;
}

const sampleEvent = `{
  "event": "purchase",
  "ecommerce": {
    "transaction_id": "T12345",
    "value": 59.99,
    "currency": "USD",
    "items": [
      {
        "item_id": "SKU001",
        "item_name": "Blue T-Shirt",
        "price": 29.99,
        "quantity": 2
      }
    ]
  },
  "user": {
    "email": "john@example.com",
    "phone": "+1234567890",
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  },
  "page_url": "https://shop.example.com/checkout/success"
}`;

const destinations = [
  { value: 'meta_capi', label: 'Meta Conversions API' },
  { value: 'ga4', label: 'Google Analytics 4' },
  { value: 'tiktok', label: 'TikTok Events API' },
  { value: 'google_ads', label: 'Google Ads Enhanced Conversions' },
  { value: 'snapchat', label: 'Snapchat CAPI' },
  { value: 'pinterest', label: 'Pinterest CAPI' },
  { value: 'linkedin', label: 'LinkedIn CAPI' },
  { value: 'klaviyo', label: 'Klaviyo' },
];

export function AIEventMapper() {
  const { profile } = useAuth();
  const [rawEvent, setRawEvent] = useState(sampleEvent);
  const [destination, setDestination] = useState('meta_capi');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MappingResult | null>(null);

  const runMapping = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(rawEvent);
    } catch {
      toast.error('Invalid JSON. Please check your event payload.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-event-mapper', {
        body: { rawEvent: parsed, destination },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success('Mapping generated!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate mapping');
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    if (!profile?.id || !result) return;
    try {
      // Check for existing collection
      let { data: cols } = await supabase.from('nexus_store_collections')
        .select('id').eq('name', 'event_mappings').eq('user_id', profile.id).limit(1);
      
      let collectionId: string;
      if (cols && cols.length > 0) {
        collectionId = cols[0].id;
      } else {
        const { data: newCol, error } = await supabase.from('nexus_store_collections')
          .insert({ user_id: profile.id, name: 'event_mappings', description: 'AI-generated event field mappings' })
          .select('id').single();
        if (error) throw error;
        collectionId = newCol.id;
      }

      await supabase.from('nexus_store_documents').insert({
        collection_id: collectionId,
        user_id: profile.id,
        data: { destination, ...result, saved_at: new Date().toISOString() } as any,
      });
      toast.success('Mapping saved to NexusStore!');
    } catch {
      toast.error('Failed to save mapping');
    }
  };

  const copyMapping = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.mappings, null, 2));
    toast.success('Mapping copied to clipboard');
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-green-600';
    if (c >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> AI Event Mapper
          </CardTitle>
          <CardDescription>
            Paste a raw dataLayer/webhook event and let AI map fields to any destination schema automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label>Raw Event JSON</Label>
              <Textarea
                value={rawEvent}
                onChange={(e) => setRawEvent(e.target.value)}
                className="font-mono text-xs h-[300px]"
                placeholder="Paste your dataLayer event, webhook payload, or any JSON..."
              />
            </div>
            <div>
              <Label>Target Destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Paste your raw event payload (dataLayer push, webhook body, etc.)</li>
                  <li>Select the destination platform</li>
                  <li>AI analyzes the structure and maps fields to the destination schema</li>
                  <li>Review mappings, adjust if needed, then save to NexusStore</li>
                </ol>
              </div>
            </div>
          </div>
          <Button onClick={runMapping} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <><Wand2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing & Mapping...</>
            ) : (
              <><Wand2 className="h-4 w-4 mr-2" /> Generate Mapping</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Mapping Result</CardTitle>
                  <CardDescription>{result.summary}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{result.detected_event_type}</Badge>
                  <Badge>{result.mappings.length} fields mapped</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Field</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Destination Field</TableHead>
                    <TableHead>Transform</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.mappings.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{m.source_field}</TableCell>
                      <TableCell><ArrowRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                      <TableCell className="font-mono text-xs">{m.destination_field}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {m.transform === 'none' ? 'direct' : m.transform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${confidenceColor(m.confidence)}`}>
                          {(m.confidence * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {result.unmapped_required.length > 0 && (
            <Card className="border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" /> Missing Required Fields
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.unmapped_required.map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-yellow-500/5 border border-yellow-500/20">
                      <span className="font-mono text-xs">{u.field}</span>
                      <span className="text-xs text-muted-foreground">{u.suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={copyMapping} className="flex-1">
              <Copy className="h-4 w-4 mr-2" /> Copy Mapping
            </Button>
            <Button onClick={saveMapping} className="flex-1">
              <Save className="h-4 w-4 mr-2" /> Save to NexusStore
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
