import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Plugin name → node types it unlocks
// Nodes not listed here are "core" and always available
const PLUGIN_NODE_MAP: Record<string, string[]> = {
  // AI plugins
  'openai-advanced': ['openai', 'openaiAssistant', 'dall-e', 'whisper'],
  'anthropic-claude': ['claude', 'claudeAnalysis'],
  'google-gemini': ['gemini', 'geminiVision'],
  'huggingface': ['huggingFace', 'huggingFaceInference'],
  'elevenlabs': ['elevenLabs', 'elevenLabsVoice'],

  // Analytics plugins
  'amplitude': ['amplitude'],
  'google-analytics': ['googleAnalytics'],
  'mixpanel': ['mixpanel'],
  'posthog': ['posthog'],

  // Blockchain plugins
  'ethereum': ['ethereum', 'moralis', 'coinbase', 'uniswap', 'nftMarketplace', 'theGraph', 'chainlink', 'aave', 'ipfs'],
  'solana': ['solana'],
  'polygon': ['polygon'],

  // Cloud plugins
  'aws-suite': ['awsS3', 'awsLambda', 'awsSns', 'awsSqs', 'awsDynamoDB', 'awsIot'],
  'azure-suite': ['azureBlob', 'azureFunction', 'azureServiceBus', 'azureCognitive', 'azureDevOps'],
  'cloudflare': ['cloudflareWorker', 'cloudflareDNS', 'cloudflareKV'],
  'gcp-suite': ['googleDrive', 'googleSheets', 'googleCalendar', 'googleCalendarTrigger', 'googleDriveTrigger', 'googleIot', 'bigquery', 'gcsStorage'],

  // Communication plugins
  'slack-pro': ['slack', 'slackTrigger'],
  'discord': ['discord', 'discordTrigger'],
  'telegram': ['telegram', 'telegramTrigger'],
  'twilio': ['twilio', 'whatsapp', 'whatsappTrigger'],

  // Database plugins
  'postgresql': ['postgres', 'supabase', 'supabaseTrigger', 'supabaseStorage', 'mysql'],
  'mongodb': ['mongodb'],
  'pinecone': ['pinecone', 'weaviate', 'qdrant', 'chromadb', 'milvus'],
  'redis': ['redis'],
  'supabase-extended': ['supabase', 'supabaseTrigger', 'supabaseStorage', 'supabaseVector'],

  // Development plugins
  'github-actions': ['github', 'githubTrigger', 'cicd'],
  'gitlab-ci': ['gitlab', 'gitlabTrigger'],
  'docker': ['docker', 'executeCommand', 'ssh'],
  'kubernetes': ['kubernetes', 'terraform', 'ansible'],

  // E-Commerce plugins
  'shopify': ['shopify', 'shopifyTrigger'],
  'stripe-advanced': ['stripe', 'stripeTrigger'],
  'woocommerce': ['woocommerce', 'woocommerceTrigger'],

  // Email plugins
  'sendgrid': ['sendGrid', 'gmailTrigger', 'gmail'],
  'mailchimp': ['mailchimp'],
  'resend': ['resend', 'smtp', 'imapTrigger', 'outlookTrigger'],

  // IoT plugins
  'mqtt': ['mqtt', 'homeAssistant', 'sse', 'deviceShadow', 'sensorAggregator', 'edgeCompute'],
  'aws-iot': ['awsIot', 'googleIot'],

  // Payments plugins
  'bkash': ['bkashPayment', 'bkashVerify', 'bkashRefund', 'bkashQuery'],
  'nagad': ['nagadPayment', 'nagadVerify'],
  'sslcommerz': ['sslcommerzPayment', 'sslcommerzValidation', 'sslcommerzRefund', 'sslcommerzQuery'],

  // Productivity plugins
  'notion': ['notion', 'notionTrigger'],
  'airtable': ['airtable', 'airtableTrigger'],
  'asana': ['asana'],
  'google-sheets': ['googleSheets', 'googleCalendar', 'googleCalendarTrigger'],

  // Real-time plugins
  'websocket': ['websocket', 'sse', 'kafka'],
  'kafka': ['kafka'],

  // Security plugins
  'auth0': ['oauth2', 'jwtValidator', 'saml'],
  'okta': ['oauth2', 'saml'],
  'security-toolkit': ['encryption', 'passwordHash', 'rateLimiter', 'ipFilter', 'sanitize', 'cors', 'csrfProtection', 'apiKeyAuth', 'hmacValidator', 'certPinning'],
};

// Build reverse map: node type → plugin names that unlock it
function buildNodeToPluginMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  Object.entries(PLUGIN_NODE_MAP).forEach(([pluginName, nodeTypes]) => {
    nodeTypes.forEach(nodeType => {
      if (!map[nodeType]) map[nodeType] = [];
      if (!map[nodeType].includes(pluginName)) {
        map[nodeType].push(pluginName);
      }
    });
  });
  return map;
}

const NODE_TO_PLUGIN_MAP = buildNodeToPluginMap();

// All node types that require a plugin
const ALL_PLUGIN_NODE_TYPES = new Set(Object.keys(NODE_TO_PLUGIN_MAP));

export function useInstalledPlugins() {
  const { user } = useAuth();
  const [installedPluginNames, setInstalledPluginNames] = useState<Set<string>>(new Set());
  const [allowedNodeTypes, setAllowedNodeTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInstalledPluginNames(new Set());
      setAllowedNodeTypes(new Set());
      setLoading(false);
      return;
    }

    const fetchInstalled = async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      const { data: installs } = await supabase
        .from('user_plugin_installs')
        .select('plugin_id')
        .eq('profile_id', profileData.id);

      if (!installs || installs.length === 0) {
        setInstalledPluginNames(new Set());
        setAllowedNodeTypes(new Set());
        setLoading(false);
        return;
      }

      const pluginIds = installs.map(i => i.plugin_id);

      const { data: plugins } = await supabase
        .from('node_plugins')
        .select('name')
        .in('id', pluginIds);

      const names = new Set((plugins || []).map(p => p.name));
      setInstalledPluginNames(names);

      // Build allowed node types from installed plugins
      const allowed = new Set<string>();
      names.forEach(pluginName => {
        const nodeTypes = PLUGIN_NODE_MAP[pluginName];
        if (nodeTypes) {
          nodeTypes.forEach(t => allowed.add(t));
        }
      });
      setAllowedNodeTypes(allowed);
      setLoading(false);
    };

    fetchInstalled();
  }, [user]);

  const isNodeAllowed = useCallback((nodeType: string): boolean => {
    // If the node type is NOT in the plugin map, it's a core node → always allowed
    if (!ALL_PLUGIN_NODE_TYPES.has(nodeType)) return true;
    // Otherwise, check if it's unlocked by an installed plugin
    return allowedNodeTypes.has(nodeType);
  }, [allowedNodeTypes]);

  const getRequiredPlugin = useCallback((nodeType: string): string | null => {
    return NODE_TO_PLUGIN_MAP[nodeType]?.[0] || null;
  }, []);

  return {
    installedPluginNames,
    isNodeAllowed,
    getRequiredPlugin,
    requiresPlugin: (nodeType: string) => ALL_PLUGIN_NODE_TYPES.has(nodeType),
    loading,
  };
}
