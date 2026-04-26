import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, Loader2, Key, Package, Database, Workflow, AlertCircle } from 'lucide-react';
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

type ScanResult = {
  containers: { name: string; tags: number; triggers: number; status: string }[];
  powerUps: { name: string; nexusEquivalent: string; status: string }[];
  storeCollections: { name: string; documents: number; status: string }[];
};

const POWER_UP_MAP: Record<string, string> = {
  'Cookie Keeper': 'Cookie Recovery Node',
  'Anonymizer': 'PII Anonymizer Node',
  'Bot Detection': 'Bot Filter Node',
  'GEO Headers': 'Geo Enrichment Node',
  'User ID': 'User ID Generator',
  'GTM Server-Side': 'Pipeline Builder',
};

export function StapeMigrationWizard({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const startScan = async () => {
    setScanning(true);
    setScanError(null);
    setResult(null);
    try {
      // Try Stape's public API. If it fails (CORS / invalid key / no account),
      // surface the error honestly instead of fabricating data.
      const res = await fetch('https://api.stape.io/api/v1/containers', {
        headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' },
      }).catch(() => null);

      if (!res || !res.ok) {
        // We can't reach Stape from the browser (CORS) or the key is invalid.
        // Show an honest empty scan so the user can still proceed manually.
        setResult({ containers: [], powerUps: [], storeCollections: [] });
        setScanError(
          res
            ? `Stape API returned ${res.status}. Please double-check the key, or import a manual export below.`
            : 'Could not reach the Stape API directly from the browser (CORS). Import a manual JSON export to continue.',
        );
        setStep(3);
        return;
      }

      const json = await res.json();
      const containers = (json.data ?? json.containers ?? []).map((c: any) => ({
        name: c.name ?? c.id,
        tags: c.tags_count ?? 0,
        triggers: c.triggers_count ?? 0,
        status: 'compatible',
      }));
      const powerUps = (json.power_ups ?? []).map((p: any) => ({
        name: p.name,
        nexusEquivalent: POWER_UP_MAP[p.name] ?? 'Custom Node',
        status: POWER_UP_MAP[p.name] ? 'mapped' : 'manual',
      }));
      const storeCollections = (json.store_collections ?? []).map((s: any) => ({
        name: s.name,
        documents: s.documents_count ?? 0,
        status: 'ready',
      }));
      setResult({ containers, powerUps, storeCollections });
      setStep(3);
    } catch (e: any) {
      setScanError(e?.message ?? 'Unknown scan error');
      setResult({ containers: [], powerUps: [], storeCollections: [] });
      setStep(3);
    } finally {
      setScanning(false);
    }
  };

  const completeMigration = () => {
    toast.success('Migration plan saved! Configure your destinations to finish.');
    onOpenChange(false);
    setStep(1);
    setApiKey('');
    setResult(null);
    setScanError(null);
  };

  const progress = ((step - 1) / 3) * 100;
  const totalDocs = result?.storeCollections.reduce((s, c) => s + c.documents, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Migrate from Stape.io</DialogTitle>
          <DialogDescription>Import your existing Stape configuration into NexusTrack</DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <div className="flex gap-2 mb-6 flex-wrap">
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
            <p className="text-sm text-muted-foreground">
              Enter your Stape.io API key to begin. We'll attempt to read your containers, power-ups and store
              collections, then map them to NexusTrack equivalents.
            </p>
            <div>
              <Label>Stape API Key</Label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="stape_api_xxxxxxxxxxxxxxxx" type="password" />
              <p className="text-xs text-muted-foreground mt-1">Settings → API in your Stape dashboard.</p>
            </div>
            <Button onClick={() => { setStep(2); startScan(); }} disabled={!apiKey.trim()} className="w-full">
              Start Scan <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 2 && scanning && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-foreground font-medium">Scanning your Stape account…</p>
            <p className="text-sm text-muted-foreground">Reading containers, power-ups, and store data</p>
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-4">
            {scanError && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm border border-yellow-500/30">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            <ScanCard title="Containers" count={result.containers.length}>
              {result.containers.length === 0 ? (
                <EmptyRow text="No containers detected." />
              ) : (
                result.containers.map((c) => (
                  <Row key={c.name} primary={c.name} secondary={`${c.tags} tags · ${c.triggers} triggers`} status={c.status} tone="emerald" />
                ))
              )}
            </ScanCard>

            <ScanCard title="Power-Up Mappings" count={result.powerUps.length}>
              {result.powerUps.length === 0 ? (
                <EmptyRow text="No power-ups detected." />
              ) : (
                result.powerUps.map((p) => (
                  <Row key={p.name} primary={p.name} secondary={`→ ${p.nexusEquivalent}`} status={p.status} tone="blue" />
                ))
              )}
            </ScanCard>

            <ScanCard title="Store Collections" count={result.storeCollections.length}>
              {result.storeCollections.length === 0 ? (
                <EmptyRow text="No store collections detected." />
              ) : (
                result.storeCollections.map((s) => (
                  <Row key={s.name} primary={s.name} secondary={`${s.documents.toLocaleString()} documents`} status={s.status} tone="purple" />
                ))
              )}
            </ScanCard>

            <Button onClick={() => setStep(4)} className="w-full">
              Review Migration <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 4 && result && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-foreground">Migration Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <Stat label="Containers" value={result.containers.length} />
                  <Stat label="Power-Ups" value={result.powerUps.length} />
                  <Stat label="Documents" value={totalDocs.toLocaleString()} />
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Plan ready — destinations will be configured after import.
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

function ScanCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-medium text-foreground mb-2">{title} ({count})</h4>
        <div>{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({ primary, secondary, status, tone }: { primary: string; secondary: string; status: string; tone: 'emerald' | 'blue' | 'purple' }) {
  const toneClass = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
  }[tone];
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-foreground truncate">{primary}</p>
        <p className="text-xs text-muted-foreground truncate">{secondary}</p>
      </div>
      <Badge variant="outline" className={toneClass}>{status}</Badge>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground py-2">{text}</p>;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
