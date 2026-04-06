import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Zap, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeedItem {
  id: string;
  type: 'signup' | 'execution' | 'payment';
  title: string;
  subtitle: string;
  time: string;
}

export function AdminActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const [profilesRes, executionsRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('executions').select('id, status, started_at, workflow_id').order('started_at', { ascending: false }).limit(10),
        supabase.from('payment_transactions').select('id, amount, status, payment_gateway, created_at').order('created_at', { ascending: false }).limit(10),
      ]);

      const feed: FeedItem[] = [];

      profilesRes.data?.forEach(p => {
        feed.push({
          id: `signup-${p.id}`,
          type: 'signup',
          title: p.full_name || p.email,
          subtitle: 'New user registered',
          time: p.created_at,
        });
      });

      executionsRes.data?.forEach(e => {
        feed.push({
          id: `exec-${e.id}`,
          type: 'execution',
          title: `Workflow execution`,
          subtitle: `Status: ${e.status}`,
          time: e.started_at,
        });
      });

      paymentsRes.data?.forEach(p => {
        feed.push({
          id: `pay-${p.id}`,
          type: 'payment',
          title: `৳${p.amount} payment`,
          subtitle: `${p.payment_gateway} — ${p.status}`,
          time: p.created_at,
        });
      });

      feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(feed.slice(0, 20));
    } catch (err) {
      console.error('Activity feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const iconMap = {
    signup: { icon: UserPlus, color: 'text-blue-500 bg-blue-500/10' },
    execution: { icon: Zap, color: 'text-amber-500 bg-amber-500/10' },
    payment: { icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest signups, executions, and payments</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading activity...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No recent activity</div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y divide-border/50">
              {items.map((item, i) => {
                const { icon: Icon, color } = iconMap[item.type];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.time)}</span>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
