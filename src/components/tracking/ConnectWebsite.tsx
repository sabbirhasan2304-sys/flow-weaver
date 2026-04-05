import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Zap, Globe } from 'lucide-react';
import { ConnectSnippets } from '@/components/tracking/ConnectSnippets';
import { CustomDomainSetup } from '@/components/tracking/CustomDomainSetup';
import { GatewaySetup } from '@/components/tracking/GatewaySetup';

export function ConnectWebsite() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="snippets" className="space-y-4">
        <TabsList className="h-auto gap-1">
          <TabsTrigger value="snippets" className="gap-1.5"><Code className="h-4 w-4" /> Install Snippets</TabsTrigger>
          <TabsTrigger value="gateway" className="gap-1.5"><Zap className="h-4 w-4" /> Gateway Mode</TabsTrigger>
          <TabsTrigger value="domain" className="gap-1.5"><Globe className="h-4 w-4" /> Custom Domain</TabsTrigger>
        </TabsList>

        <TabsContent value="snippets"><ConnectSnippets /></TabsContent>
        <TabsContent value="gateway"><GatewaySetup /></TabsContent>
        <TabsContent value="domain"><CustomDomainSetup /></TabsContent>
      </Tabs>
    </div>
  );
}
