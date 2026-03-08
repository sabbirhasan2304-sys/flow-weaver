import { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { GripVertical, X } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';

interface StickyNoteData extends Record<string, unknown> {
  label: string;
  type: string;
  category: string;
  content?: string;
  color?: string;
}

const STICKY_COLORS = [
  { name: 'Yellow', value: '#fef9c3', border: '#facc15' },
  { name: 'Green', value: '#dcfce7', border: '#4ade80' },
  { name: 'Blue', value: '#dbeafe', border: '#60a5fa' },
  { name: 'Pink', value: '#fce7f3', border: '#f472b6' },
  { name: 'Orange', value: '#ffedd5', border: '#fb923c' },
];

function StickyNoteComponent({ data, id, selected }: NodeProps) {
  const noteData = data as StickyNoteData;
  const { updateNode, deleteNode } = useWorkflowStore();
  const [isEditing, setIsEditing] = useState(false);
  const colorConfig = STICKY_COLORS.find(c => c.value === noteData.color) || STICKY_COLORS[0];

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode(id, { content: e.target.value });
  }, [id, updateNode]);

  const cycleColor = useCallback(() => {
    const currentIndex = STICKY_COLORS.findIndex(c => c.value === noteData.color);
    const nextIndex = (currentIndex + 1) % STICKY_COLORS.length;
    updateNode(id, { color: STICKY_COLORS[nextIndex].value });
  }, [id, noteData.color, updateNode]);

  return (
    <div
      className="rounded-md shadow-md transition-shadow"
      style={{
        backgroundColor: noteData.color || STICKY_COLORS[0].value,
        borderLeft: `4px solid ${colorConfig.border}`,
        minWidth: 150,
        minHeight: 80,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 opacity-0 hover:opacity-100 transition-opacity">
        <button onClick={cycleColor} className="text-[10px] font-medium text-gray-500 hover:text-gray-700">
          🎨
        </button>
        <button onClick={() => deleteNode(id)} className="text-gray-400 hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        <textarea
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder:text-gray-400"
          style={{ minHeight: 50 }}
          placeholder="Write a note..."
          value={(noteData.content as string) || ''}
          onChange={handleContentChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
        />
      </div>
    </div>
  );
}

export const StickyNote = memo(StickyNoteComponent);
