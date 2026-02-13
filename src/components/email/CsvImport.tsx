import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, X, Loader2, ArrowRight } from 'lucide-react';

interface CsvImportProps {
  onComplete: () => void;
  onCancel: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

const CONTACT_FIELDS = [
  { value: '__skip__', label: '— Skip this column —' },
  { value: 'email', label: 'Email *', required: true },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine).filter(r => r.some(c => c));
  return { headers, rows };
}

function guessMapping(header: string): string {
  const h = header.toLowerCase().replace(/[_\-\s]+/g, '');
  if (/^e?mail/.test(h) || h === 'emailaddress') return 'email';
  if (/^first/.test(h) || h === 'fname' || h === 'givenname') return 'first_name';
  if (/^last/.test(h) || h === 'lname' || h === 'surname' || h === 'familyname') return 'last_name';
  if (/phone|mobile|cell|tel/.test(h)) return 'phone';
  if (/company|org|business/.test(h)) return 'company';
  if (/source|origin/.test(h)) return 'source';
  if (/status/.test(h)) return 'status';
  return '__skip__';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function CsvImport({ onComplete, onCancel }: CsvImportProps) {
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResults, setImportResults] = useState<{ imported: number; skipped: number; errors: number; duplicates: number }>({ imported: 0, skipped: 0, errors: 0, duplicates: 0 });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { toast.error('Could not parse CSV'); return; }
      setHeaders(h);
      setRows(r);
      // Auto-map columns
      const autoMapping: Record<number, string> = {};
      h.forEach((header, idx) => { autoMapping[idx] = guessMapping(header); });
      setMapping(autoMapping);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, []);

  const emailColumnIdx = Object.entries(mapping).find(([, v]) => v === 'email')?.[0];
  const hasEmailMapping = emailColumnIdx !== undefined;

  const previewData = rows.slice(0, 5).map(row => {
    const mapped: Record<string, string> = {};
    Object.entries(mapping).forEach(([colIdx, field]) => {
      if (field !== '__skip__') mapped[field] = row[Number(colIdx)] || '';
    });
    return mapped;
  });

  const handleImport = async () => {
    if (!profile || !hasEmailMapping) return;
    setStep('importing');

    const emailIdx = Number(emailColumnIdx);
    let imported = 0, skipped = 0, errors = 0, duplicates = 0;

    // Build contact records
    const contacts: Array<{ profile_id: string; email: string; source: string; first_name?: string; last_name?: string; phone?: string; company?: string; status?: string }> = [];
    const seenEmails = new Set<string>();

    for (const row of rows) {
      const email = row[emailIdx]?.trim().toLowerCase();
      if (!email || !isValidEmail(email)) { skipped++; continue; }
      if (seenEmails.has(email)) { duplicates++; continue; }
      seenEmails.add(email);

      const contact = { profile_id: profile.id, email, source: 'csv_import' } as {
        profile_id: string; email: string; source: string;
        first_name?: string; last_name?: string; phone?: string; company?: string; status?: string;
      };
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field !== '__skip__' && field !== 'email') {
          const val = row[Number(colIdx)]?.trim();
          if (val) (contact as any)[field] = val;
        }
      });
      contacts.push(contact);
    }

    if (contacts.length === 0) {
      toast.error('No valid contacts to import');
      setStep('mapping');
      return;
    }

    // Check for existing emails for duplicate detection
    if (skipDuplicates) {
      const emails = contacts.map(c => c.email);
      // Batch check in chunks of 100
      const existingEmails = new Set<string>();
      for (let i = 0; i < emails.length; i += 100) {
        const chunk = emails.slice(i, i + 100);
        const { data } = await supabase
          .from('email_contacts')
          .select('email')
          .eq('profile_id', profile.id)
          .in('email', chunk);
        data?.forEach(d => existingEmails.add(d.email));
      }

      const newContacts = contacts.filter(c => {
        if (existingEmails.has(c.email)) { duplicates++; return false; }
        return true;
      });

      if (newContacts.length === 0) {
        setImportResults({ imported: 0, skipped, errors: 0, duplicates });
        setStep('done');
        return;
      }

      // Insert in batches of 50
      for (let i = 0; i < newContacts.length; i += 50) {
        const batch = newContacts.slice(i, i + 50);
        const { error } = await supabase.from('email_contacts').insert(batch);
        if (error) { errors += batch.length; }
        else { imported += batch.length; }
      }
    } else {
      // Upsert mode
      for (let i = 0; i < contacts.length; i += 50) {
        const batch = contacts.slice(i, i + 50);
        const { error } = await supabase.from('email_contacts').upsert(batch, { onConflict: 'profile_id,email' });
        if (error) { errors += batch.length; }
        else { imported += batch.length; }
      }
    }

    setImportResults({ imported, skipped, errors, duplicates });
    setStep('done');
  };

  return (
    <div className="space-y-4">
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">Drop a CSV file here or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1">Max 5MB • UTF-8 encoded • First row should be headers</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Map Columns</p>
              <p className="text-sm text-muted-foreground">{fileName} • {rows.length} rows found</p>
            </div>
            {!hasEmailMapping && (
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Email column required</Badge>
            )}
          </div>

          <div className="space-y-2">
            {headers.map((header, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium min-w-[140px] truncate">{header}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={mapping[idx] || '__skip__'} onValueChange={v => setMapping({ ...mapping, [idx]: v })}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTACT_FIELDS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch checked={skipDuplicates} onCheckedChange={setSkipDuplicates} />
            <Label>Skip duplicate emails (otherwise update existing contacts)</Label>
          </div>

          {/* Preview */}
          {hasEmailMapping && previewData.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Preview (first 5 rows)</p>
              <ScrollArea className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {CONTACT_FIELDS.filter(f => f.value !== '__skip__' && Object.values(mapping).includes(f.value)).map(f => (
                        <TableHead key={f.value}>{f.label.replace(' *', '')}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow key={i}>
                        {CONTACT_FIELDS.filter(f => f.value !== '__skip__' && Object.values(mapping).includes(f.value)).map(f => (
                          <TableCell key={f.value} className="text-sm">
                            {f.value === 'email' && row[f.value] && !isValidEmail(row[f.value]) ? (
                              <span className="text-destructive">{row[f.value] || '—'}</span>
                            ) : (
                              row[f.value] || '—'
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleImport} disabled={!hasEmailMapping}>
              <Upload className="h-4 w-4 mr-2" />Import {rows.length} Contacts
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="py-12 text-center space-y-4">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
          <p className="font-medium">Importing contacts...</p>
          <p className="text-sm text-muted-foreground">This may take a moment for large files</p>
        </div>
      )}

      {step === 'done' && (
        <div className="py-8 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
          <p className="font-medium text-lg">Import Complete</p>
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{importResults.imported}</p>
              <p className="text-muted-foreground">Imported</p>
            </div>
            {importResults.duplicates > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{importResults.duplicates}</p>
                <p className="text-muted-foreground">Duplicates</p>
              </div>
            )}
            {importResults.skipped > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">{importResults.skipped}</p>
                <p className="text-muted-foreground">Skipped</p>
              </div>
            )}
            {importResults.errors > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{importResults.errors}</p>
                <p className="text-muted-foreground">Errors</p>
              </div>
            )}
          </div>
          <Button onClick={onComplete} className="mt-4">Done</Button>
        </div>
      )}
    </div>
  );
}
