import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Globe, Bell, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PaymentGatewaySettings } from './PaymentGatewaySettings';

export function AdminPlatformSettings() {
  const [settings, setSettings] = useState({
    platformName: 'NexusFlow',
    supportEmail: 'support@nexusflow.com',
    trialDays: 14,
    maintenanceMode: false,
    maintenanceMessage: 'We are performing scheduled maintenance. Please check back shortly.',
    adminAlertSignups: true,
    adminAlertPayments: true,
    adminAlertErrors: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
  });

  const handleSave = () => {
    localStorage.setItem('platform_settings', JSON.stringify(settings));
    toast.success('Platform settings saved');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PaymentGatewaySettings />

      {/* Branding */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Platform Branding
          </CardTitle>
          <CardDescription>General platform identity settings</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input id="platformName" value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" type="email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trialDays">Default Trial Duration (days)</Label>
              <Input id="trialDays" type="number" value={settings.trialDays} onChange={(e) => setSettings({ ...settings, trialDays: parseInt(e.target.value) || 14 })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Maintenance & Security
          </CardTitle>
          <CardDescription>Control access and maintenance mode</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">Temporarily block user access with a maintenance page</p>
            </div>
            <Switch checked={settings.maintenanceMode} onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })} />
          </div>
          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <Textarea value={settings.maintenanceMessage} onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })} rows={2} />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Login Attempts</Label>
              <Input type="number" value={settings.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })} />
            </div>
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Admin Notifications
          </CardTitle>
          <CardDescription>Choose which events trigger admin alerts</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {[
            { key: 'adminAlertSignups' as const, label: 'New User Signups', desc: 'Get notified when a new user registers' },
            { key: 'adminAlertPayments' as const, label: 'Payment Events', desc: 'Get notified for successful/failed payments' },
            { key: 'adminAlertErrors' as const, label: 'Application Errors', desc: 'Get notified when new crash reports are logged' },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <Label>{n.label}</Label>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch checked={settings[n.key]} onCheckedChange={(checked) => setSettings({ ...settings, [n.key]: checked })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </motion.div>
  );
}
