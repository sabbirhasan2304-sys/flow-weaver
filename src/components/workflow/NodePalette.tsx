import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { nodeDefinitions, getNodesByCategory } from '@/data/nodeDefinitions';
import { CATEGORY_COLORS } from '@/types/nodes';
import { Search, ChevronRight, GripVertical } from 'lucide-react';
import { 
  Webhook, Clock, Play, Mail, MessageSquare, Send, 
  FileSpreadsheet, Database, Code, GitBranch, Repeat, 
  Filter, Merge, Split, Bot, Brain, Sparkles, 
  Globe, FileJson, Zap, Bell, Upload, Download,
  Cloud, Server, Lock, Shield, Coins, BarChart,
  Image, Video, Mic, Settings, Puzzle, Wallet, Rocket,
  CreditCard, CheckCircle, RotateCcw, User, ShoppingCart,
  Calendar, FileText, Cpu, Radio, Box, HardDrive,
  Activity, Key, Link, Hash, AlertTriangle, Terminal,
  Layers, RefreshCw, Timer, Eye, MousePointer, FormInput,
  LayoutGrid, Table, ArrowRightLeft, Variable, Calculator,
  FileCode, Braces, Type, List, Shuffle, GitMerge,
  Workflow, Package, Truck, Receipt, DollarSign, Building,
  Smartphone, Wifi, Thermometer, Gauge, Power, Lightbulb,
  Camera, Music, Film, Volume2, Headphones, Monitor,
  Share2, MessageCircle, AtSign, Hash as HashIcon, Users,
  Folder, FolderOpen, Archive, CloudUpload, CloudDownload,
  Fingerprint, KeyRound, ShieldCheck, UserCheck, Scan
} from 'lucide-react';
import {
  OpenAIIcon,
  AnthropicIcon,
  GoogleIcon,
  SlackIcon,
  DiscordIcon,
  TelegramIcon,
  GitHubIcon,
  StripeIcon,
  AWSIcon,
  SupabaseIcon,
  PostgresIcon,
  MongoDBIcon,
  SendGridIcon,
  TwilioIcon,
  SMTPIcon,
  OAuth2Icon,
  HTTPIcon,
  APIKeyIcon,
  BearerIcon,
} from '@/components/icons/ServiceIcons';

// Extended icon map with service logos and lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  // Lucide icons
  Webhook, Clock, Play, Mail, MessageSquare, Send,
  FileSpreadsheet, Database, Code, GitBranch, Repeat,
  Filter, Merge, Split, Bot, Brain, Sparkles,
  Globe, FileJson, Zap, Bell, Upload, Download,
  Cloud, Server, Lock, Shield, Coins, BarChart,
  Image, Video, Mic, Settings, Puzzle, Wallet, Rocket,
  CreditCard, CheckCircle, RotateCcw, User, ShoppingCart,
  Calendar, FileText, Cpu, Radio, Box, HardDrive,
  Activity, Key, Link, Hash, AlertTriangle, Terminal,
  Layers, RefreshCw, Timer, Eye, MousePointer, FormInput,
  LayoutGrid, Table, ArrowRightLeft, Variable, Calculator,
  FileCode, Braces, Type, List, Shuffle, GitMerge,
  Workflow, Package, Truck, Receipt, DollarSign, Building,
  Smartphone, Wifi, Thermometer, Gauge, Power, Lightbulb,
  Camera, Music, Film, Volume2, Headphones, Monitor,
  Share2, MessageCircle, AtSign, Users, Folder, FolderOpen,
  Archive, CloudUpload, CloudDownload, Fingerprint, KeyRound,
  ShieldCheck, UserCheck, Scan,
  
  // Service-specific icons
  OpenAI: OpenAIIcon,
  Anthropic: AnthropicIcon,
  Google: GoogleIcon,
  Slack: SlackIcon,
  Discord: DiscordIcon,
  Telegram: TelegramIcon,
  GitHub: GitHubIcon,
  Stripe: StripeIcon,
  AWS: AWSIcon,
  Supabase: SupabaseIcon,
  Postgres: PostgresIcon,
  PostgreSQL: PostgresIcon,
  MongoDB: MongoDBIcon,
  SendGrid: SendGridIcon,
  Twilio: TwilioIcon,
  SMTP: SMTPIcon,
  OAuth2: OAuth2Icon,
  HTTP: HTTPIcon,
  APIKey: APIKeyIcon,
  Bearer: BearerIcon,
};

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Triggers', 'Actions'])
  );
  
  const categorizedNodes = useMemo(() => getNodesByCategory(), []);
  
  const filteredNodes = useMemo(() => {
    if (!search) return categorizedNodes;
    
    const filtered: Record<string, typeof nodeDefinitions> = {};
    const searchLower = search.toLowerCase();
    
    Object.entries(categorizedNodes).forEach(([category, nodes]) => {
      const matchingNodes = nodes.filter(
        node => 
          node.displayName.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          node.type.toLowerCase().includes(searchLower)
      );
      
      if (matchingNodes.length > 0) {
        filtered[category] = matchingNodes;
      }
    });
    
    return filtered;
  }, [categorizedNodes, search]);
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };
  
  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Node list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(filteredNodes).map(([category, nodes]) => (
            <Collapsible
              key={category}
              open={expandedCategories.has(category) || !!search}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                <ChevronRight 
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedCategories.has(category) && 'rotate-90'
                  )} 
                />
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category] || '#6366f1' }}
                />
                <span className="text-sm font-medium">{category}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {nodes.length}
                </span>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="ml-4 space-y-1 pb-2">
                  {nodes.map((node) => {
                    const IconComponent = iconMap[node.icon] || Puzzle;
                    
                    return (
                      <div
                        key={node.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md cursor-grab',
                          'hover:bg-muted/50 transition-colors',
                          'active:cursor-grabbing'
                        )}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0"
                          style={{ backgroundColor: `${node.color}20` }}
                        >
                          <IconComponent 
                            className="h-3.5 w-3.5" 
                            style={{ color: node.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {node.displayName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {node.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
      
      {/* Footer with node count */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {nodeDefinitions.length} nodes available
        </div>
      </div>
    </div>
  );
}
