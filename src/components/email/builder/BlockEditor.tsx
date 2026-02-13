import { EmailBlock } from './emailBlockTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BlockEditorProps {
  block: EmailBlock;
  onChange: (content: Record<string, any>) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  const update = (key: string, value: any) => onChange({ ...block.content, [key]: value });

  switch (block.type) {
    case 'header':
      return (
        <div className="space-y-3">
          <div><Label>Header Text</Label><Input value={block.content.text} onChange={e => update('text', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Font Size</Label><Input type="number" value={block.content.fontSize} onChange={e => update('fontSize', e.target.value)} /></div>
            <div><Label>Align</Label>
              <Select value={block.content.align} onValueChange={v => update('align', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Text Color</Label><Input type="color" value={block.content.color} onChange={e => update('color', e.target.value)} className="h-9" /></div>
            <div><Label>Background</Label><Input type="color" value={block.content.backgroundColor} onChange={e => update('backgroundColor', e.target.value)} className="h-9" /></div>
          </div>
          <div><Label>Padding</Label><Input type="number" value={block.content.padding} onChange={e => update('padding', e.target.value)} /></div>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-3">
          <div><Label>Content</Label><Textarea value={block.content.text} onChange={e => update('text', e.target.value)} rows={4} /></div>
          <p className="text-xs text-muted-foreground">Use {'{{first_name}}'}, {'{{last_name}}'}, {'{{email}}'}, {'{{company}}'} for personalization</p>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Font Size</Label><Input type="number" value={block.content.fontSize} onChange={e => update('fontSize', e.target.value)} /></div>
            <div><Label>Line Height</Label><Input value={block.content.lineHeight} onChange={e => update('lineHeight', e.target.value)} /></div>
            <div><Label>Align</Label>
              <Select value={block.content.align} onValueChange={v => update('align', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Text Color</Label><Input type="color" value={block.content.color} onChange={e => update('color', e.target.value)} className="h-9" /></div>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          <div><Label>Image URL</Label><Input value={block.content.src} onChange={e => update('src', e.target.value)} placeholder="https://..." /></div>
          <div><Label>Alt Text</Label><Input value={block.content.alt} onChange={e => update('alt', e.target.value)} /></div>
          <div><Label>Link (optional)</Label><Input value={block.content.link} onChange={e => update('link', e.target.value)} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Width %</Label><Input type="number" value={block.content.width} onChange={e => update('width', e.target.value)} min="10" max="100" /></div>
            <div><Label>Align</Label>
              <Select value={block.content.align} onValueChange={v => update('align', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    case 'button':
      return (
        <div className="space-y-3">
          <div><Label>Button Text</Label><Input value={block.content.text} onChange={e => update('text', e.target.value)} /></div>
          <div><Label>Link URL</Label><Input value={block.content.link} onChange={e => update('link', e.target.value)} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Button Color</Label><Input type="color" value={block.content.backgroundColor} onChange={e => update('backgroundColor', e.target.value)} className="h-9" /></div>
            <div><Label>Text Color</Label><Input type="color" value={block.content.color} onChange={e => update('color', e.target.value)} className="h-9" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Font Size</Label><Input type="number" value={block.content.fontSize} onChange={e => update('fontSize', e.target.value)} /></div>
            <div><Label>Radius</Label><Input type="number" value={block.content.borderRadius} onChange={e => update('borderRadius', e.target.value)} /></div>
            <div><Label>Align</Label>
              <Select value={block.content.align} onValueChange={v => update('align', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={block.content.fullWidth} onCheckedChange={v => update('fullWidth', v)} />
            <Label>Full Width</Label>
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="space-y-3">
          <div><Label>Footer Text</Label><Textarea value={block.content.text} onChange={e => update('text', e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Text Color</Label><Input type="color" value={block.content.color} onChange={e => update('color', e.target.value)} className="h-9" /></div>
            <div><Label>Background</Label><Input type="color" value={block.content.backgroundColor} onChange={e => update('backgroundColor', e.target.value)} className="h-9" /></div>
          </div>
          <div><Label>Font Size</Label><Input type="number" value={block.content.fontSize} onChange={e => update('fontSize', e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={block.content.showUnsubscribe} onCheckedChange={v => update('showUnsubscribe', v)} />
            <Label>Show Unsubscribe Link</Label>
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Color</Label><Input type="color" value={block.content.color} onChange={e => update('color', e.target.value)} className="h-9" /></div>
            <div><Label>Thickness</Label><Input type="number" value={block.content.thickness} onChange={e => update('thickness', e.target.value)} min="1" max="10" /></div>
            <div><Label>Width %</Label><Input type="number" value={block.content.width} onChange={e => update('width', e.target.value)} min="10" max="100" /></div>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div><Label>Height (px)</Label><Input type="number" value={block.content.height} onChange={e => update('height', e.target.value)} min="8" max="120" /></div>
      );

    case 'columns':
      return (
        <div className="space-y-3">
          <div><Label>Number of Columns</Label>
            <Select value={String(block.content.columns)} onValueChange={v => update('columns', Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Gap (px)</Label><Input type="number" value={block.content.gap} onChange={e => update('gap', e.target.value)} /></div>
          <div><Label>Padding</Label><Input type="number" value={block.content.padding} onChange={e => update('padding', e.target.value)} /></div>
          <div><Label>Background</Label><Input type="color" value={block.content.backgroundColor || '#ffffff'} onChange={e => update('backgroundColor', e.target.value)} className="h-9" /></div>
          {Array.from({ length: Number(block.content.columns) || 2 }).map((_, i) => (
            <div key={i}><Label>Column {i + 1} Content</Label><Textarea value={block.content[`col${i + 1}_text`] || ''} onChange={e => update(`col${i + 1}_text`, e.target.value)} rows={2} /></div>
          ))}
        </div>
      );

    case 'social':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch checked={block.content.showLabel} onCheckedChange={v => update('showLabel', v)} />
            <Label>Show Label</Label>
          </div>
          {block.content.showLabel && (
            <div><Label>Label Text</Label><Input value={block.content.label} onChange={e => update('label', e.target.value)} /></div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Icon Size</Label><Input type="number" value={block.content.iconSize} onChange={e => update('iconSize', e.target.value)} min="16" max="64" /></div>
            <div><Label>Icon Color</Label><Input type="color" value={block.content.iconColor} onChange={e => update('iconColor', e.target.value)} className="h-9" /></div>
          </div>
          <div><Label>Align</Label>
            <Select value={block.content.align} onValueChange={v => update('align', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
            </Select>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Social URLs</p>
          <div><Label>Facebook</Label><Input value={block.content.facebook} onChange={e => update('facebook', e.target.value)} placeholder="https://facebook.com/..." /></div>
          <div><Label>X / Twitter</Label><Input value={block.content.twitter} onChange={e => update('twitter', e.target.value)} placeholder="https://x.com/..." /></div>
          <div><Label>Instagram</Label><Input value={block.content.instagram} onChange={e => update('instagram', e.target.value)} placeholder="https://instagram.com/..." /></div>
          <div><Label>LinkedIn</Label><Input value={block.content.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="https://linkedin.com/..." /></div>
          <div><Label>YouTube</Label><Input value={block.content.youtube} onChange={e => update('youtube', e.target.value)} placeholder="https://youtube.com/..." /></div>
          <div><Label>TikTok</Label><Input value={block.content.tiktok} onChange={e => update('tiktok', e.target.value)} placeholder="https://tiktok.com/..." /></div>
        </div>
      );

    case 'video':
      return (
        <div className="space-y-3">
          <div><Label>Video URL</Label><Input value={block.content.videoUrl} onChange={e => update('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
          <p className="text-xs text-muted-foreground">YouTube URLs auto-generate thumbnails</p>
          <div><Label>Custom Thumbnail URL</Label><Input value={block.content.thumbnailUrl} onChange={e => update('thumbnailUrl', e.target.value)} placeholder="https://..." /></div>
          <div><Label>Alt Text</Label><Input value={block.content.alt} onChange={e => update('alt', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Width %</Label><Input type="number" value={block.content.width} onChange={e => update('width', e.target.value)} min="30" max="100" /></div>
            <div><Label>Align</Label>
              <Select value={block.content.align} onValueChange={v => update('align', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Play Button Color</Label><Input type="color" value={block.content.playButtonColor} onChange={e => update('playButtonColor', e.target.value)} className="h-9" /></div>
        </div>
      );

    case 'countdown':
      return (
        <div className="space-y-3">
          <div><Label>Target Date</Label><Input type="date" value={block.content.targetDate} onChange={e => update('targetDate', e.target.value)} /></div>
          <div><Label>Label</Label><Input value={block.content.label} onChange={e => update('label', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Background</Label><Input type="color" value={block.content.backgroundColor} onChange={e => update('backgroundColor', e.target.value)} className="h-9" /></div>
            <div><Label>Text Color</Label><Input type="color" value={block.content.textColor} onChange={e => update('textColor', e.target.value)} className="h-9" /></div>
          </div>
          <div><Label>Accent Color</Label><Input type="color" value={block.content.accentColor} onChange={e => update('accentColor', e.target.value)} className="h-9" /></div>
          <div className="space-y-2">
            <Label className="text-xs">Show Units</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2"><Switch checked={block.content.showDays} onCheckedChange={v => update('showDays', v)} /><Label className="text-xs">Days</Label></div>
              <div className="flex items-center gap-2"><Switch checked={block.content.showHours} onCheckedChange={v => update('showHours', v)} /><Label className="text-xs">Hours</Label></div>
              <div className="flex items-center gap-2"><Switch checked={block.content.showMinutes} onCheckedChange={v => update('showMinutes', v)} /><Label className="text-xs">Minutes</Label></div>
              <div className="flex items-center gap-2"><Switch checked={block.content.showSeconds} onCheckedChange={v => update('showSeconds', v)} /><Label className="text-xs">Seconds</Label></div>
            </div>
          </div>
        </div>
      );

    case 'product':
      return (
        <div className="space-y-3">
          <div><Label>Product Name</Label><Input value={block.content.name} onChange={e => update('name', e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={block.content.description} onChange={e => update('description', e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Price</Label><Input value={block.content.price} onChange={e => update('price', e.target.value)} /></div>
            <div><Label>Original Price</Label><Input value={block.content.originalPrice} onChange={e => update('originalPrice', e.target.value)} placeholder="Strike-through" /></div>
          </div>
          <div><Label>Image URL</Label><Input value={block.content.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Button Text</Label><Input value={block.content.buttonText} onChange={e => update('buttonText', e.target.value)} /></div>
            <div><Label>Button Link</Label><Input value={block.content.buttonLink} onChange={e => update('buttonLink', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Button Color</Label><Input type="color" value={block.content.buttonColor} onChange={e => update('buttonColor', e.target.value)} className="h-9" /></div>
            <div><Label>Border Color</Label><Input type="color" value={block.content.borderColor} onChange={e => update('borderColor', e.target.value)} className="h-9" /></div>
          </div>
        </div>
      );

    case 'html':
      return (
        <div className="space-y-3">
          <div><Label>Custom HTML</Label><Textarea value={block.content.code} onChange={e => update('code', e.target.value)} rows={8} className="font-mono text-xs" /></div>
          <p className="text-[10px] text-muted-foreground">⚠️ Ensure your HTML is email-safe. Avoid JavaScript or external CSS.</p>
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">No settings available</p>;
  }
}
