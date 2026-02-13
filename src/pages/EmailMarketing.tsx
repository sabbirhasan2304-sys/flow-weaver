import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailContacts } from '@/components/email/EmailContacts';
import { EmailLists } from '@/components/email/EmailLists';
import { EmailCampaigns } from '@/components/email/EmailCampaigns';
import { EmailTemplates } from '@/components/email/EmailTemplates';
import { EmailSmtpSettings } from '@/components/email/EmailSmtpSettings';
import { EmailDashboard } from '@/components/email/EmailDashboard';
import { EmailAnalytics } from '@/components/email/EmailAnalytics';
import { AutomationList } from '@/components/email/automation/AutomationList';
import { SignupForms } from '@/components/email/SignupForms';
import { SendTimeOptimization } from '@/components/email/SendTimeOptimization';
import { PredictiveAnalytics } from '@/components/email/PredictiveAnalytics';
import { SmsMarketing } from '@/components/email/SmsMarketing';
import { AICampaignAgents } from '@/components/email/AICampaignAgents';
import { EcommerceTriggers } from '@/components/email/EcommerceTriggers';
import { LandingPageBuilder } from '@/components/email/LandingPageBuilder';
import { SocialScheduling } from '@/components/email/SocialScheduling';
import { TeamManagement } from '@/components/email/TeamManagement';
import { GdprCompliance } from '@/components/email/GdprCompliance';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Mail, Users, ListChecks, Send, LayoutTemplate, Settings, Zap, BarChart3, FileText,
  Clock, Brain, Smartphone, Bot, ShoppingCart, Globe, Share2, Shield,
} from 'lucide-react';

export default function EmailMarketing() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { value: 'dashboard', label: 'Overview', icon: Mail },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    { value: 'predictive', label: 'Predictions', icon: Brain },
    { value: 'contacts', label: 'Contacts', icon: Users },
    { value: 'lists', label: 'Lists', icon: ListChecks },
    { value: 'forms', label: 'Forms', icon: FileText },
    { value: 'campaigns', label: 'Campaigns', icon: Send },
    { value: 'automations', label: 'Automations', icon: Zap },
    { value: 'send-time', label: 'Send Time', icon: Clock },
    { value: 'ai-agents', label: 'AI Agents', icon: Bot },
    { value: 'sms', label: 'SMS', icon: Smartphone },
    { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
    { value: 'templates', label: 'Templates', icon: LayoutTemplate },
    { value: 'landing', label: 'Landing Pages', icon: Globe },
    { value: 'social', label: 'Social', icon: Share2 },
    { value: 'team', label: 'Team', icon: Users },
    { value: 'compliance', label: 'Compliance', icon: Shield },
    { value: 'settings', label: 'SMTP', icon: Settings },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Marketing</h1>
          <p className="text-muted-foreground mt-1">
            Manage contacts, create campaigns, and send emails
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 whitespace-nowrap">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="dashboard"><EmailDashboard /></TabsContent>
          <TabsContent value="analytics"><EmailAnalytics /></TabsContent>
          <TabsContent value="predictive"><PredictiveAnalytics /></TabsContent>
          <TabsContent value="contacts"><EmailContacts /></TabsContent>
          <TabsContent value="lists"><EmailLists /></TabsContent>
          <TabsContent value="forms"><SignupForms /></TabsContent>
          <TabsContent value="campaigns"><EmailCampaigns /></TabsContent>
          <TabsContent value="automations"><AutomationList /></TabsContent>
          <TabsContent value="send-time"><SendTimeOptimization /></TabsContent>
          <TabsContent value="ai-agents"><AICampaignAgents /></TabsContent>
          <TabsContent value="sms"><SmsMarketing /></TabsContent>
          <TabsContent value="ecommerce"><EcommerceTriggers /></TabsContent>
          <TabsContent value="templates"><EmailTemplates /></TabsContent>
          <TabsContent value="landing"><LandingPageBuilder /></TabsContent>
          <TabsContent value="social"><SocialScheduling /></TabsContent>
          <TabsContent value="team"><TeamManagement /></TabsContent>
          <TabsContent value="compliance"><GdprCompliance /></TabsContent>
          <TabsContent value="settings"><EmailSmtpSettings /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
