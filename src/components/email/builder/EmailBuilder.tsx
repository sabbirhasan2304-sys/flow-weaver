import { useState, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EmailBlock, createBlock, blocksToHtml } from './emailBlockTypes';
import { BlockPreview } from './BlockPreview';
import { BlockEditor } from './BlockEditor';
import { STARTER_TEMPLATES } from './starterTemplates';
import { AIContentGenerator } from './AIContentGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heading1, Type, ImageIcon, MousePointerClick, FileText, Minus,
  MoveVertical, Trash2, Copy, ArrowUp, ArrowDown, Eye, Code,
  GripVertical, X, Save, Columns, Share2, PlayCircle,
  Monitor, Tablet, Smartphone, Palette, Undo2, Redo2,
  Timer, ShoppingBag, Code as CodeIcon,
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
  { type: 'product' as const, label: 'Product', icon: ShoppingBag, description: 'Product card' },
  { type: 'countdown' as const, label: 'Countdown', icon: Timer, description: 'Countdown timer' },
  { type: 'social' as const, label: 'Social', icon: Share2, description: 'Social links' },
  { type: 'video' as const, label: 'Video', icon: PlayCircle, description: 'Video embed' },
  { type: 'html' as const, label: 'HTML', icon: CodeIcon, description: 'Custom HTML' },
  { type: 'divider' as const, label: 'Divider', icon: Minus, description: 'Horizontal line' },
  { type: 'spacer' as const, label: 'Spacer', icon: MoveVertical, description: 'Vertical space' },
  { type: 'footer' as const, label: 'Footer', icon: FileText, description: 'Footer content' },
];

const PREVIEW_SIZES = {
  desktop: { width: 640, label: 'Desktop', icon: Monitor },
  tablet: { width: 480, label: 'Tablet', icon: Tablet },
  mobile: { width: 320, label: 'Mobile', icon: Smartphone },
} as const;

