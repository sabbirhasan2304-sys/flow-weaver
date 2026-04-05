import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Trash2, LayoutGrid, GripVertical, Save, BarChart3, PieChart as PieChartIcon, Activity, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type WidgetType = 'stat' | 'line_chart' | 'bar_chart' | 'pie_chart';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  config: Record<string, any>;
}

const widgetTypes: { type: WidgetType; label: string; icon: any }[] = [
  { type: 'stat', label: 'Stat Card', icon: Hash },
  { type: 'line_chart', label: 'Line Chart', icon: Activity },
  { type: 'bar_chart', label: 'Bar Chart', icon: BarChart3 },
  { type: 'pie_chart', label: 'Pie Chart', icon: PieChartIcon },
];

const dataSources = [
  { value: 'events_by_status', label: 'Events by Status' },
  { value: 'events_by_source', label: 'Events by Source' },
  { value: 'events_by_destination', label: 'Events by Destination' },
  { value: 'events_over_time', label: 'Events Over Time' },
  { value: 'delivery_rate', label: 'Delivery Rate' },
  { value: 'error_rate', label: 'Error Rate' },
  { value: 'total_events', label: 'Total Events' },
];

const mockChartData = [
  { name: 'Mon', value: 420 },
  { name: 'Tue', value: 380 },
  { name: 'Wed', value: 510 },
  { name: 'Thu', value: 490 },
  { name: 'Fri', value: 600 },
  { name: 'Sat', value: 350 },
  { name: 'Sun', value: 280 },
];

const mockPieData = [
  { name: 'Delivered', value: 85, color: 'hsl(var(--primary))' },
  { name: 'Failed', value: 8, color: '#ef4444' },
  { name: 'Retried', value: 5, color: '#f97316' },
  { name: 'Pending', value: 2, color: '#94a3b8' },
];

const mockStats: Record<string, string> = {
  total_events: '12,847',
  delivery_rate: '98.7%',
  error_rate: '1.3%',
};

export function CustomDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [widgetType, setWidgetType] = useState<WidgetType>('stat');
  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetSource, setWidgetSource] = useState('total_events');
  const [dashboardName, setDashboardName] = useState('My Dashboard');

  const { data: dashboards = [] } = useQuery({
    queryKey: ['tracking-dashboards', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from('tracking_dashboards').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const createDashboard = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('tracking_dashboards').insert({
        user_id: profile.id,
        name: dashboardName,
        widgets: [],
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Dashboard created!');
      setSelectedDashboard(data);
      setWidgets([]);
      queryClient.invalidateQueries({ queryKey: ['tracking-dashboards'] });
    },
    onError: () => toast.error('Failed to create dashboard'),
  });

  const saveDashboard = async () => {
    if (!selectedDashboard?.id) return;
    const { error } = await supabase.from('tracking_dashboards')
      .update({ widgets: widgets as any, name: dashboardName })
      .eq('id', selectedDashboard.id);
    if (error) toast.error('Failed to save');
    else toast.success('Dashboard saved!');
  };

  const addWidget = () => {
    const newWidget: Widget = {
      id: crypto.randomUUID(),
      type: widgetType,
      title: widgetTitle || `${widgetType} widget`,
      dataSource: widgetSource,
      config: {},
    };
    setWidgets([...widgets, newWidget]);
    setAddWidgetOpen(false);
    setWidgetTitle('');
  };

  const removeWidget = (id: string) => setWidgets(widgets.filter(w => w.id !== id));

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'stat':
        return (
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-foreground">{mockStats[widget.dataSource] || '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{widget.title}</p>
          </div>
        );
      case 'line_chart':
        return (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case 'bar_chart':
        return (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'pie_chart':
        return (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {mockPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
    }
  };

  // Dashboard selector
  if (!selectedDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Custom Dashboards</h3>
            <p className="text-sm text-muted-foreground">Build your own tracking analytics views</p>
          </div>
          <Button size="sm" onClick={() => createDashboard.mutate()}>
            <Plus className="h-4 w-4 mr-1" /> New Dashboard
          </Button>
        </div>

        {dashboards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutGrid className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No custom dashboards yet. Create one to visualize your tracking data.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((d: any) => (
              <Card key={d.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedDashboard(d); setWidgets((d.widgets as Widget[]) || []); setDashboardName(d.name); }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{((d.widgets as any[]) || []).length} widgets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dashboard editor
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => setSelectedDashboard(null)}>← Back</Button>
          <Input value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} className="w-[200px] font-medium" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAddWidgetOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Widget
          </Button>
          <Button size="sm" onClick={saveDashboard}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      {widgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LayoutGrid className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Add widgets to build your dashboard</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <Card key={widget.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{widget.title}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">{widget.type.replace('_', ' ')}</Badge>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeWidget(widget.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">{renderWidget(widget)}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Widget</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Widget Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {widgetTypes.map((wt) => {
                  const Icon = wt.icon;
                  return (
                    <Card
                      key={wt.type}
                      className={`cursor-pointer transition-colors p-3 ${widgetType === wt.type ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                      onClick={() => setWidgetType(wt.type)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm">{wt.label}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} placeholder="My widget" />
            </div>
            <div>
              <Label>Data Source</Label>
              <Select value={widgetSource} onValueChange={setWidgetSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dataSources.map((ds) => <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWidgetOpen(false)}>Cancel</Button>
            <Button onClick={addWidget}>Add Widget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
