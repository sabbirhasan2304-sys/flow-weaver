import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, CheckCircle2, Globe, Send, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WebhookUrlCardProps {
  workflowId: string;
  webhookSecret?: string | null;
}

export function WebhookUrlCard({ workflowId, webhookSecret }: WebhookUrlCardProps) {
  const [secret, setSecret] = useState(webhookSecret || '');
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl = `${supabaseUrl}/functions/v1/webhook-trigger?workflow_id=${workflowId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied!');
  };

  const testWebhook = async () => {
    setTesting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (secret) headers['x-webhook-secret'] = secret;

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Webhook test successful! Execution ID: ${data.executionId?.slice(0, 8)}...`);
      } else {
        toast.error(`Webhook test failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const saveSecret = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('workflows')
      .update({ webhook_secret: secret || null } as any)
      .eq('id', workflowId);
    if (error) toast.error('Failed to save secret');
    else toast.success('Webhook secret saved');
    setSaving(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Webhook URL
          <Badge variant="secondary" className="text-xs">Public Endpoint</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={webhookUrl} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={copyUrl}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Webhook Secret (optional)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter a secret for HMAC validation"
                className="pr-8 text-xs"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={saveSecret} disabled={saving}>
              {saving ? '...' : 'Save'}
            </Button>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={testWebhook} disabled={testing}>
          <Send className="h-3 w-3" />
          {testing ? 'Sending...' : 'Send Test Webhook'}
        </Button>

        <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md font-mono">
          <p className="font-sans font-medium mb-1">Example cURL:</p>
          curl -X POST "{webhookUrl}" \<br />
          &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
          {secret && <>&nbsp;&nbsp;-H "x-webhook-secret: {secret}" \<br /></>}
          &nbsp;&nbsp;-d '{`{"key": "value"}`}'
        </div>
      </CardContent>
    </Card>
  );
}
