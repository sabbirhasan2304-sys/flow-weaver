import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Activity, List, Bell, Settings, Plus, DollarSign, Database, Users, ArrowRightLeft, Sparkles, Shield, Fingerprint, RefreshCw, LayoutGrid, Wand2, Globe } from 'lucide-react';
import { TrackingOverview } from '@/components/tracking/TrackingOverview';
import { EventLog } from '@/components/tracking/EventLog';
import { MonitoringDashboard } from '@/components/tracking/MonitoringDashboard';
import { TrackingSettings } from '@/components/tracking/TrackingSettings';
import { POASDashboard } from '@/components/tracking/POASDashboard';
import { NexusStore } from '@/components/tracking/NexusStore';
import { AgencyDashboard } from '@/components/tracking/AgencyDashboard';
import { PrivacyCompliance } from '@/components/tracking/PrivacyCompliance';
import { IdentityHub } from '@/components/tracking/IdentityHub';
import { ReliabilityEngine } from '@/components/tracking/ReliabilityEngine';
import { CustomDashboard } from '@/components/tracking/CustomDashboard';
import { StapeMigrationWizard } from '@/components/tracking/StapeMigrationWizard';
import { OnboardingWizard } from '@/components/tracking/OnboardingWizard';
import { AIEventMapper } from '@/components/tracking/AIEventMapper';
import { ConnectWebsite } from '@/components/tracking/ConnectWebsite';
import { useNavigate } from 'react-router-dom';

export default function Tracking() {
  const navigate = useNavigate();
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NexusTrack</h1>
            <p className="text-muted-foreground">Server-side tracking & event monitoring</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMigrationOpen(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-1" /> Migrate from Stape
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOnboardingOpen(true)}>
              <Sparkles className="h-4 w-4 mr-1" /> Setup Wizard
            </Button>
            <Button onClick={() => navigate('/dashboard')} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Create Tracking Workflow
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="connect" className="gap-1.5"><Globe className="h-4 w-4" /> Connect</TabsTrigger>
            <TabsTrigger value="overview" className="gap-1.5"><Activity className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5"><List className="h-4 w-4" /> Events</TabsTrigger>
            <TabsTrigger value="poas" className="gap-1.5"><DollarSign className="h-4 w-4" /> POAS</TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-1.5"><Bell className="h-4 w-4" /> Monitoring</TabsTrigger>
            <TabsTrigger value="reliability" className="gap-1.5"><RefreshCw className="h-4 w-4" /> Reliability</TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5"><Shield className="h-4 w-4" /> Privacy</TabsTrigger>
            <TabsTrigger value="identity" className="gap-1.5"><Fingerprint className="h-4 w-4" /> Identity</TabsTrigger>
            <TabsTrigger value="store" className="gap-1.5"><Database className="h-4 w-4" /> NexusStore</TabsTrigger>
            <TabsTrigger value="dashboards" className="gap-1.5"><LayoutGrid className="h-4 w-4" /> Dashboards</TabsTrigger>
            <TabsTrigger value="mapper" className="gap-1.5"><Wand2 className="h-4 w-4" /> AI Mapper</TabsTrigger>
            <TabsTrigger value="agency" className="gap-1.5"><Users className="h-4 w-4" /> Agency</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="connect"><ConnectWebsite /></TabsContent>
          <TabsContent value="overview"><TrackingOverview onNavigateToConnect={() => setActiveTab('connect')} /></TabsContent>
          <TabsContent value="events"><EventLog /></TabsContent>
          <TabsContent value="poas"><POASDashboard /></TabsContent>
          <TabsContent value="monitoring"><MonitoringDashboard /></TabsContent>
          <TabsContent value="reliability"><ReliabilityEngine /></TabsContent>
          <TabsContent value="privacy"><PrivacyCompliance /></TabsContent>
          <TabsContent value="identity"><IdentityHub /></TabsContent>
          <TabsContent value="store"><NexusStore /></TabsContent>
          <TabsContent value="dashboards"><CustomDashboard /></TabsContent>
          <TabsContent value="mapper"><AIEventMapper /></TabsContent>
          <TabsContent value="agency"><AgencyDashboard /></TabsContent>
          <TabsContent value="settings"><TrackingSettings /></TabsContent>
        </Tabs>
      </div>

      <StapeMigrationWizard open={migrationOpen} onOpenChange={setMigrationOpen} />
      <OnboardingWizard open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </DashboardLayout>
  );
}
