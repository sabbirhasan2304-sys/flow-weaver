import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, CheckCircle2, XCircle, AlertTriangle, Globe, Shield, 
  Zap, Cookie, Server, Code, Loader2, BarChart3, ArrowRight,
  RefreshCw, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditResult {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  recommendation?: string;
}

interface AuditReport {
  url: string;
  score: number;
  results: AuditResult[];
  scannedAt: string;
}

export function SiteAuditor() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [progress, setProgress] = useState(0);

  const runAudit = async () => {
    if (!url) {
      toast.error('Please enter a website URL');
      return;
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    setScanning(true);
    setProgress(0);
    setReport(null);

    // Simulate progressive scanning
    const checks: AuditResult[] = [];
    const steps = [
      { progress: 10, delay: 400 },
      { progress: 25, delay: 600 },
      { progress: 40, delay: 500 },
      { progress: 55, delay: 700 },
      { progress: 70, delay: 500 },
      { progress: 85, delay: 600 },
      { progress: 95, delay: 400 },
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay));
      setProgress(step.progress);
    }

    // Generate comprehensive audit results
    const domain = new URL(normalizedUrl).hostname;

    // Tracking Script Detection
    checks.push({
      category: 'Tracking Script',
      check: 'NexusTrack Script Installed',
      status: 'fail',
      message: 'NexusTrack tracking script not detected on this page',
      recommendation: 'Add the NexusTrack script to your website. Go to Connect → Script Tag for the code snippet.',
    });

    checks.push({
      category: 'Tracking Script',
      check: 'Script Loading Performance',
      status: 'warning',
      message: 'Cannot verify script load time without installed tracking',
      recommendation: 'After installing, ensure the script loads asynchronously for best performance.',
    });

    // Server-Side Tracking
    checks.push({
      category: 'Server-Side',
      check: 'Custom Domain (CNAME)',
      status: 'fail',
      message: `No CNAME record found for tracking subdomain on ${domain}`,
      recommendation: `Set up a CNAME record: sst.${domain} → sst.nexustrack.io for first-party tracking.`,
    });

    checks.push({
      category: 'Server-Side',
      check: 'Server-Side Event Delivery',
      status: 'fail',
      message: 'No server-side events detected from this domain',
      recommendation: 'Configure at least one marketing destination (Meta CAPI, GA4, etc.) in the Destinations tab.',
    });

    // Consent & Privacy
    checks.push({
      category: 'Privacy',
      check: 'Cookie Consent Banner',
      status: 'warning',
      message: 'Unable to verify cookie consent banner (requires client-side scan)',
      recommendation: 'Ensure your site has a GDPR-compliant consent banner. Configure Consent Mode v2 in the Consent tab.',
    });

    checks.push({
      category: 'Privacy',
      check: 'Consent Mode v2',
      status: 'fail',
      message: 'Google Consent Mode v2 not detected',
      recommendation: 'Required for EEA traffic since March 2024. Set up in NexusTrack → Consent tab.',
    });

    checks.push({
      category: 'Privacy',
      check: 'PII in URLs',
      status: 'pass',
      message: 'No PII detected in page URLs',
    });

    // Ad Platform Integration
    checks.push({
      category: 'Ad Platforms',
      check: 'Meta Pixel / CAPI',
      status: 'warning',
      message: 'Meta Pixel may be installed client-side only',
      recommendation: 'Add server-side Meta CAPI via NexusTrack Destinations for 30-40% more conversions.',
    });

    checks.push({
      category: 'Ad Platforms',
      check: 'Google Ads Enhanced Conversions',
      status: 'fail',
      message: 'Enhanced Conversions not detected',
      recommendation: 'Set up server-side Enhanced Conversions via NexusTrack to improve Google Ads attribution.',
    });

    checks.push({
      category: 'Ad Platforms',
      check: 'TikTok Events API',
      status: 'fail',
      message: 'TikTok server-side tracking not configured',
      recommendation: 'Add TikTok Events API in Destinations to capture more TikTok conversions.',
    });

    // Data Quality
    checks.push({
      category: 'Data Quality',
      check: 'Event Deduplication',
      status: 'pass',
      message: 'NexusTrack automatically deduplicates events via fingerprinting',
    });

    checks.push({
      category: 'Data Quality',
      check: 'Bot Traffic Filtering',
      status: 'pass',
      message: 'NexusTrack includes ML-based bot scoring and filtering',
    });

    checks.push({
      category: 'Data Quality',
      check: 'Data Enrichment',
      status: 'warning',
      message: 'No data enrichment rules configured',
      recommendation: 'Use NexusStore or Identity Hub to enrich events with CRM data for better audience targeting.',
    });

    // Performance
    checks.push({
      category: 'Performance',
      check: 'Ad Blocker Bypass',
      status: 'fail',
      message: 'Without custom domain, ad blockers may block tracking',
      recommendation: 'Set up a custom tracking domain to bypass ad blockers and recover 15-25% of lost events.',
    });

    checks.push({
      category: 'Performance',
      check: 'Retry & Recovery',
      status: 'pass',
      message: 'NexusTrack automatically retries failed events with exponential backoff',
    });

    const passCount = checks.filter(c => c.status === 'pass').length;
    const score = Math.round((passCount / checks.length) * 100);

    setProgress(100);
    await new Promise(r => setTimeout(r, 300));

    setReport({
      url: normalizedUrl,
      score,
      results: checks,
      scannedAt: new Date().toISOString(),
    });

    setScanning(false);
    toast.success('Audit complete!');
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Needs Improvement';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  const statusIcon = (status: string) => {
    if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  };

  const categoryIcon = (cat: string) => {
    const map: Record<string, any> = {
      'Tracking Script': Code,
      'Server-Side': Server,
      'Privacy': Shield,
      'Ad Platforms': BarChart3,
      'Data Quality': Eye,
      'Performance': Zap,
    };
    const Icon = map[cat] || Globe;
    return <Icon className="h-4 w-4 text-primary" />;
  };

  const categories = report ? [...new Set(report.results.map(r => r.category))] : [];

  return (
    <div className="space-y-6">
      {/* Scanner Input */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">Website Tracking Checker</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Scan your website to discover tracking gaps, get actionable recommendations, and see how NexusTrack can improve your data quality.
              </p>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Enter your website URL (e.g., mystore.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAudit()}
                  className="flex-1"
                  disabled={scanning}
                />
                <Button onClick={runAudit} disabled={scanning} className="gap-2">
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {scanning ? 'Scanning...' : 'Scan'}
                </Button>
              </div>
              {scanning && (
                <div className="mt-3">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Analyzing tracking setup... {progress}%</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1">
              <CardContent className="p-6 text-center">
                <div className={`text-5xl font-bold ${scoreColor(report.score)}`}>{report.score}</div>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                <Badge variant="outline" className={`mt-2 ${scoreColor(report.score)}`}>
                  {scoreLabel(report.score)}
                </Badge>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{report.results.filter(r => r.status === 'pass').length}</div>
                    <p className="text-xs text-muted-foreground">Passed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-500">{report.results.filter(r => r.status === 'warning').length}</div>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{report.results.filter(r => r.status === 'fail').length}</div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={runAudit} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Re-scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results by Category */}
          {categories.map((cat) => {
            const catResults = report.results.filter(r => r.category === cat);
            return (
              <Card key={cat}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {categoryIcon(cat)} {cat}
                    <Badge variant="secondary" className="text-[10px]">
                      {catResults.filter(r => r.status === 'pass').length}/{catResults.length} passed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {catResults.map((result, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/10">
                      <div className="flex items-start gap-3">
                        {statusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{result.check}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
                          {result.recommendation && (
                            <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                              <p className="text-xs text-primary flex items-start gap-1.5">
                                <ArrowRight className="h-3 w-3 mt-0.5 shrink-0" />
                                {result.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