const FONT_FAMILIES = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: "Tahoma, sans-serif", label: 'Tahoma' },
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
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showTemplates, setShowTemplates] = useState(!initialBlocks || initialBlocks.length === 0);
  const [palletteTab, setPaletteTab] = useState<'blocks' | 'style'>('blocks');

  // Global styles
  const [bodyBg, setBodyBg] = useState('#f4f4f5');
  const [contentBg, setContentBg] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Arial, Helvetica, sans-serif');

  // Undo/redo
  const [history, setHistory] = useState<EmailBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = (newBlocks: EmailBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBlocks)));
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setBlocks(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setBlocks(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const setBlocksWithHistory = (updater: (prev: EmailBlock[]) => EmailBlock[]) => {
    setBlocks(prev => {
      const next = updater(prev);
      pushHistory(next);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock = createBlock(type);
    setBlocksWithHistory(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlockContent = useCallback((content: Record<string, any>) => {
    if (!selectedBlockId) return;
    setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, content } : b));
  }, [selectedBlockId]);

  const deleteBlock = (id: string) => {
    setBlocksWithHistory(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newBlock = { ...createBlock(block.type), content: { ...block.content } };
    const idx = blocks.findIndex(b => b.id === id);
    setBlocksWithHistory(prev => [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)]);
    setSelectedBlockId(newBlock.id);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    setBlocksWithHistory(prev => arrayMove(prev, idx, newIdx));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      setBlocksWithHistory(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const loadTemplate = (templateBlocks: EmailBlock[], templateSubject: string) => {
    const cloned = templateBlocks.map(b => ({ ...createBlock(b.type), content: { ...b.content } }));
    setBlocks(cloned);
    pushHistory(cloned);
    setSubject(templateSubject);
    setShowTemplates(false);
  };

  const html = useMemo(() => blocksToHtml(blocks, bodyBg, contentBg, fontFamily), [blocks, bodyBg, contentBg, fontFamily]);

  const handleSave = () => {
    onSave({ blocks, html, subject });
  };

  const previewSize = PREVIEW_SIZES[previewDevice];

  // Starter template selector
  if (showTemplates && blocks.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Choose a Template</h2>
            <p className="text-sm text-muted-foreground">Start with a pre-built template or from scratch</p>
          </div>
          <Button variant="outline" onClick={onCancel}><X className="h-3 w-3 mr-1" />Cancel</Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Blank template */}
            <button
              onClick={() => setShowTemplates(false)}
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-accent/50 transition-all"
            >
              <div className="h-24 flex items-center justify-center mb-3">
                <Type className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-foreground">Blank Email</p>
              <p className="text-xs text-muted-foreground mt-1">Start from scratch</p>
            </button>

            {STARTER_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => loadTemplate(template.blocks, template.subject)}
                className="border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:bg-accent/50 transition-all group"
              >
                <div className="h-24 bg-muted/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <div className="text-xs text-muted-foreground/60 px-3 text-center">
                    {template.previewText}
                  </div>
                </div>
                <p className="font-medium text-foreground">{template.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-2 ${template.categoryColor}`}>
                  {template.category}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-[80vh] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-3 flex-1">
          <Label className="text-sm shrink-0">Subject:</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line..." className="max-w-md" />
        </div>
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex border rounded-md mr-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={undo} disabled={historyIndex <= 0} title="Undo">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* View modes */}
          <div className="flex border rounded-md">
            <Button variant={previewMode === 'edit' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('edit')} className="rounded-r-none text-xs">Edit</Button>
            <Button variant={previewMode === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('preview')} className="rounded-none text-xs"><Eye className="h-3 w-3 mr-1" />Preview</Button>
            <Button variant={previewMode === 'code' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPreviewMode('code')} className="rounded-l-none text-xs"><Code className="h-3 w-3 mr-1" />HTML</Button>
          </div>

          {/* Device preview (in preview mode) */}
          {previewMode === 'preview' && (
            <div className="flex border rounded-md ml-1">
              {(Object.entries(PREVIEW_SIZES) as [keyof typeof PREVIEW_SIZES, typeof PREVIEW_SIZES[keyof typeof PREVIEW_SIZES]][]).map(([key, { icon: Icon, label }]) => (
                <Button
                  key={key}
                  variant={previewDevice === key ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPreviewDevice(key)}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={onCancel}><X className="h-3 w-3 mr-1" />Cancel</Button>
          <Button size="sm" onClick={handleSave}><Save className="h-3 w-3 mr-1" />Save</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block palette / Style */}
        <div className="w-52 border-r border-border bg-card/50 flex flex-col">
          <div className="flex border-b border-border">
            <button
              onClick={() => setPaletteTab('blocks')}
              className={`flex-1 text-xs font-medium py-2.5 transition-colors ${palletteTab === 'blocks' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Blocks
            </button>
            <button
              onClick={() => setPaletteTab('style')}
              className={`flex-1 text-xs font-medium py-2.5 transition-colors flex items-center justify-center gap-1 ${palletteTab === 'style' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Palette className="h-3 w-3" />Style
            </button>
          </div>

          <ScrollArea className="flex-1">
            {palletteTab === 'blocks' ? (
              <div className="p-3 space-y-1.5">
                {BLOCK_PALETTE.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addBlock(item.type)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{item.label}</span>
                        <p className="text-[10px] text-muted-foreground leading-tight">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 space-y-4">
                <div>
                  <Label className="text-xs">Body Background</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" value={bodyBg} onChange={e => setBodyBg(e.target.value)} className="h-8 w-12 p-1 cursor-pointer" />
                    <Input value={bodyBg} onChange={e => setBodyBg(e.target.value)} className="h-8 text-xs font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Content Background</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" value={contentBg} onChange={e => setContentBg(e.target.value)} className="h-8 w-12 p-1 cursor-pointer" />
                    <Input value={contentBg} onChange={e => setContentBg(e.target.value)} className="h-8 text-xs font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map(f => (
                        <SelectItem key={f.value} value={f.value} className="text-xs" style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto bg-muted/50">
          {previewMode === 'edit' ? (
            <div className="max-w-[640px] mx-auto py-6 px-8">
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl py-20 text-center">
                  <Type className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Click blocks on the left to start building your email</p>
                  <Button variant="link" className="mt-2 text-xs" onClick={() => setShowTemplates(true)}>
                    Or choose a starter template
                  </Button>
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
            <div className="py-6 px-4 flex justify-center">
              <div
                className="bg-background rounded-lg shadow-lg border overflow-hidden transition-all duration-300"
                style={{ width: `${previewSize.width}px`, maxWidth: '100%' }}
              >
                <div className="bg-muted/50 border-b px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium">{previewSize.label} Preview — {previewSize.width}px</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <pre className="text-xs bg-background p-4 rounded-lg border overflow-auto max-h-full font-mono whitespace-pre-wrap">{html}</pre>
            </div>
          )}
        </div>

        {/* Right: Block settings + AI */}
        {previewMode === 'edit' && (
          <div className="w-80 border-l border-border bg-card">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* AI Content Generator */}
                <AIContentGenerator
                  currentSubject={subject}
                  currentBodyText={blocks.filter(b => b.type === 'text').map(b => b.content.text).join('\n\n')}
                  onInsertSubject={(s) => setSubject(s)}
                  onInsertBodyText={(text) => {
                    const newBlock = createBlock('text');
                    newBlock.content.text = text;
                    setBlocksWithHistory(prev => [...prev, newBlock]);
                    setSelectedBlockId(newBlock.id);
                  }}
                  onInsertCTA={(text) => {
                    const newBlock = createBlock('button');
                    newBlock.content.text = text;
                    setBlocksWithHistory(prev => [...prev, newBlock]);
                    setSelectedBlockId(newBlock.id);
                  }}
                  onGenerateFullEmail={(aiBlocks, aiSubject) => {
                    const newBlocks = aiBlocks.map(b => {
                      const blockType = b.type as EmailBlock['type'];
                      const block = createBlock(blockType);
                      block.content = { ...block.content, ...b.content };
                      return block;
                    });
                    setBlocks(newBlocks);
                    pushHistory(newBlocks);
                    setSubject(aiSubject);
                    setSelectedBlockId(null);
                  }}
                />

                {/* Block editor */}
                {selectedBlock ? (
                  <>
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
                  </>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-6">
                    <p>Select a block to edit its settings</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
