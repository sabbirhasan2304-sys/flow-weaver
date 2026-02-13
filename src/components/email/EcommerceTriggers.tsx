import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShoppingCart, Package, CreditCard, Truck, RefreshCw, Star, Tag, AlertTriangle, TrendingUp, Settings, Zap, Clock, CheckCircle2 } from 'lucide-react';

interface EcommerceTrigger {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  delay: string;
  emailCount: number;
  description: string;
  icon: any;
  color: string;
  stats: { triggered: number; converted: number; revenue: number };
}

const DEFAULT_TRIGGERS: EcommerceTrigger[] = [
  { id: 'abandoned_cart', name: 'Abandoned Cart', type: 'cart_abandon', enabled: true, delay: '1 hour', emailCount: 3, description: 'Send reminders when customers leave items in their cart', icon: ShoppingCart, color: 'text-orange-600 bg-orange-500/10', stats: { triggered: 1240, converted: 186, revenue: 14280 } },
  { id: 'checkout_abandon', name: 'Checkout Abandonment', type: 'checkout_abandon', enabled: true, delay: '30 min', emailCount: 2, description: 'Triggered when a customer fills shipping/payment info but leaves without completing purchase', icon: AlertTriangle, color: 'text-red-600 bg-red-500/10', stats: { triggered: 870, converted: 148, revenue: 11200 } },
  { id: 'payment_failure', name: 'Payment Failure Recovery', type: 'payment_fail', enabled: true, delay: 'Immediate', emailCount: 3, description: 'Send recovery emails with retry link when payment is declined or fails at checkout', icon: CreditCard, color: 'text-rose-600 bg-rose-500/10', stats: { triggered: 340, converted: 119, revenue: 8960 } },
  { id: 'post_purchase', name: 'Post-Purchase Follow-up', type: 'purchase', enabled: true, delay: '2 days', emailCount: 2, description: 'Thank customers and request reviews after purchase', icon: Package, color: 'text-green-600 bg-green-500/10', stats: { triggered: 890, converted: 267, revenue: 5340 } },
  { id: 'browse_abandon', name: 'Browse Abandonment', type: 'browse_abandon', enabled: false, delay: '4 hours', emailCount: 2, description: 'Re-engage visitors who viewed products but didn\'t buy', icon: RefreshCw, color: 'text-blue-600 bg-blue-500/10', stats: { triggered: 560, converted: 45, revenue: 3240 } },
  { id: 'review_request', name: 'Review Request', type: 'review', enabled: false, delay: '7 days', emailCount: 1, description: 'Ask customers for product reviews after delivery', icon: Star, color: 'text-amber-600 bg-amber-500/10', stats: { triggered: 430, converted: 89, revenue: 0 } },
  { id: 'price_drop', name: 'Price Drop Alert', type: 'price_drop', enabled: false, delay: 'Immediate', emailCount: 1, description: 'Notify wishlist customers when prices decrease', icon: Tag, color: 'text-pink-600 bg-pink-500/10', stats: { triggered: 220, converted: 66, revenue: 4950 } },
  { id: 'reorder', name: 'Reorder Reminder', type: 'reorder', enabled: false, delay: '30 days', emailCount: 1, description: 'Remind customers to repurchase consumable products', icon: CreditCard, color: 'text-purple-600 bg-purple-500/10', stats: { triggered: 180, converted: 54, revenue: 2700 } },
  { id: 'shipping', name: 'Shipping Updates', type: 'shipping', enabled: true, delay: 'Immediate', emailCount: 3, description: 'Automated shipping and delivery notifications', icon: Truck, color: 'text-cyan-600 bg-cyan-500/10', stats: { triggered: 2100, converted: 0, revenue: 0 } },
];

export function EcommerceTriggers() {
  const [triggers, setTriggers] = useState<EcommerceTrigger[]>(DEFAULT_TRIGGERS);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);

  const toggleTrigger = (id: string) => {
    setTriggers(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newEnabled = !t.enabled;
      toast.success(`${t.name} ${newEnabled ? 'enabled' : 'disabled'}`);
      return { ...t, enabled: newEnabled };
    }));
  };

  const enabledCount = triggers.filter(t => t.enabled).length;
  const totalRevenue = triggers.reduce((s, t) => s + t.stats.revenue, 0);
  const totalTriggered = triggers.reduce((s, t) => s + t.stats.triggered, 0);
  const totalConverted = triggers.reduce((s, t) => s + t.stats.converted, 0);

  const selected = selectedTrigger ? triggers.find(t => t.id === selectedTrigger) : null;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            E-commerce Triggers
          </h2>
          <p className="text-sm text-muted-foreground">Automated emails triggered by shopping behavior</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          {enabledCount}/{triggers.length} active
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />Total Triggered</p>
          <p className="text-2xl font-bold mt-1">{totalTriggered.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Conversions</p>
          <p className="text-2xl font-bold mt-1">{totalConverted.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{totalTriggered > 0 ? ((totalConverted/totalTriggered)*100).toFixed(1) : 0}% rate</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="h-3 w-3" />Revenue Generated</p>
          <p className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Active Triggers</p>
          <p className="text-2xl font-bold mt-1">{enabledCount}</p>
        </CardContent></Card>
      </div>

      {/* Trigger Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {triggers.map(trigger => {
          const Icon = trigger.icon;
          const convRate = trigger.stats.triggered > 0 ? ((trigger.stats.converted / trigger.stats.triggered) * 100).toFixed(1) : '0';
          return (
            <Card key={trigger.id} className={`transition-all ${trigger.enabled ? 'border-primary/20' : 'opacity-75'} ${selectedTrigger === trigger.id ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${trigger.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{trigger.name}</h3>
                      <Switch checked={trigger.enabled} onCheckedChange={() => toggleTrigger(trigger.id)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{trigger.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="text-[10px]"><Clock className="h-2.5 w-2.5 mr-0.5" />{trigger.delay}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{trigger.emailCount} email{trigger.emailCount > 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                      <span>{trigger.stats.triggered.toLocaleString()} triggered</span>
                      <span>{convRate}% conv.</span>
                      {trigger.stats.revenue > 0 && <span className="text-green-600">${trigger.stats.revenue.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Setup */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-medium text-sm">Connect Your Store</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Connect Shopify, WooCommerce, or use webhooks to enable real-time e-commerce triggers
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <Button variant="outline" size="sm">Shopify</Button>
            <Button variant="outline" size="sm">WooCommerce</Button>
            <Button variant="outline" size="sm">Webhook API</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
