import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Activity, List, Bell, Settings, Plus } from 'lucide-react';
import { TrackingOverview } from '@/components/tracking/TrackingOverview';
import { EventLog } from '@/components/tracking/EventLog';
import { MonitoringDashboard } from '@/components/tracking/MonitoringDashboard';
import { TrackingSettings } from '@/components/tracking/TrackingSettings';
import { useNavigate } from 'react-router-dom';

export default function Tracking() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NexusTrack</h1>
            <p className="text-muted-foreground">Server-side tracking & event monitoring</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Create Tracking Workflow
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <Activity className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5">
              <List className="h-4 w-4" /> Event Log
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-1.5">
              <Bell className="h-4 w-4" /> Monitoring
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TrackingOverview />
          </TabsContent>
          <TabsContent value="events">
            <EventLog />
          </TabsContent>
          <TabsContent value="monitoring">
            <MonitoringDashboard />
          </TabsContent>
          <TabsContent value="settings">
            <TrackingSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
