export interface TrackingNodeDef {
  type: string;
  label: string;
  category: 'source' | 'transform' | 'destination';
  icon: string;
  description: string;
  color: string;
  configFields: { key: string; label: string; type: 'text' | 'select' | 'toggle'; options?: string[] }[];
}

export const trackingNodeDefinitions: TrackingNodeDef[] = [
  // Sources
  { type: 'web_pixel', label: 'Web Pixel', category: 'source', icon: '🌐', description: 'Capture browser events via JavaScript pixel', color: 'hsl(var(--primary))', configFields: [{ key: 'domain', label: 'Domain', type: 'text' }, { key: 'events', label: 'Events', type: 'text' }] },
  { type: 'shopify', label: 'Shopify', category: 'source', icon: '🛒', description: 'Shopify storefront & checkout events', color: '#96bf48', configFields: [{ key: 'store_url', label: 'Store URL', type: 'text' }, { key: 'access_token', label: 'Access Token', type: 'text' }] },
  { type: 'woocommerce', label: 'WooCommerce', category: 'source', icon: '🏪', description: 'WooCommerce order & product events', color: '#7f54b3', configFields: [{ key: 'site_url', label: 'Site URL', type: 'text' }, { key: 'consumer_key', label: 'Consumer Key', type: 'text' }] },
  { type: 'custom_api', label: 'Custom API', category: 'source', icon: '🔌', description: 'Receive events via custom REST endpoint', color: '#6366f1', configFields: [{ key: 'endpoint_path', label: 'Endpoint Path', type: 'text' }] },
  { type: 'mobile_sdk', label: 'Mobile SDK', category: 'source', icon: '📱', description: 'iOS & Android SDK events', color: '#06b6d4', configFields: [{ key: 'platform', label: 'Platform', type: 'select', options: ['iOS', 'Android', 'Both'] }] },

  // Transforms
  { type: 'pii_anonymizer', label: 'PII Anonymizer', category: 'transform', icon: '🔒', description: 'Hash or remove personally identifiable information', color: '#ef4444', configFields: [{ key: 'fields', label: 'Fields to Anonymize', type: 'text' }, { key: 'method', label: 'Method', type: 'select', options: ['SHA256', 'Remove', 'Mask'] }] },
  { type: 'geo_enrichment', label: 'Geo Enrichment', category: 'transform', icon: '🌍', description: 'Add country, city, region from IP address', color: '#22c55e', configFields: [{ key: 'precision', label: 'Precision', type: 'select', options: ['Country', 'City', 'Zip'] }] },
  { type: 'bot_filter', label: 'Bot Filter', category: 'transform', icon: '🤖', description: 'Detect and filter bot/crawler traffic', color: '#f59e0b', configFields: [{ key: 'action', label: 'Bot Action', type: 'select', options: ['Block', 'Tag', 'Allow SEO Bots'] }, { key: 'threshold', label: 'Score Threshold', type: 'text' }] },
  { type: 'deduplicator', label: 'Deduplicator', category: 'transform', icon: '🔄', description: 'Remove duplicate events within time window', color: '#8b5cf6', configFields: [{ key: 'window_minutes', label: 'Window (minutes)', type: 'text' }, { key: 'key_fields', label: 'Dedup Key Fields', type: 'text' }] },
  { type: 'cookie_recovery', label: 'Cookie Recovery', category: 'transform', icon: '🍪', description: 'Extend cookie lifetime and recover lost IDs', color: '#d97706', configFields: [{ key: 'cookie_name', label: 'Cookie Name', type: 'text' }, { key: 'ttl_days', label: 'TTL (days)', type: 'text' }] },
  { type: 'consent_filter', label: 'Consent Filter', category: 'transform', icon: '✅', description: 'Filter events based on user consent status', color: '#14b8a6', configFields: [{ key: 'mode', label: 'Consent Mode', type: 'select', options: ['GDPR', 'CCPA', 'Custom'] }] },

  // Destinations
  { type: 'meta_capi', label: 'Meta CAPI', category: 'destination', icon: '📘', description: 'Facebook/Instagram Conversions API', color: '#1877f2', configFields: [{ key: 'pixel_id', label: 'Pixel ID', type: 'text' }, { key: 'access_token', label: 'Access Token', type: 'text' }] },
  { type: 'google_ads', label: 'Google Ads', category: 'destination', icon: '📊', description: 'Google Ads conversion tracking', color: '#4285f4', configFields: [{ key: 'conversion_id', label: 'Conversion ID', type: 'text' }, { key: 'conversion_label', label: 'Conversion Label', type: 'text' }] },
  { type: 'ga4', label: 'GA4', category: 'destination', icon: '📈', description: 'Google Analytics 4 Measurement Protocol', color: '#e37400', configFields: [{ key: 'measurement_id', label: 'Measurement ID', type: 'text' }, { key: 'api_secret', label: 'API Secret', type: 'text' }] },
  { type: 'tiktok', label: 'TikTok Events', category: 'destination', icon: '🎵', description: 'TikTok Events API for ad optimization', color: '#000000', configFields: [{ key: 'pixel_code', label: 'Pixel Code', type: 'text' }, { key: 'access_token', label: 'Access Token', type: 'text' }] },
  { type: 'snapchat', label: 'Snapchat CAPI', category: 'destination', icon: '👻', description: 'Snapchat Conversions API', color: '#fffc00', configFields: [{ key: 'pixel_id', label: 'Pixel ID', type: 'text' }, { key: 'token', label: 'API Token', type: 'text' }] },
  { type: 'custom_webhook', label: 'Custom Webhook', category: 'destination', icon: '🔗', description: 'Send events to any HTTP endpoint', color: '#6b7280', configFields: [{ key: 'url', label: 'Webhook URL', type: 'text' }, { key: 'method', label: 'Method', type: 'select', options: ['POST', 'PUT'] }] },
];

export const getNodesByCategory = (category: 'source' | 'transform' | 'destination') =>
  trackingNodeDefinitions.filter(n => n.category === category);
