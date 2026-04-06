import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Database, FileJson, FileSpreadsheet, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EXPORTABLE_TABLES = [
  { key: 'tracking_events', label: 'Tracking Events', description: 'All tracked events and payloads' },
  { key: 'tracking_destinations', label: 'Destinations', description: 'Marketing platform connections' },
  { key: 'tracking_pipelines', label: 'Pipelines', description: 'Data pipeline configurations' },
  { key: 'tracking_alerts', label: 'Alerts', description: 'Alert rules and conditions' },
  { key: 'tracking_dashboards', label: 'Dashboards', description: 'Custom dashboard layouts' },
  { key: 'tracking_alert_rules', label: 'Alert Rules', description: 'Advanced alert rule engine configs' },
  { key: 'tracking_identity_config', label: 'Identity Config', description: 'Identity and cookie settings' },
  { key: 'tracking_clarity_config', label: 'Clarity Config', description: 'Microsoft Clarity integration' },
  { key: 'workflows', label: 'Workflows', description: 'Automation workflow definitions' },
  { key: 'credentials', label: 'Credentials', description: 'Saved credential configs (keys redacted)' },
] as const;

type TableKey = typeof EXPORTABLE_TABLES[number]['key'];

export function DataExport() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['tracking_events', 'tracking_destinations']));
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === EXPORTABLE_TABLES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(EXPORTABLE_TABLES.map(t => t.key)));
    }
  };

  const exportData = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one table to export');
      return;
    }

    setExporting(true);
    setProgress(0);

    try {
      const exportResult: Record<string, any[]> = {};
      const tables = Array.from(selected);

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setProgress(((i) / tables.length) * 100);

        const { data, error } = await supabase
          .from(table as any)
          .select('*')
          .limit(10000);

        if (error) {
          console.error(`Error exporting ${table}:`, error);
          exportResult[table] = [];
        } else {
          // Redact sensitive fields
          const redacted = (data || []).map((row: any) => {
            const clean = { ...row };
            if (clean.service_role_key) clean.service_role_key = '***REDACTED***';
            if (clean.anon_key && table === 'backend_provider_config') clean.anon_key = '***REDACTED***';
            if (clean.password) clean.password = '***REDACTED***';
            if (clean.api_key) clean.api_key = '***REDACTED***';
            return clean;
          });
          exportResult[table] = redacted;
        }
      }

      setProgress(100);

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportResult, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `nexustrack-export-${new Date().toISOString().slice(0, 10)}.json`);
      } else {
        // CSV: export each table as separate file in a combined text
        let csvContent = '';
        for (const [table, rows] of Object.entries(exportResult)) {
          if (rows.length === 0) continue;
          const headers = Object.keys(rows[0]);
          csvContent += `\n--- ${table} ---\n`;
          csvContent += headers.join(',') + '\n';
          rows.forEach(row => {
            csvContent += headers.map(h => {
              const val = row[h];
              const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"` : str;
            }).join(',') + '\n';
          });
        }
        const blob = new Blob([csvContent], { type: 'text/csv' });
        downloadBlob(blob, `nexustrack-export-${new Date().toISOString().slice(0, 10)}.csv`);
      }

      toast.success(`Exported ${tables.length} tables successfully!`);
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Download className="h-4 w-4 text-primary" />
          Data Export
        </CardTitle>
        <CardDescription>Download your tracking data as JSON or CSV for migration or backup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={format === 'json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormat('json')}
            className="gap-1.5 text-xs"
          >
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </Button>
          <Button
            variant={format === 'csv' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormat('csv')}
            className="gap-1.5 text-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV
          </Button>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
              {selected.size === EXPORTABLE_TABLES.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>

        {/* Table selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXPORTABLE_TABLES.map((table) => (
            <label
              key={table.key}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selected.has(table.key)
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/50 hover:border-muted-foreground/30'
              }`}
            >
              <Checkbox
                checked={selected.has(table.key)}
                onCheckedChange={() => toggle(table.key)}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">{table.label}</div>
                <div className="text-xs text-muted-foreground">{table.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Export progress */}
        {exporting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Exporting {selected.size} tables...</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Export button */}
        <Button
          onClick={exportData}
          disabled={exporting || selected.size === 0}
          className="w-full gap-2"
        >
          {exporting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export {selected.size} Table{selected.size !== 1 ? 's' : ''} as {format.toUpperCase()}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Sensitive fields (API keys, passwords) are automatically redacted in exports.
        </p>
      </CardContent>
    </Card>
  );
}
