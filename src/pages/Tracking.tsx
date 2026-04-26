import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity, List, Bell, Settings, Plus, DollarSign, Database, Users, ArrowRightLeft,
  Sparkles, Shield, Fingerprint, RefreshCw, LayoutGrid, Wand2, Globe, Eye, Send,
  TrendingUp, Bug, CheckSquare, Search, Ghost, Network, Zap,
} from 'lucide-react';
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
import { ClarityIntegration } from '@/components/tracking/ClarityIntegration';
import { MarketingDestinations } from '@/components/tracking/MarketingDestinations';
import { ConsentModeConfig } from '@/components/tracking/ConsentModeConfig';
import { SiteAuditor } from '@/components/tracking/SiteAuditor';
import { ConversionRecovery } from '@/components/tracking/ConversionRecovery';
import { LiveDebugger } from '@/components/tracking/LiveDebugger';
import { GhostLoader } from '@/components/tracking/GhostLoader';
import { IdentityStitching } from '@/components/tracking/IdentityStitching';
import { PredictiveRecovery } from '@/components/tracking/PredictiveRecovery';

import { useNavigate } from 'react-router-dom';

type TabDef = { value: string; label: string; icon: any; group: string; component: () => JSX.Element };

const PRIMARY_TABS = ['overview', 'connect', 'events', 'destinations', 'monitoring'] as const;

export default function Tracking() {
  const navigate = useNavigate();
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabDef[] = [
    { value: 'overview', label: 'Overview', icon: Activity, group: 'Core', component: () => <TrackingOverview onNavigateToConnect={() => setActiveTab('connect')} /> },
    { value: 'connect', label: 'Connect', icon: Globe, group: 'Core', component: () => <ConnectWebsite /> },
    { value: 'events', label: 'Events', icon: List, group: 'Core', component: () => <EventLog /> },
    { value: 'destinations', label: 'Destinations', icon: Send, group: 'Core', component: () => <MarketingDestinations /> },
    { value: 'monitoring', label: 'Monitoring', icon: Bell, group: 'Core', component: () => <MonitoringDashboard /> },

    { value: 'debugger', label: 'Debugger', icon: Bug, group: 'Tools', component: () => <LiveDebugger /> },
    { value: 'audit', label: 'Site Auditor', icon: Search, group: 'Tools', component: () => <SiteAuditor /> },
    { value: 'mapper', label: 'AI Event Mapper', icon: Wand2, group: 'Tools', component: () => <AIEventMapper /> },
    { value: 'dashboards', label: 'Custom Dashboards', icon: LayoutGrid, group: 'Tools', component: () => <CustomDashboard /> },

    { value: 'recovery', label: 'Conversion Recovery', icon: TrendingUp, group: 'Recovery', component: () => <ConversionRecovery /> },
    { value: 'predictive', label: 'Predictive Recovery', icon: Zap, group: 'Recovery', component: () => <PredictiveRecovery /> },
    { value: 'ghost', label: 'Ghost Loader', icon: Ghost, group: 'Recovery', component: () => <GhostLoader /> },
    { value: 'reliability', label: 'Reliability Engine', icon: RefreshCw, group: 'Recovery', component: () => <ReliabilityEngine /> },

    { value: 'identity', label: 'Identity Hub', icon: Fingerprint, group: 'Identity & Privacy', component: () => <IdentityHub /> },
    { value: 'stitching', label: 'Identity Stitching', icon: Network, group: 'Identity & Privacy', component: () => <IdentityStitching /> },
    { value: 'consent', label: 'Consent Mode', icon: CheckSquare, group: 'Identity & Privacy', component: () => <ConsentModeConfig /> },
    { value: 'privacy', label: 'Privacy Compliance', icon: Shield, group: 'Identity & Privacy', component: () => <PrivacyCompliance /> },

    { value: 'poas', label: 'POAS', icon: DollarSign, group: 'Insights', component: () => <POASDashboard /> },
    { value: 'store', label: 'NexusStore', icon: Database, group: 'Insights', component: () => <NexusStore /> },
    { value: 'clarity', label: 'Clarity', icon: Eye, group: 'Insights', component: () => <ClarityIntegration /> },

    { value: 'agency', label: 'Agency', icon: Users, group: 'Workspace', component: () => <AgencyDashboard /> },
    { value: 'settings', label: 'Settings', icon: Settings, group: 'Workspace', component: () => <TrackingSettings /> },
  ];

  const groups = Array.from(new Set(tabs.map((t) => t.group)));
  const moreTabs = tabs.filter((t) => !PRIMARY_TABS.includes(t.value as any));
  const activeTabDef = tabs.find((t) => t.value === activeTab);
  const isPrimary = PRIMARY_TABS.includes(activeTab as any);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">NexusTrack</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Server-side tracking, identity stitching & predictive event recovery.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setMigrationOpen(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Migrate from Stape
              </Button>
              <Button variant="outline" size="sm" onClick={() => setOnboardingOpen(true)}>
                <Sparkles className="h-4 w-4 mr-1" /> Setup Wizard
              </Button>
              <Button onClick={() => navigate('/dashboard')} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Workflow
              </Button>
            </div>
          </div>
        </div>

        {/* Primary tab strip + grouped "more" picker */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList className="h-auto p-1 bg-muted/40 backdrop-blur">
              {tabs
                .filter((t) => PRIMARY_TABS.includes(t.value as any))
                .map((t) => {
                  const Icon = t.icon;
                  return (
                    <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm">
                      <Icon className="h-4 w-4" /> {t.label}
                    </TabsTrigger>
                  );
                })}
            </TabsList>

            <Select value={isPrimary ? '' : activeTab} onValueChange={(v) => v && setActiveTab(v)}>
              <SelectTrigger className="w-[240px] h-9 text-sm">
                <SelectValue placeholder={
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <LayoutGrid className="h-4 w-4" /> More features…
                  </span>
                }>
                  {!isPrimary && activeTabDef && (
                    <span className="flex items-center gap-1.5">
                      <activeTabDef.icon className="h-4 w-4 text-primary" /> {activeTabDef.label}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter((g) => g !== 'Core')
                  .map((g) => (
                    <SelectGroup key={g}>
                      <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">{g}</SelectLabel>
                      {moreTabs.filter((t) => t.group === g).map((t) => {
                        const Icon = t.icon;
                        return (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" /> {t.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section breadcrumb for non-primary views */}
          {!isPrimary && activeTabDef && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{activeTabDef.group}</span>
              <span className="opacity-50">›</span>
              <span className="text-foreground font-medium flex items-center gap-1">
                <activeTabDef.icon className="h-3.5 w-3.5" /> {activeTabDef.label}
              </span>
            </div>
          )}

          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-0">
              {t.component()}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <StapeMigrationWizard open={migrationOpen} onOpenChange={setMigrationOpen} />
      <OnboardingWizard open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </DashboardLayout>
  );
}
