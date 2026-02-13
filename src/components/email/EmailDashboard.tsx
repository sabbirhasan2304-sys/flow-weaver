import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Send, Mail, MousePointerClick, AlertTriangle, TrendingUp, Settings, UserPlus, ListChecks, LayoutTemplate, Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const STAT_CONFIGS = [
  { key: 'totalContacts', label: 'Total Contacts', icon: Users, gradient: 'from-blue-500/20 to-cyan-500/10', iconColor: 'text-blue-400', borderColor: 'border-blue-500/20' },
  { key: 'totalCampaigns', label: 'Campaigns', icon: Send, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/20' },
  { key: 'totalSent', label: 'Emails Sent', icon: Mail, gradient: 'from-purple-500/20 to-violet-500/10', iconColor: 'text-purple-400', borderColor: 'border-purple-500/20' },
  { key: 'totalOpens', label: 'Total Opens', icon: TrendingUp, gradient: 'from-emerald-500/20 to-green-500/10', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
  { key: 'totalClicks', label: 'Total Clicks', icon: MousePointerClick, gradient: 'from-orange-500/20 to-amber-500/10', iconColor: 'text-orange-400', borderColor: 'border-orange-500/20' },
  { key: 'totalBounces', label: 'Bounces', icon: AlertTriangle, gradient: 'from-destructive/20 to-red-500/10', iconColor: 'text-destructive', borderColor: 'border-destructive/20' },
] as const;

const STEPS = [
  { icon: Settings, label: 'Configure SMTP', desc: 'Add your cPanel email server settings', color: 'text-primary' },
  { icon: UserPlus, label: 'Add Contacts', desc: 'Import or manually add email contacts', color: 'text-emerald-400' },
  { icon: ListChecks, label: 'Create a List', desc: 'Organize contacts into targeted lists', color: 'text-violet-400' },
  { icon: LayoutTemplate, label: 'Design a Template', desc: 'Create reusable email templates', color: 'text-amber-400' },
  { icon: Rocket, label: 'Launch a Campaign', desc: 'Send your first email campaign!', color: 'text-primary' },
];

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

  return (
    <div className="space-y-6 mt-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CONFIGS.map((stat, i) => {
          const Icon = stat.icon;
          const value = stats[stat.key as keyof typeof stats];
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className={`relative overflow-hidden border ${stat.borderColor} hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="relative p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-background/50 backdrop-blur-sm flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid sm:grid-cols-5 gap-3">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="group relative flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground/50 tabular-nums">0{i + 1}</span>
                      <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <StepIcon className={`h-4 w-4 ${step.color}`} />
                      </div>
                    </div>
                    <div className="sm:text-center">
                      <p className="text-sm font-medium text-foreground">{step.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30 absolute -right-3 top-1/2 -translate-y-1/2 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
