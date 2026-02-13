import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Send, Mail, MousePointerClick, AlertTriangle, TrendingUp } from 'lucide-react';

export function EmailDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalCampaigns: 0,
    totalSent: 0,
    totalOpens: 0,
    totalClicks: 0,
    totalBounces: 0,
  });

  useEffect(() => {
    if (!profile) return;
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;

    const [contactsRes, campaignsRes] = await Promise.all([
      supabase.from('email_contacts').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
      supabase.from('email_campaigns').select('*').eq('profile_id', profile.id),
    ]);

    const campaigns = campaignsRes.data || [];
    setStats({
      totalContacts: contactsRes.count || 0,
      totalCampaigns: campaigns.length,
      totalSent: campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0),
      totalOpens: campaigns.reduce((sum, c) => sum + (c.total_opens || 0), 0),
      totalClicks: campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0),
      totalBounces: campaigns.reduce((sum, c) => sum + (c.total_bounces || 0), 0),
    });
  };

  const statCards = [
    { label: 'Total Contacts', value: stats.totalContacts, icon: Users, color: 'text-blue-500' },
    { label: 'Campaigns', value: stats.totalCampaigns, icon: Send, color: 'text-primary' },
    { label: 'Emails Sent', value: stats.totalSent, icon: Mail, color: 'text-purple-500' },
    { label: 'Total Opens', value: stats.totalOpens, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Total Clicks', value: stats.totalClicks, icon: MousePointerClick, color: 'text-orange-500' },
    { label: 'Bounces', value: stats.totalBounces, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. <strong>Configure SMTP</strong> — Go to the SMTP tab and add your cPanel email server settings</p>
          <p>2. <strong>Add Contacts</strong> — Import or manually add your email contacts</p>
          <p>3. <strong>Create a List</strong> — Organize contacts into targeted lists</p>
          <p>4. <strong>Design a Template</strong> — Create reusable email templates</p>
          <p>5. <strong>Launch a Campaign</strong> — Send your first email campaign!</p>
        </CardContent>
      </Card>
    </div>
  );
}
