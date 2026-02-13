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
import { Mail, Users, ListChecks, Send, LayoutTemplate, Settings, Zap, BarChart3 } from 'lucide-react';

export default function EmailMarketing() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="lists" className="gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Lists</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Automations</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">SMTP</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><EmailDashboard /></TabsContent>
          <TabsContent value="analytics"><EmailAnalytics /></TabsContent>
          <TabsContent value="contacts"><EmailContacts /></TabsContent>
          <TabsContent value="lists"><EmailLists /></TabsContent>
          <TabsContent value="campaigns"><EmailCampaigns /></TabsContent>
          <TabsContent value="automations"><AutomationList /></TabsContent>
          <TabsContent value="templates"><EmailTemplates /></TabsContent>
          <TabsContent value="settings"><EmailSmtpSettings /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
