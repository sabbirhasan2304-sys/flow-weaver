import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, MousePointer, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminEmailOverview() {
  const [stats, setStats] = useState({ campaigns: 0, sent: 0, opens: 0, clicks: 0 });
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmailStats();
  }, []);

  const fetchEmailStats = async () => {
    try {
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('id, name, status, total_sent, total_opens, total_clicks, profile_id, created_at')
        .order('total_sent', { ascending: false })
        .limit(50);

      if (campaigns) {
        const totalSent = campaigns.reduce((a, c) => a + (c.total_sent || 0), 0);
        const totalOpens = campaigns.reduce((a, c) => a + (c.total_opens || 0), 0);
        const totalClicks = campaigns.reduce((a, c) => a + (c.total_clicks || 0), 0);
        setStats({ campaigns: campaigns.length, sent: totalSent, opens: totalOpens, clicks: totalClicks });
        setTopCampaigns(campaigns.slice(0, 10));
      }
    } catch (err) {
      console.error('Email stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const openRate = stats.sent > 0 ? ((stats.opens / stats.sent) * 100).toFixed(1) : '0';
  const clickRate = stats.sent > 0 ? ((stats.clicks / stats.sent) * 100).toFixed(1) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: stats.campaigns, icon: Mail, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Emails Sent', value: stats.sent.toLocaleString(), icon: Send, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Open Rate', value: `${openRate}%`, icon: Eye, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Click Rate', value: `${clickRate}%`, icon: MousePointer, color: 'text-violet-500 bg-violet-500/10' },
        ].map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Top Campaigns
          </CardTitle>
          <CardDescription>Campaigns with most emails sent across all users</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Opens</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No campaigns found</TableCell>
                </TableRow>
              ) : (
                topCampaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'sent' ? 'default' : 'secondary'} className="capitalize text-xs">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.total_sent || 0}</TableCell>
                    <TableCell className="text-right">{c.total_opens || 0}</TableCell>
                    <TableCell className="text-right">{c.total_clicks || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
