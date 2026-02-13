import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Shield, Lock, FileText, AlertTriangle, CheckCircle2, Clock, Download, Trash2, Eye, Key, UserX, Globe, ScrollText } from 'lucide-react';

interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  category: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  type: 'info' | 'warning' | 'critical';
}

interface DataRequest {
  id: string;
  type: 'export' | 'delete' | 'access';
  email: string;
  status: 'pending' | 'completed' | 'in_progress';
  requestedAt: string;
  completedAt: string | null;
}

const COMPLIANCE_CHECKS: ComplianceCheck[] = [
  { id: '1', name: 'Double Opt-in Enabled', description: 'New subscribers must confirm via email', status: 'pass', category: 'Consent' },
  { id: '2', name: 'Unsubscribe Link Present', description: 'All emails contain an unsubscribe link', status: 'pass', category: 'Consent' },
  { id: '3', name: 'Privacy Policy Link', description: 'Privacy policy linked in signup forms', status: 'warning', category: 'Privacy' },
  { id: '4', name: 'Data Retention Policy', description: 'Auto-delete inactive data after set period', status: 'fail', category: 'Data' },
  { id: '5', name: 'Encryption at Rest', description: 'Contact data encrypted in database', status: 'pass', category: 'Security' },
  { id: '6', name: 'Access Logging', description: 'All data access is logged and auditable', status: 'pass', category: 'Security' },
  { id: '7', name: 'Consent Records', description: 'Timestamp and source of consent stored', status: 'pass', category: 'Consent' },
  { id: '8', name: 'Data Processing Agreement', description: 'DPA signed with all sub-processors', status: 'warning', category: 'Legal' },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: '1', action: 'Contact Export', user: 'john@company.com', details: 'Exported 2,340 contacts to CSV', timestamp: '2026-02-13T10:30:00Z', type: 'info' },
  { id: '2', action: 'Bulk Delete', user: 'sarah@company.com', details: 'Deleted 45 bounced contacts', timestamp: '2026-02-12T15:20:00Z', type: 'warning' },
  { id: '3', action: 'SMTP Config Changed', user: 'john@company.com', details: 'Updated SMTP password for main config', timestamp: '2026-02-11T09:15:00Z', type: 'critical' },
  { id: '4', action: 'Campaign Sent', user: 'sarah@company.com', details: 'Sent "February Newsletter" to 1,200 contacts', timestamp: '2026-02-10T14:00:00Z', type: 'info' },
  { id: '5', action: 'Data Request Completed', user: 'system', details: 'GDPR data export for user@example.com', timestamp: '2026-02-09T11:45:00Z', type: 'info' },
];

const MOCK_REQUESTS: DataRequest[] = [
  { id: '1', type: 'export', email: 'user@example.com', status: 'completed', requestedAt: '2026-02-09', completedAt: '2026-02-09' },
  { id: '2', type: 'delete', email: 'another@example.com', status: 'pending', requestedAt: '2026-02-12', completedAt: null },
  { id: '3', type: 'access', email: 'customer@test.com', status: 'in_progress', requestedAt: '2026-02-11', completedAt: null },
];

export function GdprCompliance() {
  const [tab, setTab] = useState('compliance');
  const [settings, setSettings] = useState({
    doubleOptIn: true,
    autoDelete: false,
    retentionDays: 365,
    consentRecording: true,
    ipAnonymization: false,
  });

  const passCount = COMPLIANCE_CHECKS.filter(c => c.status === 'pass').length;
  const complianceScore = Math.round((passCount / COMPLIANCE_CHECKS.length) * 100);

  const statusIcon = (status: string) => {
    if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Compliance & Security
          </h2>
          <p className="text-sm text-muted-foreground">GDPR compliance, audit logs, and data protection</p>
        </div>
        <Badge variant={complianceScore >= 80 ? 'default' : complianceScore >= 50 ? 'secondary' : 'destructive'} className="text-sm px-3 py-1">
          {complianceScore}% Compliant
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="compliance" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Compliance</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1"><ScrollText className="h-3.5 w-3.5" />Audit Log</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1"><FileText className="h-3.5 w-3.5" />Data Requests</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1"><Lock className="h-3.5 w-3.5" />Privacy Settings</TabsTrigger>
        </TabsList>

        {/* Compliance Dashboard */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Progress value={complianceScore} className="flex-1" />
                <span className="text-2xl font-bold">{complianceScore}%</span>
              </div>
              <div className="space-y-2">
                {COMPLIANCE_CHECKS.map(check => (
                  <div key={check.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                    {statusIcon(check.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{check.category}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_AUDIT_LOGS.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-sm">{log.action}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{log.details}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={log.type === 'critical' ? 'destructive' : log.type === 'warning' ? 'secondary' : 'outline'} className="text-[10px]">{log.type}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Requests */}
        <TabsContent value="requests" className="space-y-4">
          <div className="space-y-3">
            {MOCK_REQUESTS.map(req => (
              <Card key={req.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${req.type === 'delete' ? 'bg-red-500/10 text-red-600' : req.type === 'export' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'}`}>
                      {req.type === 'delete' ? <UserX className="h-4 w-4" /> : req.type === 'export' ? <Download className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{req.type} Request</p>
                      <p className="text-xs text-muted-foreground">{req.email} · {req.requestedAt}</p>
                    </div>
                  </div>
                  <Badge variant={req.status === 'completed' ? 'default' : req.status === 'pending' ? 'secondary' : 'outline'}>{req.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div><Label className="font-medium">Double Opt-in</Label><p className="text-xs text-muted-foreground">Require email confirmation for new subscribers</p></div>
                <Switch checked={settings.doubleOptIn} onCheckedChange={v => { setSettings({...settings, doubleOptIn: v}); toast.success('Setting updated'); }} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="font-medium">Auto-delete Inactive Data</Label><p className="text-xs text-muted-foreground">Automatically remove unengaged contacts</p></div>
                <Switch checked={settings.autoDelete} onCheckedChange={v => { setSettings({...settings, autoDelete: v}); toast.success('Setting updated'); }} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="font-medium">Consent Recording</Label><p className="text-xs text-muted-foreground">Store consent timestamp and source for each contact</p></div>
                <Switch checked={settings.consentRecording} onCheckedChange={v => { setSettings({...settings, consentRecording: v}); toast.success('Setting updated'); }} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="font-medium">IP Anonymization</Label><p className="text-xs text-muted-foreground">Anonymize IP addresses in tracking data</p></div>
                <Switch checked={settings.ipAnonymization} onCheckedChange={v => { setSettings({...settings, ipAnonymization: v}); toast.success('Setting updated'); }} />
              </div>
              {settings.autoDelete && (
                <div>
                  <Label className="text-xs">Retention Period (days)</Label>
                  <Input type="number" value={settings.retentionDays} onChange={e => setSettings({...settings, retentionDays: Number(e.target.value)})} className="mt-1 w-32" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
