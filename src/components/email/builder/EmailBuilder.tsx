import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EmailBlock, createBlock, blocksToHtml } from './emailBlockTypes';
import { BlockPreview } from './BlockPreview';
import { BlockEditor } from './BlockEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heading1, Type, ImageIcon, MousePointerClick, FileText, Minus,
  MoveVertical, Trash2, Copy, ArrowUp, ArrowDown, Eye, Code,
  GripVertical, X, Save, Columns, Share2, PlayCircle,
} from 'lucide-react';

interface EmailBuilderProps {
  initialBlocks?: EmailBlock[];
  initialSubject?: string;
  onSave: (data: { blocks: EmailBlock[]; html: string; subject: string }) => void;
  onCancel: () => void;
}

const BLOCK_PALETTE = [
  { type: 'header' as const, label: 'Header', icon: Heading1, description: 'Title / heading' },
  { type: 'text' as const, label: 'Text', icon: Type, description: 'Paragraph text' },
  { type: 'image' as const, label: 'Image', icon: ImageIcon, description: 'Image block' },
  { type: 'button' as const, label: 'Button', icon: MousePointerClick, description: 'CTA button' },
  { type: 'columns' as const, label: 'Columns', icon: Columns, description: '2-3 column layout' },
  { type: 'social' as const, label: 'Social', icon: Share2, description: 'Social links' },
  { type: 'video' as const, label: 'Video', icon: PlayCircle, description: 'Video embed' },
  { type: 'divider' as const, label: 'Divider', icon: Minus, description: 'Horizontal line' },
  { type: 'spacer' as const, label: 'Spacer', icon: MoveVertical, description: 'Vertical space' },
  { type: 'footer' as const, label: 'Footer', icon: FileText, description: 'Footer content' },
];

function SortableBlock({ block, selected, onClick }: { block: EmailBlock; selected: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1 group/sortable">
      <div {...attributes} {...listeners} className="pt-2 cursor-grab opacity-0 group-hover/sortable:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <BlockPreview block={block} selected={selected} onClick={onClick} />
      </div>
    </div>
  );
}

export function EmailBuilder({ initialBlocks, initialSubject, onSave, onCancel }: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [subject, setSubject] = useState(initialSubject || '');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'code'>('edit');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock = createBlock(type);
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlockContent = useCallback((content: Record<string, any>) => {
    if (!selectedBlockId) return;
    setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, content } : b));
  }, [selectedBlockId]);

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newBlock = { ...createBlock(block.type), content: { ...block.content } };
    const idx = blocks.findIndex(b => b.id === id);
    setBlocks(prev => [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)]);
    setSelectedBlockId(newBlock.id);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    setBlocks(prev => arrayMove(prev, idx, newIdx));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      setBlocks(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const html = blocksToHtml(blocks);

  const handleSave = () => {
    onSave({ blocks, html, subject });
  };

  return (
    <div className="h-[80vh] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-3 flex-1">
          <Label className="text-sm shrink-0">Subject:</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line..." className="max-w-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button variant={previewMode === 'edit' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('edit')} className="rounded-r-none text-xs">Edit</Button>
            <Button variant={previewMode === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('preview')} className="rounded-none text-xs"><Eye className="h-3 w-3 mr-1" />Preview</Button>
            <Button variant={previewMode === 'code' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('code')} className="rounded-l-none text-xs"><Code className="h-3 w-3 mr-1" />HTML</Button>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel}><X className="h-3 w-3 mr-1" />Cancel</Button>
          <Button size="sm" onClick={handleSave}><Save className="h-3 w-3 mr-1" />Save</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block palette */}
        <div className="w-48 border-r border-border bg-card/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Blocks</p>
          <div className="space-y-1.5">
            {BLOCK_PALETTE.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-left"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto bg-muted/50">
          {previewMode === 'edit' ? (
            <div className="max-w-[640px] mx-auto py-6 px-8">
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl py-20 text-center">
                  <Type className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Click blocks on the left to start building your email</p>
                </div>
              ) : (
                <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-0 pl-6 pr-2 py-2">
                        {blocks.map(block => (
                          <SortableBlock
                            key={block.id}
                            block={block}
                            selected={block.id === selectedBlockId}
                            onClick={() => setSelectedBlockId(block.id === selectedBlockId ? null : block.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          ) : previewMode === 'preview' ? (
            <div className="max-w-[640px] mx-auto py-6 px-4">
              <div className="bg-background rounded-lg shadow-sm border overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <pre className="text-xs bg-background p-4 rounded-lg border overflow-auto max-h-full font-mono whitespace-pre-wrap">{html}</pre>
            </div>
          )}
        </div>

        {/* Right: Block settings */}
        {previewMode === 'edit' && (
          <div className="w-72 border-l border-border bg-card">
            <ScrollArea className="h-full">
              {selectedBlock ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{selectedBlock.type} Settings</p>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(selectedBlock.id, -1)}><ArrowUp className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(selectedBlock.id, 1)}><ArrowDown className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => duplicateBlock(selectedBlock.id)}><Copy className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteBlock(selectedBlock.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <BlockEditor block={selectedBlock} onChange={updateBlockContent} />
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground py-12">
                  <p>Select a block to edit its settings</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
