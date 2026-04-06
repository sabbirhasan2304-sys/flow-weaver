import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Zap, Globe, Shield, Server, ArrowRight, CheckCircle2, Blocks } from 'lucide-react';
import { ConnectSnippets } from '@/components/tracking/ConnectSnippets';
import { CustomDomainSetup } from '@/components/tracking/CustomDomainSetup';
import { GatewaySetup } from '@/components/tracking/GatewaySetup';

export function ConnectWebsite() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-2">Connect Your Website</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Start collecting server-side events in minutes. Choose your integration method below — 
                from simple script tags to full server-to-server API connections.
              </p>
              <div className="flex flex-wrap gap-2">
                {['99.9% Delivery Rate', 'Ad Blocker Bypass', 'GDPR Compliant', 'First-Party Data'].map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Platforms', value: '10+', icon: Blocks },
                { label: 'Setup Time', value: '< 5min', icon: Zap },
                { label: 'Uptime', value: '99.9%', icon: Server },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="p-3 rounded-lg bg-background/60 border border-border/50">
                    <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">How Server-Side Tracking Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center">
            {[
              { step: '1', title: 'Client Event', desc: 'User action on your website triggers an event' },
              { step: '→', title: '', desc: '' },
              { step: '2', title: 'NexusTrack Server', desc: 'Event processed, enriched, and deduplicated server-side' },
              { step: '→', title: '', desc: '' },
              { step: '3', title: 'Destinations', desc: 'Clean data sent to Meta, GA4, TikTok, etc.' },
            ].map((item, i) => item.step === '→' ? (
              <ArrowRight key={i} className="h-5 w-5 text-muted-foreground hidden sm:block flex-shrink-0" />
            ) : (
              <div key={i} className="flex-1 p-3 rounded-lg bg-muted/30 border border-border/50 min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mx-auto mb-1.5">
                  {item.step}
                </div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Methods */}
      <Tabs defaultValue="snippets" className="space-y-4">
        <TabsList className="h-auto gap-1 flex-wrap">
          <TabsTrigger value="snippets" className="gap-1.5"><Code className="h-4 w-4" /> Install Snippets</TabsTrigger>
          <TabsTrigger value="gateway" className="gap-1.5"><Zap className="h-4 w-4" /> Gateway Mode</TabsTrigger>
          <TabsTrigger value="domain" className="gap-1.5"><Globe className="h-4 w-4" /> Custom Domain</TabsTrigger>
        </TabsList>

        <TabsContent value="snippets"><ConnectSnippets /></TabsContent>
        <TabsContent value="gateway"><GatewaySetup /></TabsContent>
        <TabsContent value="domain"><CustomDomainSetup /></TabsContent>
      </Tabs>

      {/* Why Server-Side */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Why Server-Side Tracking?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: 'Bypass Ad Blockers', desc: 'Events sent server-side are invisible to browser-based ad blockers, recovering 15-30% of lost data.' },
              { title: 'First-Party Data', desc: 'Set first-party cookies via your own domain for 365-day user identity persistence.' },
              { title: 'Data Quality', desc: 'Server-side deduplication, validation, and enrichment ensure clean data reaches destinations.' },
              { title: 'Privacy Compliant', desc: 'PII scrubbing, consent mode integration, and data residency controls built-in.' },
            ].map((item) => (
              <div key={item.title} className="p-3 rounded-lg border border-border bg-muted/20">
                <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}