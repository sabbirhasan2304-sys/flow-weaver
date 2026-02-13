import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Users, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface EmailList {
  id: string;
  name: string;
  description: string | null;
  subscriber_count: number;
  is_default: boolean;
  created_at: string;
}

export function EmailLists() {
  const { profile } = useAuth();
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (profile) fetchLists();
  }, [profile]);

  const fetchLists = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('email_lists')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load lists');
    else setLists(data || []);
    setLoading(false);
  };

  const createList = async () => {
    if (!profile || !form.name) return;
    const { error } = await supabase
      .from('email_lists')
      .insert({ profile_id: profile.id, name: form.name, description: form.description || null });
    if (error) toast.error('Failed to create list');
    else { toast.success('List created'); setDialogOpen(false); setForm({ name: '', description: '' }); fetchLists(); }
  };

  const deleteList = async (id: string) => {
    const { error } = await supabase.from('email_lists').delete().eq('id', id);
    if (error) toast.error('Failed to delete list');
    else { toast.success('List deleted'); fetchLists(); }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Organize your contacts into targeted lists</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New List</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create List</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Newsletter Subscribers" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createList}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : lists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No lists yet. Create your first list to organize contacts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map(list => (
            <Card key={list.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    <CardDescription>{list.description || 'No description'}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteList(list.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{list.subscriber_count} subscribers</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {format(new Date(list.created_at), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
