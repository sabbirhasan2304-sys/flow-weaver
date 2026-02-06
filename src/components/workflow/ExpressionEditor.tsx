import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpressionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  availableNodes?: Array<{ id: string; label: string; data?: unknown }>;
}

const EXPRESSION_SUGGESTIONS = [
  { label: '$json', description: 'Current node input data', insert: '{{ $json[""] }}' },
  { label: '$json["field"]', description: 'Access specific field', insert: '{{ $json["fieldName"] }}' },
  { label: '$node["name"].data', description: 'Data from specific node', insert: '{{ $node[""].data }}' },
  { label: '$env', description: 'Environment variable', insert: '{{ $env.VAR_NAME }}' },
  { label: '$now', description: 'Current timestamp', insert: '{{ $now }}' },
  { label: '$today', description: 'Today\'s date', insert: '{{ $today }}' },
  { label: '$runIndex', description: 'Current loop index', insert: '{{ $runIndex }}' },
  { label: '$itemIndex', description: 'Current item index', insert: '{{ $itemIndex }}' },
  { label: '$eval()', description: 'Evaluate JS expression', insert: '{{ $eval("") }}' },
];

const JS_HELPERS = [
  { label: '.length', description: 'Array/string length', insert: '.length' },
  { label: '.toUpperCase()', description: 'Uppercase string', insert: '.toUpperCase()' },
  { label: '.toLowerCase()', description: 'Lowercase string', insert: '.toLowerCase()' },
  { label: '.trim()', description: 'Trim whitespace', insert: '.trim()' },
  { label: '.split(",")', description: 'Split string', insert: '.split(",")' },
  { label: '.join(",")', description: 'Join array', insert: '.join(",")' },
  { label: '.filter()', description: 'Filter array', insert: '.filter(item => item)' },
  { label: '.map()', description: 'Transform array', insert: '.map(item => item)' },
  { label: 'JSON.stringify()', description: 'Object to JSON', insert: 'JSON.stringify($json)' },
  { label: 'JSON.parse()', description: 'Parse JSON string', insert: 'JSON.parse($json.data)' },
];

export function ExpressionEditor({
  value,
  onChange,
  placeholder = 'Enter value or expression...',
  availableNodes = [],
}: ExpressionEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertExpression = (insert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + insert + value.slice(end);
    onChange(newValue);

    // Move cursor inside the expression
    setTimeout(() => {
      const cursorPos = insert.includes('""') 
        ? start + insert.indexOf('""') + 1
        : start + insert.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
      textarea.focus();
    }, 0);
  };

  const hasExpression = value.includes('{{');

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
        placeholder={placeholder}
        className={cn(
          'font-mono text-sm min-h-[80px] pr-10',
          hasExpression && 'border-primary'
        )}
      />
      
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
          >
            <Wand2 className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                EXPRESSIONS
              </h4>
              {EXPRESSION_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => {
                    insertExpression(suggestion.insert);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <code className="text-xs text-primary">{suggestion.label}</code>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </button>
              ))}

              {availableNodes.length > 0 && (
                <>
                  <h4 className="text-xs font-semibold text-muted-foreground mt-3 mb-2 px-2">
                    AVAILABLE NODES
                  </h4>
                  {availableNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        insertExpression(`{{ $node["${node.label}"].data }}`);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <code className="text-xs text-primary">{node.label}</code>
                      <p className="text-xs text-muted-foreground">Reference this node's output</p>
                    </button>
                  ))}
                </>
              )}

              <h4 className="text-xs font-semibold text-muted-foreground mt-3 mb-2 px-2">
                JS HELPERS
              </h4>
              {JS_HELPERS.map((helper) => (
                <button
                  key={helper.label}
                  onClick={() => {
                    insertExpression(helper.insert);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <code className="text-xs text-primary">{helper.label}</code>
                  <p className="text-xs text-muted-foreground">{helper.description}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {hasExpression && (
        <div className="absolute left-2 bottom-2">
          <Code className="h-3 w-3 text-primary" />
        </div>
      )}
    </div>
  );
}
