import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertTriangle, Zap, ShoppingBag, BarChart3, Globe } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { AISetupAssistant } from './AISetupAssistant';

const mockStats = [
  { label: 'Events Processed', value: '0', icon: Activity, trend: 'Start tracking' },
  { label: 'Delivery Rate', value: '—', icon: CheckCircle2, trend: 'No data yet' },
  { label: 'Active Pipelines', value: '0', icon: Zap, trend: 'Create your first' },
  { label: 'Failed Events', value: '0', icon: AlertTriangle, trend: 'All clear' },
];

const quickStarts = [
  { label: 'Connect Shopify', icon: ShoppingBag, color: 'bg-green-500/10 text-green-600' },
  { label: 'Connect Meta CAPI', icon: Globe, color: 'bg-blue-500/10 text-blue-600' },
  { label: 'Connect GA4', icon: BarChart3, color: 'bg-orange-500/10 text-orange-600' },
];

export function TrackingOverview() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickStarts.map((qs) => {
              const Icon = qs.icon;
              return (
                <Button key={qs.label} variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <div className={`h-10 w-10 rounded-lg ${qs.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{qs.label}</span>
                </Button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => setAiOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              AI Setup Assistant — Analyze Your Website
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Event Stream Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Events</CardTitle>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No events yet. Create a pipeline to start tracking.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AISetupAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
