import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Plus, Shield, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, Mail, Edit, Trash2, UserPlus } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'approver';
  status: 'active' | 'invited' | 'disabled';
  lastActive: string;
}

interface ApprovalRequest {
  id: string;
  type: 'campaign' | 'automation' | 'template';
  name: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: 'campaign' | 'automation' | 'social' | 'meeting';
  date: string;
  color: string;
}

const MOCK_MEMBERS: TeamMember[] = [
  { id: '1', name: 'John Smith', email: 'john@company.com', role: 'admin', status: 'active', lastActive: '2 min ago' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'editor', status: 'active', lastActive: '1 hour ago' },
  { id: '3', name: 'Mike Chen', email: 'mike@company.com', role: 'approver', status: 'active', lastActive: '3 hours ago' },
  { id: '4', name: 'Emily Davis', email: 'emily@company.com', role: 'viewer', status: 'invited', lastActive: 'Never' },
];

const MOCK_APPROVALS: ApprovalRequest[] = [
  { id: '1', type: 'campaign', name: 'Valentine\'s Day Promo', requestedBy: 'Sarah Johnson', status: 'pending', createdAt: '2026-02-12' },
  { id: '2', type: 'automation', name: 'New Onboarding Flow', requestedBy: 'Mike Chen', status: 'approved', createdAt: '2026-02-10' },
  { id: '3', type: 'campaign', name: 'February Newsletter', requestedBy: 'Sarah Johnson', status: 'rejected', createdAt: '2026-02-08' },
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Valentine\'s Day Campaign', type: 'campaign', date: '2026-02-14', color: 'bg-red-500' },
  { id: '2', title: 'Weekly Newsletter', type: 'campaign', date: '2026-02-16', color: 'bg-blue-500' },
  { id: '3', title: 'Social Media Batch', type: 'social', date: '2026-02-15', color: 'bg-pink-500' },
  { id: '4', title: 'Marketing Sync', type: 'meeting', date: '2026-02-17', color: 'bg-purple-500' },
  { id: '5', title: 'Cart Recovery A/B Test', type: 'automation', date: '2026-02-18', color: 'bg-orange-500' },
];

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features', color: 'text-red-600' },
  { value: 'editor', label: 'Editor', description: 'Create and edit campaigns, needs approval to send', color: 'text-blue-600' },
  { value: 'approver', label: 'Approver', description: 'Review and approve campaigns before sending', color: 'text-green-600' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to analytics and reports', color: 'text-muted-foreground' },
];

export function TeamManagement() {
  const [tab, setTab] = useState('team');
  const [members] = useState<TeamMember[]>(MOCK_MEMBERS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(MOCK_APPROVALS);
  const [events] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'editor' });

  const handleApproval = (id: string, status: 'approved' | 'rejected') => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success(`Request ${status}`);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team & Calendar
          </h2>
          <p className="text-sm text-muted-foreground">Manage team roles, approvals, and marketing calendar</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="team" className="gap-1"><Users className="h-3.5 w-3.5" />Team</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1"><Shield className="h-3.5 w-3.5" />Approvals <Badge variant="secondary" className="ml-1 text-[9px] px-1">{approvals.filter(a => a.status === 'pending').length}</Badge></TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1"><Calendar className="h-3.5 w-3.5" />Calendar</TabsTrigger>
        </TabsList>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild><Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Invite Member</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Email</Label><Input value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} placeholder="colleague@company.com" /></div>
                  <div>
                    <Label>Role</Label>
                    <Select value={inviteForm.role} onValueChange={v => setInviteForm({...inviteForm, role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label} — {r.description}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                  <Button onClick={() => { toast.success('Invitation sent'); setInviteOpen(false); }}>Send Invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${ROLES.find(r => r.value === m.role)?.color}`}>{m.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.lastActive}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <div className="space-y-3">
            {approvals.map(a => (
              <Card key={a.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${a.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : a.status === 'approved' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {a.status === 'pending' ? <Clock className="h-4 w-4" /> : a.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] mr-1">{a.type}</Badge>
                        by {a.requestedBy} · {a.createdAt}
                      </p>
                    </div>
                  </div>
                  {a.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-green-600 h-7" onClick={() => handleApproval(a.id, 'approved')}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 h-7" onClick={() => handleApproval(a.id, 'rejected')}>
                        <XCircle className="h-3 w-3 mr-1" />Reject
                      </Button>
                    </div>
                  )}
                  {a.status !== 'pending' && (
                    <Badge variant={a.status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">{a.status}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">February 2026</CardTitle>
              <CardDescription>Upcoming marketing events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
                  <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className={`w-1 h-8 rounded-full ${event.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{event.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
