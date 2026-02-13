import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, LayoutTemplate, Trash2, Copy, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { EmailBuilder } from './builder/EmailBuilder';
import { EmailBlock } from './builder/emailBlockTypes';

interface Template {
  id: string;
  name: string;
  subject: string | null;
  category: string;
  html_content: string | null;
  json_content: any;
  created_at: string;
  updated_at: string;
}

export function EmailTemplates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (profile) fetchTemplates();
  }, [profile]);

  const fetchTemplates = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase.from('email_templates').select('*').eq('profile_id', profile.id).order('updated_at', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setBuilderOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setBuilderOpen(true);
  };

  const handleSaveFromBuilder = async (data: { blocks: EmailBlock[]; html: string; subject: string }) => {
    if (!profile) return;

    if (editingTemplate) {
      const { error } = await supabase.from('email_templates').update({
        name: data.subject || editingTemplate.name,
        subject: data.subject,
        html_content: data.html,
        json_content: JSON.parse(JSON.stringify(data.blocks)),
      }).eq('id', editingTemplate.id);
      if (error) toast.error('Failed to update template');
      else toast.success('Template updated');
    } else {
      const { error } = await supabase.from('email_templates').insert([{
        profile_id: profile.id,
        name: data.subject || 'Untitled Template',
        subject: data.subject,
        html_content: data.html,
        json_content: JSON.parse(JSON.stringify(data.blocks)),
        category: 'custom',
      }]);
      if (error) toast.error('Failed to save template');
      else toast.success('Template saved');
    }

    setBuilderOpen(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('email_templates').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchTemplates(); }
  };

  const duplicateTemplate = async (template: Template) => {
    if (!profile) return;
    const { error } = await supabase.from('email_templates').insert({
      profile_id: profile.id, name: `${template.name} (Copy)`, subject: template.subject,
      category: template.category, html_content: template.html_content, json_content: template.json_content,
    });
    if (error) toast.error('Failed to duplicate');
    else { toast.success('Duplicated'); fetchTemplates(); }
  };

  const categoryColors: Record<string, string> = {
    custom: 'bg-blue-500/10 text-blue-500',
    marketing: 'bg-purple-500/10 text-purple-500',
    transactional: 'bg-green-500/10 text-green-500',
    welcome: 'bg-orange-500/10 text-orange-500',
    cart: 'bg-red-500/10 text-red-500',
  };

  return (
    <>
      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Create reusable email templates with the visual builder</p>
          <Button onClick={handleNewTemplate}><Plus className="h-4 w-4 mr-2" />New Template</Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : templates.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No templates yet. Create your first template with the visual builder!</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <Card key={t.id} className="group hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{t.name}</CardTitle>
                      <CardDescription className="truncate">{t.subject || 'No subject'}</CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${categoryColors[t.category] || categoryColors.custom}`}>{t.category}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Mini preview */}
                  {t.html_content && (
                    <div className="border rounded-md overflow-hidden mb-3 h-28">
                      <div
                        className="transform scale-[0.2] origin-top-left w-[500%] h-[500%] pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: t.html_content }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Updated {format(new Date(t.updated_at), 'MMM d, yyyy')}</p>
                  <div className="flex gap-1 mt-3">
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(t)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateTemplate(t)}><Copy className="h-3 w-3 mr-1" />Copy</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTemplate(t.id)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen builder dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0">
          <EmailBuilder
            initialBlocks={editingTemplate?.json_content as EmailBlock[] || undefined}
            initialSubject={editingTemplate?.subject || ''}
            onSave={handleSaveFromBuilder}
            onCancel={() => { setBuilderOpen(false); setEditingTemplate(null); }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
