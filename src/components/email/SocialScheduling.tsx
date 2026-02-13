import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Share2, Plus, Calendar, Clock, Image, Link, Send, Eye, Trash2, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt: string | null;
  publishedAt: string | null;
  engagement: { likes: number; shares: number; comments: number; clicks: number };
}

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'text-sky-500' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
];

const MOCK_POSTS: SocialPost[] = [
  { id: '1', content: '🚀 Exciting news! Our new feature is live. Check it out →', platforms: ['twitter', 'linkedin'], status: 'published', scheduledAt: null, publishedAt: '2026-02-10T10:00:00Z', engagement: { likes: 45, shares: 12, comments: 8, clicks: 156 } },
  { id: '2', content: '📧 Our latest newsletter is out! Top 5 email marketing trends for 2026...', platforms: ['facebook', 'twitter', 'linkedin'], status: 'scheduled', scheduledAt: '2026-02-14T14:00:00Z', publishedAt: null, engagement: { likes: 0, shares: 0, comments: 0, clicks: 0 } },
  { id: '3', content: '✨ Behind the scenes of our product team. See how we build features...', platforms: ['instagram', 'facebook'], status: 'draft', scheduledAt: null, publishedAt: null, engagement: { likes: 0, shares: 0, comments: 0, clicks: 0 } },
];

export function SocialScheduling() {
  const [posts, setPosts] = useState<SocialPost[]>(MOCK_POSTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ content: '', platforms: [] as string[], scheduledAt: '' });

  const togglePlatform = (id: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(id) ? prev.platforms.filter(p => p !== id) : [...prev.platforms, id],
    }));
  };

  const createPost = () => {
    if (!form.content || form.platforms.length === 0) { toast.error('Add content and select platforms'); return; }
    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      content: form.content,
      platforms: form.platforms,
      status: form.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: form.scheduledAt || null,
      publishedAt: null,
      engagement: { likes: 0, shares: 0, comments: 0, clicks: 0 },
    };
    setPosts(prev => [newPost, ...prev]);
    setDialogOpen(false);
    setForm({ content: '', platforms: [], scheduledAt: '' });
    toast.success(form.scheduledAt ? 'Post scheduled' : 'Post saved as draft');
  };

  const totalEngagement = posts.reduce((s, p) => s + p.engagement.likes + p.engagement.shares + p.engagement.comments, 0);
  const totalClicks = posts.reduce((s, p) => s + p.engagement.clicks, 0);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Social Scheduling
          </h2>
          <p className="text-sm text-muted-foreground">Schedule and manage social media posts across platforms</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Post</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Social Post</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Content</Label>
                <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="What's on your mind?" rows={4} maxLength={280} />
                <p className="text-[10px] text-muted-foreground mt-1">{form.content.length}/280 characters</p>
              </div>
              <div>
                <Label>Platforms</Label>
                <div className="flex gap-3 mt-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon;
                    return (
                      <button key={p.id} onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${form.platforms.includes(p.id) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                        <Icon className={`h-4 w-4 ${p.color}`} />
                        <span className="text-xs">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Schedule (optional)</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createPost}>{form.scheduledAt ? 'Schedule' : 'Save Draft'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Posts</p><p className="text-2xl font-bold mt-1">{posts.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Published</p><p className="text-2xl font-bold mt-1">{posts.filter(p => p.status === 'published').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Engagement</p><p className="text-2xl font-bold mt-1">{totalEngagement.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Link Clicks</p><p className="text-2xl font-bold mt-1">{totalClicks.toLocaleString()}</p></CardContent></Card>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map(post => (
          <Card key={post.id}>
            <CardContent className="py-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-sm">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {post.platforms.map(pid => {
                      const platform = PLATFORMS.find(p => p.id === pid);
                      if (!platform) return null;
                      const Icon = platform.icon;
                      return <Icon key={pid} className={`h-3.5 w-3.5 ${platform.color}`} />;
                    })}
                    <Badge variant={post.status === 'published' ? 'default' : post.status === 'scheduled' ? 'outline' : 'secondary'} className="ml-2 text-[10px]">{post.status}</Badge>
                    {post.scheduledAt && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{new Date(post.scheduledAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                {post.status === 'published' && (
                  <div className="flex gap-4 text-center text-[11px] text-muted-foreground shrink-0">
                    <div><p className="font-semibold text-foreground">{post.engagement.likes}</p><p>Likes</p></div>
                    <div><p className="font-semibold text-foreground">{post.engagement.shares}</p><p>Shares</p></div>
                    <div><p className="font-semibold text-foreground">{post.engagement.clicks}</p><p>Clicks</p></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
