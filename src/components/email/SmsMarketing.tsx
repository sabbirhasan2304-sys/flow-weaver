import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Smartphone, Plus, Send, MessageSquare, Users, BarChart3, Settings, Zap, Clock, AlertTriangle } from 'lucide-react';

interface SmsMessage {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'sent' | 'scheduled';
  recipients: number;
  delivered: number;
  clicked: number;
  created_at: string;
}

const MOCK_MESSAGES: SmsMessage[] = [
  { id: '1', name: 'Flash Sale Alert', message: '🔥 24HR FLASH SALE! Get 30% off everything. Shop now: {{link}}', status: 'sent', recipients: 2340, delivered: 2298, clicked: 456, created_at: '2026-02-10' },
  { id: '2', name: 'Order Confirmation', message: 'Hi {{first_name}}, your order #{{order_id}} has been confirmed! Track: {{link}}', status: 'sent', recipients: 890, delivered: 882, clicked: 567, created_at: '2026-02-08' },
  { id: '3', name: 'Appointment Reminder', message: 'Reminder: Your appointment is tomorrow at {{time}}. Reply YES to confirm.', status: 'scheduled', recipients: 150, delivered: 0, clicked: 0, created_at: '2026-02-12' },
];

export function SmsMarketing() {
  const [tab, setTab] = useState('messages');
  const [messages] = useState<SmsMessage[]>(MOCK_MESSAGES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', message: '', list_id: '' });
  const [smsEnabled, setSmsEnabled] = useState(false);

  const charCount = form.message.length;
  const segmentCount = Math.ceil(charCount / 160) || 1;

  const totalSent = messages.reduce((s, m) => s + m.recipients, 0);
  const totalDelivered = messages.reduce((s, m) => s + m.delivered, 0);
  const totalClicked = messages.reduce((s, m) => s + m.clicked, 0);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            SMS Marketing
          </h2>
          <p className="text-sm text-muted-foreground">Send targeted SMS campaigns to your contacts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New SMS</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create SMS Campaign</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Campaign Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Flash Sale Alert" /></div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Hi {{first_name}}, ..." rows={4} maxLength={480} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{charCount}/480 chars · {segmentCount} segment{segmentCount !== 1 ? 's' : ''}</span>
                    <span className="text-[10px] text-muted-foreground">Merge tags: {'{{first_name}}'}, {'{{link}}'}, {'{{company}}'}</span>
                  </div>
                </div>
                <div>
                  <Label>Send To</Label>
                  <Select value={form.list_id} onValueChange={v => setForm({...form, list_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select a contact list" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts with Phone</SelectItem>
                      <SelectItem value="engaged">Highly Engaged</SelectItem>
                      <SelectItem value="new">New Subscribers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => { toast.success('SMS campaign created as draft'); setDialogOpen(false); setForm({ name: '', message: '', list_id: '' }); }}>
                  Create Draft
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Send className="h-3 w-3" />Messages Sent</p>
          <p className="text-2xl font-bold mt-1">{totalSent.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" />Delivered</p>
          <p className="text-2xl font-bold mt-1">{totalDelivered.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{totalSent > 0 ? ((totalDelivered/totalSent)*100).toFixed(1) : 0}% rate</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />Clicks</p>
          <p className="text-2xl font-bold mt-1">{totalClicked.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{totalDelivered > 0 ? ((totalClicked/totalDelivered)*100).toFixed(1) : 0}% CTR</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" />Campaigns</p>
          <p className="text-2xl font-bold mt-1">{messages.length}</p>
        </CardContent></Card>
      </div>

      {/* Provider Setup Banner */}
      {!smsEnabled && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-sm">SMS Provider Not Configured</p>
                <p className="text-xs text-muted-foreground">Connect Twilio, Vonage, or another SMS provider to start sending</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSmsEnabled(true); toast.success('SMS provider configuration saved'); }}>
              <Settings className="h-3 w-3 mr-1" />Configure
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Messages table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[250px]">{m.message}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'sent' ? 'default' : m.status === 'scheduled' ? 'outline' : 'secondary'}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>{m.recipients.toLocaleString()}</TableCell>
                  <TableCell>{m.delivered.toLocaleString()}</TableCell>
                  <TableCell>{m.clicked.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.created_at}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Send className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
