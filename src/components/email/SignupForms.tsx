import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, Code, Eye, Palette, Plus, FileText } from 'lucide-react';

interface FormConfig {
  title: string;
  description: string;
  buttonText: string;
  successMessage: string;
  collectName: boolean;
  collectPhone: boolean;
  collectCompany: boolean;
  listId: string;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: string;
}

const DEFAULT_CONFIG: FormConfig = {
  title: 'Subscribe to our newsletter',
  description: 'Get the latest updates delivered to your inbox.',
  buttonText: 'Subscribe',
  successMessage: 'Thanks for subscribing!',
  collectName: true,
  collectPhone: false,
  collectCompany: false,
  listId: '',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
  buttonColor: '#7c3aed',
  buttonTextColor: '#ffffff',
  borderRadius: '8',
};

function generateEmbedCode(config: FormConfig, supabaseUrl: string): string {
  const fields = [
    `<input type="email" name="email" placeholder="Your email" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:${config.borderRadius}px;margin-bottom:8px;font-size:14px;" />`,
  ];
  if (config.collectName) {
    fields.unshift(`<input type="text" name="first_name" placeholder="First name" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:${config.borderRadius}px;margin-bottom:8px;font-size:14px;" />`);
  }
  if (config.collectPhone) {
    fields.push(`<input type="tel" name="phone" placeholder="Phone" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:${config.borderRadius}px;margin-bottom:8px;font-size:14px;" />`);
  }
  if (config.collectCompany) {
    fields.push(`<input type="text" name="company" placeholder="Company" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:${config.borderRadius}px;margin-bottom:8px;font-size:14px;" />`);
  }

  return `<!-- Signup Form -->
<div id="signup-form-container" style="max-width:400px;padding:24px;background:${config.bgColor};border-radius:${config.borderRadius}px;border:1px solid #e5e7eb;font-family:Arial,sans-serif;">
  <h3 style="margin:0 0 8px;color:${config.textColor};font-size:18px;">${config.title}</h3>
  <p style="margin:0 0 16px;color:${config.textColor}99;font-size:14px;">${config.description}</p>
  <form id="signup-form" onsubmit="handleSignup(event)">
    ${fields.join('\n    ')}
    <button type="submit" style="width:100%;padding:10px;background:${config.buttonColor};color:${config.buttonTextColor};border:none;border-radius:${config.borderRadius}px;font-size:14px;cursor:pointer;font-weight:600;">${config.buttonText}</button>
  </form>
  <p id="signup-message" style="display:none;text-align:center;margin-top:12px;color:${config.textColor};font-size:14px;">${config.successMessage}</p>
</div>
<script>
async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch('${supabaseUrl}/functions/v1/public-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', ...data${config.listId ? `, list_id: '${config.listId}'` : ''} }),
    });
    if (res.ok) {
      form.style.display = 'none';
      document.getElementById('signup-message').style.display = 'block';
    }
  } catch (err) { console.error(err); }
}
</script>`;
}

