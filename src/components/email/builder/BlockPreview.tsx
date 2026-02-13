import { EmailBlock } from './emailBlockTypes';
import { Heading1, Type, ImageIcon, MousePointerClick, FileText, Minus, MoveVertical } from 'lucide-react';

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
