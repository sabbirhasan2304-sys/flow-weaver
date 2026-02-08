import { useState, useMemo, useCallback, memo } from 'react';
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
  OpenAIIcon, AnthropicIcon, GoogleIcon, SlackIcon, DiscordIcon,
  TelegramIcon, GitHubIcon, StripeIcon, AWSIcon, SupabaseIcon,
  PostgresIcon, MongoDBIcon, SendGridIcon, TwilioIcon, SMTPIcon,
  OAuth2Icon, HTTPIcon, APIKeyIcon, BearerIcon, ShopifyIcon,
  NotionIcon, AirtableIcon, TrelloIcon, JiraIcon, AsanaIcon,
  ClickUpIcon, LinearIcon, ZoomIcon, TeamsIcon, WhatsAppIcon,
  PayPalIcon, DropboxIcon, OneDriveIcon, HubSpotIcon, SalesforceIcon,
  GmailIcon, MailchimpIcon, WooCommerceIcon, GitLabIcon, RedisIcon,
  MySQLIcon, BkashIcon, NagadIcon, OutlookIcon, SquareIcon,
  VercelIcon, DockerIcon, KubernetesIcon, FirebaseIcon, CloudflareIcon,
  NetlifyIcon, FigmaIcon, IntercomIcon, ZendeskIcon, TypeformIcon,
  CalendlyIcon, HuggingFaceIcon, SnowflakeIcon, BigQueryIcon,
  ContentfulIcon, StrapiIcon, ZapierIcon, WebflowIcon, FramerIcon,
  MakeIcon, N8nIcon, MondayIcon, SegmentIcon, MixpanelIcon, AmplitudeIcon,
  // New AI logos
  ElevenLabsIcon, PerplexityIcon, MidjourneyIcon, RunwayIcon, LumaIcon, 
  PikaIcon, SoraIcon, DifyIcon, LangChainIcon, PineconeIcon, WeaviateIcon,
  QdrantIcon, ChromaIcon, MilvusIcon, SupabaseVectorIcon, AstraDBIcon,
  // New database logos  
  NeonIcon, PlanetScaleIcon, CockroachDBIcon, TimescaleDBIcon, ClickHouseIcon,
  DynamoDBIcon, CassandraIcon, Neo4jIcon,
  // Observability logos
  DatadogIcon, GrafanaIcon, PrometheusIcon, SentryIcon, LogRocketIcon,
  LaunchDarklyIcon, PostHogIcon, PlausibleIcon, UmamiIcon,
  // Email logos
  ResendIcon, PostmarkIcon, LoopsIcon, CustomerIOIcon, BrevoIcon,
  ConvertKitIcon, LemlistIcon,
  // Sales logos
  ApolloIcon, OutreachIcon, ClearbitIcon, ZoomInfoIcon, GongIcon,
  ChorusIcon, KlentyIcon,
  // Video logos
  LoomIcon, VimeoIcon, YouTubeIcon, SpotifyIcon, TikTokIcon,
  // Social logos
  XIcon, InstagramIcon, LinkedInIcon, FacebookIcon, PinterestIcon,
  RedditIcon, ThreadsIcon, MastodonIcon, BlueskyIcon,
  // Messaging logos
  TelegramCircleIcon, SignalIcon, MatrixIcon, RocketChatIcon, MattermostIcon,
  // Storage logos
  AWSS3Icon, GCSIcon, AzureBlobIcon, CloudinaryIcon, UploadthingIcon,
  ImgixIcon, BunnyCDNIcon,
  // Hosting logos
  RenderIcon, RailwayIcon, FlyIcon, DigitalOceanIcon, HerokuIcon, 
  LinodeIcon, VultrIcon,
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
  OpenAI: OpenAIIcon, Anthropic: AnthropicIcon, Google: GoogleIcon,
  Slack: SlackIcon, Discord: DiscordIcon, Telegram: TelegramIcon,
  GitHub: GitHubIcon, GitLab: GitLabIcon, Stripe: StripeIcon,
  AWS: AWSIcon, Supabase: SupabaseIcon, Postgres: PostgresIcon,
  PostgreSQL: PostgresIcon, MongoDB: MongoDBIcon, MySQL: MySQLIcon,
  Redis: RedisIcon, SendGrid: SendGridIcon, Twilio: TwilioIcon,
  SMTP: SMTPIcon, OAuth2: OAuth2Icon, HTTP: HTTPIcon,
  APIKey: APIKeyIcon, Bearer: BearerIcon, Shopify: ShopifyIcon,
  Notion: NotionIcon, Airtable: AirtableIcon, Trello: TrelloIcon,
  Jira: JiraIcon, Asana: AsanaIcon, ClickUp: ClickUpIcon,
  Linear: LinearIcon, Zoom: ZoomIcon, Teams: TeamsIcon,
  WhatsApp: WhatsAppIcon, PayPal: PayPalIcon, Dropbox: DropboxIcon,
  OneDrive: OneDriveIcon, HubSpot: HubSpotIcon, Salesforce: SalesforceIcon,
  Gmail: GmailIcon, Mailchimp: MailchimpIcon, WooCommerce: WooCommerceIcon,
  Bkash: BkashIcon, Nagad: NagadIcon, Outlook: OutlookIcon, Square: SquareIcon,
  // DevOps & Hosting
  Vercel: VercelIcon, Docker: DockerIcon, Kubernetes: KubernetesIcon,
  Firebase: FirebaseIcon, Cloudflare: CloudflareIcon, Netlify: NetlifyIcon,
  Figma: FigmaIcon, Intercom: IntercomIcon, Zendesk: ZendeskIcon,
  Typeform: TypeformIcon, Calendly: CalendlyIcon, HuggingFace: HuggingFaceIcon,
  Snowflake: SnowflakeIcon, BigQuery: BigQueryIcon, Contentful: ContentfulIcon,
  Strapi: StrapiIcon, Zapier: ZapierIcon, Webflow: WebflowIcon,
  Framer: FramerIcon, Make: MakeIcon, N8n: N8nIcon, Monday: MondayIcon,
  Segment: SegmentIcon, Mixpanel: MixpanelIcon, Amplitude: AmplitudeIcon,
  // AI Services
  ElevenLabs: ElevenLabsIcon, Perplexity: PerplexityIcon, Midjourney: MidjourneyIcon,
  Runway: RunwayIcon, Luma: LumaIcon, Pika: PikaIcon, Sora: SoraIcon,
  Dify: DifyIcon, LangChain: LangChainIcon,
  // Vector Databases
  Pinecone: PineconeIcon, Weaviate: WeaviateIcon, Qdrant: QdrantIcon,
  Chroma: ChromaIcon, Milvus: MilvusIcon, SupabaseVector: SupabaseVectorIcon,
  AstraDB: AstraDBIcon,
  // Databases
  Neon: NeonIcon, PlanetScale: PlanetScaleIcon, CockroachDB: CockroachDBIcon,
  TimescaleDB: TimescaleDBIcon, ClickHouse: ClickHouseIcon, DynamoDB: DynamoDBIcon,
  Cassandra: CassandraIcon, Neo4j: Neo4jIcon,
  // Observability
  Datadog: DatadogIcon, Grafana: GrafanaIcon, Prometheus: PrometheusIcon,
  Sentry: SentryIcon, LogRocket: LogRocketIcon, LaunchDarkly: LaunchDarklyIcon,
  PostHog: PostHogIcon, Plausible: PlausibleIcon, Umami: UmamiIcon,
  // Email
  Resend: ResendIcon, Postmark: PostmarkIcon, Loops: LoopsIcon,
  CustomerIO: CustomerIOIcon, Brevo: BrevoIcon, ConvertKit: ConvertKitIcon,
  Lemlist: LemlistIcon,
  // Sales
  Apollo: ApolloIcon, Outreach: OutreachIcon, Clearbit: ClearbitIcon,
  ZoomInfo: ZoomInfoIcon, Gong: GongIcon, Chorus: ChorusIcon, Klenty: KlentyIcon,
  // Video & Media
  Loom: LoomIcon, Vimeo: VimeoIcon, YouTube: YouTubeIcon, Spotify: SpotifyIcon,
  TikTok: TikTokIcon,
  // Social Media
  X: XIcon, Twitter: XIcon, Instagram: InstagramIcon, LinkedIn: LinkedInIcon,
  Facebook: FacebookIcon, Pinterest: PinterestIcon, Reddit: RedditIcon,
  Threads: ThreadsIcon, Mastodon: MastodonIcon, Bluesky: BlueskyIcon,
  // Messaging
  TelegramCircle: TelegramCircleIcon, Signal: SignalIcon, Matrix: MatrixIcon,
  RocketChat: RocketChatIcon, Mattermost: MattermostIcon,
  // Storage
  AWSS3: AWSS3Icon, GCS: GCSIcon, AzureBlob: AzureBlobIcon,
  Cloudinary: CloudinaryIcon, Uploadthing: UploadthingIcon, Imgix: ImgixIcon,
  BunnyCDN: BunnyCDNIcon,
  // Hosting
  Render: RenderIcon, Railway: RailwayIcon, Fly: FlyIcon,
  DigitalOcean: DigitalOceanIcon, Heroku: HerokuIcon, Linode: LinodeIcon,
  Vultr: VultrIcon,
};

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

// Memoized node item for performance
const NodeItem = memo(({ node, onDragStart }: { 
  node: typeof nodeDefinitions[0]; 
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}) => {
  const IconComponent = iconMap[node.icon] || Puzzle;
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.type)}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md cursor-grab',
        'hover:bg-muted/50 transition-colors',
        'active:cursor-grabbing group'
      )}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
});
NodeItem.displayName = 'NodeItem';

function NodePaletteComponent({ onDragStart }: NodePaletteProps) {
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
  
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);
  
  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50 backdrop-blur-sm">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
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
                    'h-4 w-4 transition-transform duration-200',
                    expandedCategories.has(category) && 'rotate-90'
                  )} 
                />
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category] || '#6366f1' }}
                />
                <span className="text-sm font-medium">{category}</span>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {nodes.length}
                </span>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="ml-4 space-y-0.5 pb-2">
                  {nodes.map((node) => (
                    <NodeItem key={node.type} node={node} onDragStart={onDragStart} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
      
      {/* Footer with node count */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
          {nodeDefinitions.length} nodes available
        </div>
      </div>
    </div>
  );
}

export const NodePalette = memo(NodePaletteComponent);
