import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, Loader2, Key, Package, Database, Workflow } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const migrationSteps = [
  { id: 1, title: 'Enter API Key', icon: Key },
  { id: 2, title: 'Scan Configuration', icon: Package },
  { id: 3, title: 'Map Resources', icon: Database },
  { id: 4, title: 'Review & Confirm', icon: Workflow },
];

const mockMappings = {
  containers: [
    { name: 'Main sGTM Container', tags: 12, triggers: 8, status: 'compatible' },
    { name: 'Analytics Container', tags: 6, triggers: 4, status: 'compatible' },
  ],
  powerUps: [
    { name: 'Cookie Keeper', nexusEquivalent: 'Cookie Recovery Node', status: 'mapped' },
    { name: 'Anonymizer', nexusEquivalent: 'PII Anonymizer Node', status: 'mapped' },
    { name: 'Bot Detection', nexusEquivalent: 'Bot Filter Node', status: 'mapped' },
    { name: 'GEO Headers', nexusEquivalent: 'Geo Enrichment Node', status: 'mapped' },
    { name: 'User ID', nexusEquivalent: 'User ID Generator', status: 'mapped' },
  ],
  storeCollections: [
    { name: 'products', documents: 1250, status: 'ready' },
    { name: 'user_attributes', documents: 8400, status: 'ready' },
  ],
};

export function StapeMigrationWizard({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setStep(3);
    }, 2500);
  };

  const completeMigration = () => {
    toast.success('Migration complete! Your tracking workflows are ready.');
    onOpenChange(false);
    setStep(1);
    setApiKey('');
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Migrate from Stape.io</DialogTitle>
          <DialogDescription>Import your existing Stape configuration into NexusTrack</DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <div className="flex gap-2 mb-6">
          {migrationSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className={`flex items-center gap-1.5 text-xs ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your Stape.io API key to begin the migration. We'll scan your account and map everything to NexusTrack equivalents.</p>
            <div>
              <Label>Stape API Key</Label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="stape_api_xxxxxxxxxxxxxxxx" type="password" />
              <p className="text-xs text-muted-foreground mt-1">Find this in your Stape dashboard under Settings → API</p>
            </div>
            <Button onClick={() => { setStep(2); startScan(); }} disabled={!apiKey.trim()} className="w-full">
              Start Scan <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-foreground font-medium">Scanning your Stape account...</p>
            <p className="text-sm text-muted-foreground">Reading containers, power-ups, and store data</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2">Containers ({mockMappings.containers.length})</h4>
                {mockMappings.containers.map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.tags} tags, {c.triggers} triggers</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">{c.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2">Power-Up Mappings ({mockMappings.powerUps.length})</h4>
                {mockMappings.powerUps.map((p) => (
                  <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">→ {p.nexusEquivalent}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">{p.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2">Store Collections ({mockMappings.storeCollections.length})</h4>
                {mockMappings.storeCollections.map((s) => (
                  <div key={s.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.documents.toLocaleString()} documents</p>
                    </div>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600">{s.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button onClick={() => setStep(4)} className="w-full">
              Review Migration <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-foreground">Migration Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{mockMappings.containers.length}</p>
                    <p className="text-xs text-muted-foreground">Containers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{mockMappings.powerUps.length}</p>
                    <p className="text-xs text-muted-foreground">Power-Ups</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{mockMappings.storeCollections.reduce((s, c) => s + c.documents, 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  All resources are compatible and ready to migrate
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
              <Button className="flex-1" onClick={completeMigration}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Complete Migration
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
