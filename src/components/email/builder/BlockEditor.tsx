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

    default:
      return <p className="text-sm text-muted-foreground">No settings available</p>;
  }
}
