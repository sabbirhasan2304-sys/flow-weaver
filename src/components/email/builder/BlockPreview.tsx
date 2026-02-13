import { EmailBlock } from './emailBlockTypes';
import { Heading1, Type, ImageIcon, MousePointerClick, FileText, Minus, MoveVertical, Columns, Share2, PlayCircle, Timer, ShoppingBag, Code } from 'lucide-react';

interface BlockPreviewProps {
  block: EmailBlock;
  selected: boolean;
  onClick: () => void;
}

const iconMap: Record<string, any> = {
  header: Heading1,
  text: Type,
  image: ImageIcon,
  button: MousePointerClick,
  footer: FileText,
  divider: Minus,
  spacer: MoveVertical,
  columns: Columns,
  social: Share2,
  video: PlayCircle,
  countdown: Timer,
  product: ShoppingBag,
  html: Code,
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook', twitter: 'X / Twitter', instagram: 'Instagram',
  linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok',
};

export function BlockPreview({ block, selected, onClick }: BlockPreviewProps) {
  const renderPreview = () => {
    switch (block.type) {
      case 'header':
        return (
          <div style={{ backgroundColor: block.content.backgroundColor, padding: `${block.content.padding}px`, textAlign: block.content.align as any }}>
            <h1 style={{ margin: 0, fontSize: `${Math.min(Number(block.content.fontSize), 32)}px`, fontWeight: block.content.fontWeight, color: block.content.color }}>{block.content.text}</h1>
          </div>
        );
      case 'text':
        return (
          <div style={{ padding: `${block.content.padding}px`, textAlign: block.content.align as any }}>
            <p style={{ margin: 0, fontSize: `${block.content.fontSize}px`, color: block.content.color, lineHeight: block.content.lineHeight, whiteSpace: 'pre-wrap' }}>{block.content.text}</p>
          </div>
        );
      case 'image':
        return (
          <div style={{ padding: `${block.content.padding}px`, textAlign: block.content.align as any }}>
            {block.content.src ? (
              <img src={block.content.src} alt={block.content.alt} style={{ maxWidth: `${block.content.width}%`, height: 'auto', display: 'inline-block' }} />
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground text-sm">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Add image URL in settings
              </div>
            )}
          </div>
        );
      case 'button':
        return (
          <div style={{ padding: `${block.content.padding}px`, textAlign: block.content.align as any }}>
            <span style={{
              display: block.content.fullWidth ? 'block' : 'inline-block',
              backgroundColor: block.content.backgroundColor,
              color: block.content.color,
              fontSize: `${block.content.fontSize}px`,
              padding: '12px 28px',
              borderRadius: `${block.content.borderRadius}px`,
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'default',
            }}>{block.content.text}</span>
          </div>
        );
      case 'footer':
        return (
          <div style={{ backgroundColor: block.content.backgroundColor, padding: `${block.content.padding}px`, textAlign: block.content.align as any }}>
            <p style={{ margin: 0, fontSize: `${block.content.fontSize}px`, color: block.content.color, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {block.content.text}
              {block.content.showUnsubscribe && <><br /><span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Unsubscribe</span></>}
            </p>
          </div>
        );
      case 'divider':
        return (
          <div style={{ padding: `${block.content.padding}px 0` }}>
            <hr style={{ border: 'none', borderTop: `${block.content.thickness}px solid ${block.content.color}`, width: `${block.content.width}%`, margin: '0 auto' }} />
          </div>
        );
      case 'spacer':
        return <div style={{ height: `${block.content.height}px` }} className="flex items-center justify-center"><span className="text-[10px] text-muted-foreground/40">spacer</span></div>;
      case 'columns': {
        const colCount = Number(block.content.columns) || 2;
        return (
          <div style={{ padding: `${block.content.padding}px`, backgroundColor: block.content.backgroundColor || undefined }}>
            <div style={{ display: 'flex', gap: `${block.content.gap}px` }}>
              {Array.from({ length: colCount }).map((_, i) => (
                <div key={i} style={{ flex: 1, padding: '12px', border: '1px dashed #ddd', borderRadius: '4px', fontSize: '13px', color: '#666', whiteSpace: 'pre-wrap' as const }}>
                  {block.content[`col${i + 1}_text`] || `Column ${i + 1}`}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'social': {
        const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'];
        const active = platforms.filter(p => block.content[p]);
        return (
          <div style={{ padding: `${block.content.padding}px`, textAlign: block.content.align as any }}>
            {block.content.showLabel && block.content.label && (
              <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#666' }}>{block.content.label}</p>
            )}
            {active.length > 0 ? (
              <div style={{ display: 'flex', gap: '10px', justifyContent: block.content.align === 'center' ? 'center' : block.content.align === 'right' ? 'flex-end' : 'flex-start', flexWrap: 'wrap' as const }}>
                {active.map(p => (
                  <div key={p} style={{ width: `${block.content.iconSize}px`, height: `${block.content.iconSize}px`, borderRadius: '50%', backgroundColor: block.content.iconColor || '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>{p[0].toUpperCase()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Add social links in settings</p>
            )}
          </div>
        );
      }
      case 'video': {
        const videoUrl = block.content.videoUrl || '';
        const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?#]+)/);
        const thumb = block.content.thumbnailUrl || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : '');
        return (
          <div style={{ padding: `${block.content.padding}px`, textAlign: block.content.align as any }}>
            {thumb ? (
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: `${block.content.width}%` }}>
                <img src={thumb} alt={block.content.alt} style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '52px', height: '36px', backgroundColor: block.content.playButtonColor || '#ff0000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 0, height: 0, borderLeft: '14px solid #fff', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', marginLeft: '3px' }} />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground text-sm">
                <PlayCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Add a video URL in settings
              </div>
            )}
          </div>
        );
      }
      case 'countdown': {
        const c = block.content;
        const units = [
          c.showDays && { label: 'Days', val: '07' },
          c.showHours && { label: 'Hours', val: '12' },
          c.showMinutes && { label: 'Min', val: '34' },
          c.showSeconds && { label: 'Sec', val: '56' },
        ].filter(Boolean) as { label: string; val: string }[];
        return (
          <div style={{ backgroundColor: c.backgroundColor, padding: `${c.padding}px`, textAlign: c.align as any }}>
            {c.label && <p style={{ margin: '0 0 12px', fontSize: '14px', color: c.textColor, opacity: 0.8 }}>{c.label}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              {units.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.accentColor }}>{u.val}</div>
                    <div style={{ fontSize: '11px', color: c.textColor, opacity: 0.7 }}>{u.label}</div>
                  </div>
                  {i < units.length - 1 && <span style={{ fontSize: '24px', color: c.textColor, opacity: 0.5 }}>:</span>}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'product': {
        const p = block.content;
        return (
          <div style={{ padding: `${p.padding}px` }}>
            <div style={{ border: `1px solid ${p.borderColor}`, borderRadius: '8px', overflow: 'hidden', background: p.backgroundColor, display: 'flex' }}>
              <div style={{ width: '40%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                ) : (
                  <div style={{ width: '120px', height: '90px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, padding: '16px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{p.name}</h3>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>{p.description}</p>
                <div style={{ marginBottom: '12px' }}>
                  {p.originalPrice && <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '13px', marginRight: '6px' }}>{p.originalPrice}</span>}
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{p.price}</span>
                </div>
                <span style={{ display: 'inline-block', background: p.buttonColor, color: p.buttonTextColor, padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{p.buttonText}</span>
              </div>
            </div>
          </div>
        );
      }
      case 'html':
        return (
          <div style={{ padding: `${block.content.padding}px` }}>
            <div className="border border-dashed border-muted-foreground/30 rounded p-3 bg-muted/30">
              <div className="flex items-center gap-1 mb-2">
                <Code className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Custom HTML</span>
              </div>
              <div dangerouslySetInnerHTML={{ __html: block.content.code }} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer transition-all ${selected ? 'ring-2 ring-primary ring-offset-2 rounded-sm' : 'hover:ring-1 hover:ring-primary/40 hover:ring-offset-1 rounded-sm'}`}
    >
      {/* Block type indicator */}
      <div className={`absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}>
        {(() => {
          const Icon = iconMap[block.type] || Type;
          return <Icon className="h-4 w-4 text-muted-foreground" />;
        })()}
      </div>
      {renderPreview()}
    </div>
  );
}