export function SignupForms() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<FormConfig>({ ...DEFAULT_CONFIG });
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'code'>('edit');
  const [embedCode, setEmbedCode] = useState('');

  useEffect(() => {
    if (profile) fetchLists();
  }, [profile]);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    setEmbedCode(generateEmbedCode(config, url));
  }, [config]);

  const fetchLists = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('email_lists')
      .select('id, name')
      .eq('profile_id', profile.id);
    setLists(data || []);
  };

  const update = (key: keyof FormConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard');
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Create embeddable signup forms for your website</p>
        <div className="flex border rounded-md">
          <Button variant={previewMode === 'edit' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('edit')} className="text-xs rounded-r-none">
            <Palette className="h-3 w-3 mr-1" />Design
          </Button>
          <Button variant={previewMode === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('preview')} className="text-xs rounded-none">
            <Eye className="h-3 w-3 mr-1" />Preview
          </Button>
          <Button variant={previewMode === 'code' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('code')} className="text-xs rounded-l-none">
            <Code className="h-3 w-3 mr-1" />Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        {previewMode === 'edit' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Form Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-xs">Title</Label><Input value={config.title} onChange={e => update('title', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={config.description} onChange={e => update('description', e.target.value)} rows={2} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Button Text</Label><Input value={config.buttonText} onChange={e => update('buttonText', e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Success Message</Label><Input value={config.successMessage} onChange={e => update('successMessage', e.target.value)} className="mt-1" /></div>
              </div>

              <div>
                <Label className="text-xs">Add to List</Label>
                <Select value={config.listId || "none"} onValueChange={v => update('listId', v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select list (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No list</SelectItem>
                    {lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Collect Fields</Label>
                <div className="flex items-center gap-2"><Switch checked={config.collectName} onCheckedChange={v => update('collectName', v)} /><span className="text-sm">Name</span></div>
                <div className="flex items-center gap-2"><Switch checked={config.collectPhone} onCheckedChange={v => update('collectPhone', v)} /><span className="text-sm">Phone</span></div>
                <div className="flex items-center gap-2"><Switch checked={config.collectCompany} onCheckedChange={v => update('collectCompany', v)} /><span className="text-sm">Company</span></div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Colors</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2"><Input type="color" value={config.bgColor} onChange={e => update('bgColor', e.target.value)} className="h-8 w-12 p-1" /><span className="text-xs">Background</span></div>
                  <div className="flex items-center gap-2"><Input type="color" value={config.textColor} onChange={e => update('textColor', e.target.value)} className="h-8 w-12 p-1" /><span className="text-xs">Text</span></div>
                  <div className="flex items-center gap-2"><Input type="color" value={config.buttonColor} onChange={e => update('buttonColor', e.target.value)} className="h-8 w-12 p-1" /><span className="text-xs">Button</span></div>
                  <div className="flex items-center gap-2"><Input type="color" value={config.buttonTextColor} onChange={e => update('buttonTextColor', e.target.value)} className="h-8 w-12 p-1" /><span className="text-xs">Button Text</span></div>
                </div>
              </div>

              <div>
                <Label className="text-xs">Border Radius (px)</Label>
                <Input type="number" value={config.borderRadius} onChange={e => update('borderRadius', e.target.value)} min="0" max="24" className="mt-1" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview / Code */}
        <div>
          {previewMode === 'code' ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Embed Code</CardTitle>
                <Button size="sm" variant="outline" onClick={copyCode}><Copy className="h-3 w-3 mr-1" />Copy</Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 font-mono whitespace-pre-wrap">{embedCode}</pre>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
              <CardContent className="flex justify-center bg-muted/30 p-8 rounded-b-lg">
                <div style={{ maxWidth: 400, padding: 24, background: config.bgColor, borderRadius: `${config.borderRadius}px`, border: '1px solid #e5e7eb', fontFamily: 'Arial, sans-serif' }}>
                  <h3 style={{ margin: '0 0 8px', color: config.textColor, fontSize: 18 }}>{config.title}</h3>
                  <p style={{ margin: '0 0 16px', color: `${config.textColor}99`, fontSize: 14 }}>{config.description}</p>
                  {config.collectName && (
                    <input placeholder="First name" disabled style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: `${config.borderRadius}px`, marginBottom: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  )}
                  <input placeholder="Your email" disabled style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: `${config.borderRadius}px`, marginBottom: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  {config.collectPhone && (
                    <input placeholder="Phone" disabled style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: `${config.borderRadius}px`, marginBottom: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  )}
                  {config.collectCompany && (
                    <input placeholder="Company" disabled style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: `${config.borderRadius}px`, marginBottom: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  )}
                  <button disabled style={{ width: '100%', padding: 10, background: config.buttonColor, color: config.buttonTextColor, border: 'none', borderRadius: `${config.borderRadius}px`, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{config.buttonText}</button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
