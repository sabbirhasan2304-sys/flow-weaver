import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, FileCode, Settings, Zap, ShoppingCart } from 'lucide-react';

const installSteps = [
  { step: 1, title: 'Download the Plugin', desc: 'Click the download button to get the .zip file.' },
  { step: 2, title: 'Upload to WordPress', desc: 'Go to Plugins → Add New → Upload Plugin, then select the .zip file.' },
  { step: 3, title: 'Activate the Plugin', desc: 'Click "Activate" after installation completes.' },
  { step: 4, title: 'Configure API Key', desc: 'Go to BiztoriBD → Settings and enter your API key from the API Keys page.' },
  { step: 5, title: 'Map Events to Workflows', desc: 'Go to BiztoriBD → Event Mappings and assign WooCommerce events to your workflows.' },
];

const features = [
  { icon: Zap, title: 'Workflow Automation', desc: 'Trigger workflows on WooCommerce events like new orders, refunds, and cancellations.' },
  { icon: ShoppingCart, title: 'Cart Abandonment', desc: 'Automatically detect and track abandoned carts with hourly checks.' },
  { icon: Settings, title: 'Event Mappings', desc: 'Map any WooCommerce event to a specific workflow with a simple UI.' },
  { icon: FileCode, title: 'Full Dashboard', desc: 'Manage workflows, view executions, and monitor stats directly from WordPress.' },
];

export default function Downloads() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Downloads</h1>
          <p className="text-muted-foreground mt-1">Download plugins and integrations for your platform.</p>
        </div>

        {/* WordPress Plugin Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">BiztoriBD Automation for WooCommerce</CardTitle>
                  <CardDescription>Full workflow automation engine for WordPress & WooCommerce</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">v2.0.0</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <f.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download Button */}
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="/downloads/biztoribbd-automation.zip" download>
                <Download className="h-5 w-5 mr-2" />
                Download Plugin (.zip)
              </a>
            </Button>

            {/* Installation Steps */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Installation Guide</h3>
              <ol className="space-y-3">
                {installSteps.map((s) => (
                  <li key={s.step} className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {s.step}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Requirements */}
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h4 className="font-medium text-sm text-foreground mb-2">Requirements</h4>
              <ul className="space-y-1">
                {['WordPress 5.8+', 'WooCommerce 6.0+', 'PHP 7.4+', 'BiztoriBD API Key'].map((r) => (
                  <li key={r} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
