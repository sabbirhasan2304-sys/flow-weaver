import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Trash2, Trophy, FlaskConical, Clock } from 'lucide-react';

interface Variant {
  id?: string;
  variant_label: string;
  subject: string;
  html_content: string;
  weight: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  is_winner: boolean;
}

interface ABTestEditorProps {
  campaignId: string;
  onClose: () => void;
}

export function ABTestEditor({ campaignId, onClose }: ABTestEditorProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [metric, setMetric] = useState('opens');
  const [durationHours, setDurationHours] = useState(4);
  const [samplePercent, setSamplePercent] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasWinner, setHasWinner] = useState(false);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: campaign }, { data: existingVariants }] = await Promise.all([
      supabase.from('email_campaigns').select('subject, html_content, ab_test_metric, ab_test_duration_hours, ab_test_sample_percent').eq('id', campaignId).single(),
      supabase.from('email_ab_variants').select('*').eq('campaign_id', campaignId).order('variant_label'),
    ]);

    if (campaign) {
      setMetric(campaign.ab_test_metric || 'opens');
      setDurationHours(campaign.ab_test_duration_hours || 4);
      setSamplePercent(campaign.ab_test_sample_percent || 30);
    }

    if (existingVariants && existingVariants.length > 0) {
      setVariants(existingVariants.map(v => ({
        id: v.id,
        variant_label: v.variant_label,
        subject: v.subject || '',
        html_content: v.html_content || '',
        weight: v.weight,
        total_sent: v.total_sent,
        total_opens: v.total_opens,
        total_clicks: v.total_clicks,
        total_bounces: v.total_bounces,
        is_winner: v.is_winner,
      })));
      setHasWinner(existingVariants.some(v => v.is_winner));
    } else {
      // Initialize with 2 variants from campaign data
      setVariants([
        { variant_label: 'A', subject: campaign?.subject || '', html_content: campaign?.html_content || '', weight: 50, total_sent: 0, total_opens: 0, total_clicks: 0, total_bounces: 0, is_winner: false },
        { variant_label: 'B', subject: '', html_content: campaign?.html_content || '', weight: 50, total_sent: 0, total_opens: 0, total_clicks: 0, total_bounces: 0, is_winner: false },
      ]);
    }
    setLoading(false);
  };

  const addVariant = () => {
    if (variants.length >= 4) { toast.error('Maximum 4 variants'); return; }
    const labels = ['A', 'B', 'C', 'D'];
    const nextLabel = labels[variants.length] || `V${variants.length + 1}`;
    const equalWeight = Math.floor(100 / (variants.length + 1));
    const updated = variants.map(v => ({ ...v, weight: equalWeight }));
    updated.push({ variant_label: nextLabel, subject: '', html_content: '', weight: 100 - equalWeight * variants.length, total_sent: 0, total_opens: 0, total_clicks: 0, total_bounces: 0, is_winner: false });
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) { toast.error('Minimum 2 variants required'); return; }
    const updated = variants.filter((_, i) => i !== index);
    const equalWeight = Math.floor(100 / updated.length);
    const rebalanced = updated.map((v, i) => ({ ...v, weight: i === updated.length - 1 ? 100 - equalWeight * (updated.length - 1) : equalWeight }));
    setVariants(rebalanced);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const adjustWeights = (index: number, newWeight: number) => {
    const clamped = Math.max(10, Math.min(90, newWeight));
    const remaining = 100 - clamped;
    const othersCount = variants.length - 1;
    const perOther = Math.floor(remaining / othersCount);
    const updated = variants.map((v, i) => {
      if (i === index) return { ...v, weight: clamped };
      if (i === variants.length - 1 && i !== index) return { ...v, weight: remaining - perOther * (othersCount - 1) };
      return { ...v, weight: perOther };
    });
    setVariants(updated);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Update campaign A/B settings
      await supabase.from('email_campaigns').update({
        is_ab_test: true,
        ab_test_metric: metric,
        ab_test_duration_hours: durationHours,
        ab_test_sample_percent: samplePercent,
      }).eq('id', campaignId);

      // Delete existing variants that are no longer present
      const existingIds = variants.filter(v => v.id).map(v => v.id!);
      if (existingIds.length > 0) {
        await supabase.from('email_ab_variants').delete().eq('campaign_id', campaignId).not('id', 'in', `(${existingIds.join(',')})`);
      } else {
        await supabase.from('email_ab_variants').delete().eq('campaign_id', campaignId);
      }

      // Upsert variants
      for (const v of variants) {
        if (v.id) {
          await supabase.from('email_ab_variants').update({
            variant_label: v.variant_label,
            subject: v.subject,
            html_content: v.html_content,
            weight: v.weight,
          }).eq('id', v.id);
        } else {
          await supabase.from('email_ab_variants').insert({
            campaign_id: campaignId,
            variant_label: v.variant_label,
            subject: v.subject,
            html_content: v.html_content,
            weight: v.weight,
          });
        }
      }

      toast.success('A/B test saved');
      onClose();
    } catch (err) {
      toast.error('Failed to save A/B test');
    } finally {
      setSaving(false);
    }
  };

  const getMetricValue = (v: Variant) => {
    if (metric === 'opens') return v.total_sent ? ((v.total_opens / v.total_sent) * 100).toFixed(1) : '0';
    if (metric === 'clicks') return v.total_opens ? ((v.total_clicks / v.total_opens) * 100).toFixed(1) : '0';
    return '0';
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            A/B Test Settings
          </CardTitle>
          <CardDescription>Configure how the test runs and when a winner is selected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Winning Metric</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="opens">Open Rate</SelectItem>
                  <SelectItem value="clicks">Click Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Test Duration (hours)</Label>
              <Select value={String(durationHours)} onValueChange={v => setDurationHours(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sample Size: {samplePercent}%</Label>
              <Slider
                value={[samplePercent]}
                onValueChange={([v]) => setSamplePercent(v)}
                min={10}
                max={50}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {samplePercent}% gets variants, {100 - samplePercent}% gets the winner
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Variants ({variants.length})</h3>
          <Button variant="outline" size="sm" onClick={addVariant} disabled={variants.length >= 4 || hasWinner}>
            <Plus className="h-4 w-4 mr-1" /> Add Variant
          </Button>
        </div>

        {variants.map((variant, index) => (
          <Card key={index} className={variant.is_winner ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={variant.is_winner ? 'default' : 'secondary'} className="text-sm">
                    {variant.is_winner && <Trophy className="h-3 w-3 mr-1" />}
                    Variant {variant.variant_label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Weight: {variant.weight}%</span>
                </div>
                {!hasWinner && variants.length > 2 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeVariant(index)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Results (if sent) */}
              {variant.total_sent > 0 && (
                <div className="grid grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg text-center text-sm">
                  <div><p className="font-semibold">{variant.total_sent}</p><p className="text-xs text-muted-foreground">Sent</p></div>
                  <div><p className="font-semibold text-chart-1">{getMetricValue({ ...variant })}%</p><p className="text-xs text-muted-foreground">{metric === 'opens' ? 'Open Rate' : 'Click Rate'}</p></div>
                  <div><p className="font-semibold">{variant.total_opens}</p><p className="text-xs text-muted-foreground">Opens</p></div>
                  <div><p className="font-semibold">{variant.total_clicks}</p><p className="text-xs text-muted-foreground">Clicks</p></div>
                </div>
              )}

              {!hasWinner && (
                <>
                  <div>
                    <Label>Subject Line</Label>
                    <Input value={variant.subject} onChange={e => updateVariant(index, 'subject', e.target.value)} placeholder={`Subject for variant ${variant.variant_label}`} />
                  </div>
                  <div>
                    <Label>Email Content (HTML)</Label>
                    <Textarea value={variant.html_content} onChange={e => updateVariant(index, 'html_content', e.target.value)} rows={4} placeholder="<h1>Hello</h1>" />
                  </div>
                  <div>
                    <Label>Weight: {variant.weight}%</Label>
                    <Slider
                      value={[variant.weight]}
                      onValueChange={([v]) => adjustWeights(index, v)}
                      min={10}
                      max={90}
                      step={5}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        {!hasWinner && (
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save A/B Test'}
          </Button>
        )}
      </div>
    </div>
  );
}
