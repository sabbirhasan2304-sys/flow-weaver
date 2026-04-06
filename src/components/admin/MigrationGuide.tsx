import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, Download, Database, Upload, Globe, Server, 
  CheckCircle2, ArrowRight, Terminal, Shield, AlertTriangle 
} from 'lucide-react';

const STEPS = [
  {
    step: 1,
    title: 'Export Your Data',
    icon: Download,
    description: 'Use the Data Export tool above to download all tracking data as JSON.',
    details: [
      'Select all tables you want to migrate',
      'Export as JSON format (preserves data types)',
      'Keep the file safe — it contains your full tracking history',
    ],
    badge: 'Required',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    step: 2,
    title: 'Set Up External Database',
    icon: Database,
    description: 'Create a new Supabase project or Tenbyte Cloud instance.',
    details: [
      'Go to supabase.com and create a new project',
      'Note down the Project URL and anon/service_role keys',
      'Run the SQL schema migrations (available in your project repo under supabase/migrations/)',
    ],
    badge: 'Manual',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    step: 3,
    title: 'Import Data',
    icon: Upload,
    description: 'Import the exported JSON data into your new database.',
    details: [
      'Use the Supabase Dashboard → SQL Editor to run INSERT statements',
      'Or use the Supabase CLI: supabase db push',
      'Alternatively, write a migration script using the Supabase JS client',
    ],
    badge: 'Manual',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    step: 4,
    title: 'Deploy Edge Functions',
    icon: Terminal,
    description: 'Deploy your edge functions to the new Supabase project.',
    details: [
      'Copy the supabase/functions/ directory from your project',
      'Run: supabase functions deploy --project-ref YOUR_PROJECT_REF',
      'Set up required secrets: supabase secrets set KEY=VALUE',
    ],
    badge: 'Manual',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    step: 5,
    title: 'Update Frontend Config',
    icon: Globe,
    description: 'Point the frontend to your new backend.',
    details: [
      'Update VITE_SUPABASE_URL to your new project URL',
      'Update VITE_SUPABASE_PUBLISHABLE_KEY to new anon key',
      'Rebuild and deploy to Vercel/Netlify/your hosting provider',
    ],
    badge: 'Required',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    step: 6,
    title: 'Verify & Go Live',
    icon: CheckCircle2,
    description: 'Test everything before switching production traffic.',
    details: [
      'Test authentication flow (sign up, sign in)',
      'Verify tracking events are being captured',
      'Check all destinations are receiving data',
      'Monitor edge function logs for errors',
    ],
    badge: 'Final',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
];

export function MigrationGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-primary" />
          Migration Guide
        </CardTitle>
        <CardDescription>Step-by-step guide to migrate from Lovable Cloud to your own infrastructure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium">Important: This is a manual DevOps process</p>
              <p className="mt-1">
                Lovable Cloud is tightly integrated. Full migration requires database export, edge function deployment, 
                and frontend reconfiguration. This cannot be automated with a single button.
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-border/50" />
                )}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">Step {step.step}: {step.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${step.badgeColor}`}>
                        {step.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                    <ul className="space-y-1">
                      {step.details.map((detail, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary/50" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Required tools */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Required tools:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Supabase CLI', 'Node.js', 'Git', 'Vercel/Netlify CLI'].map(tool => (
                  <Badge key={tool} variant="outline" className="text-[10px]">{tool}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
