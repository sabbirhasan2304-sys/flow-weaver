export interface NodeDefinition {
  type: string;
  displayName: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  configSchema: ConfigField[];
}

export interface PortDefinition {
  name: string;
  type: 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'json' | 'code' | 'credential';
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  description?: string;
}

// Node Categories
export const NODE_CATEGORIES = {
  TRIGGERS: 'Triggers',
  ACTIONS: 'Actions',
  DATA: 'Data Manipulation',
  LOGIC: 'Logic & Flow',
  AI: 'AI & Machine Learning',
  COMMUNICATION: 'Communication',
  PRODUCTIVITY: 'Productivity',
  STORAGE: 'Storage',
  DATABASES: 'Databases',
  DEVELOPMENT: 'Development',
  ECOMMERCE: 'E-Commerce',
  ANALYTICS: 'Analytics',
  BLOCKCHAIN: 'Blockchain',
  IOT: 'IoT & Real-Time',
  MEDIA: 'Media Processing',
  SECURITY: 'Security',
  PAYMENTS: 'Payments',
  CUSTOM: 'Custom Nodes',
} as const;

export type NodeCategory = typeof NODE_CATEGORIES[keyof typeof NODE_CATEGORIES];

// Color palette for categories
export const CATEGORY_COLORS: Record<string, string> = {
  [NODE_CATEGORIES.TRIGGERS]: '#10b981',
  [NODE_CATEGORIES.ACTIONS]: '#3b82f6',
  [NODE_CATEGORIES.DATA]: '#8b5cf6',
  [NODE_CATEGORIES.LOGIC]: '#f59e0b',
  [NODE_CATEGORIES.AI]: '#ec4899',
  [NODE_CATEGORIES.COMMUNICATION]: '#06b6d4',
  [NODE_CATEGORIES.PRODUCTIVITY]: '#84cc16',
  [NODE_CATEGORIES.STORAGE]: '#6366f1',
  [NODE_CATEGORIES.DATABASES]: '#14b8a6',
  [NODE_CATEGORIES.DEVELOPMENT]: '#a855f7',
  [NODE_CATEGORIES.ECOMMERCE]: '#f97316',
  [NODE_CATEGORIES.ANALYTICS]: '#22d3ee',
  [NODE_CATEGORIES.BLOCKCHAIN]: '#fbbf24',
  [NODE_CATEGORIES.IOT]: '#4ade80',
  [NODE_CATEGORIES.MEDIA]: '#fb7185',
  [NODE_CATEGORIES.SECURITY]: '#ef4444',
  [NODE_CATEGORIES.PAYMENTS]: '#00897B',
  [NODE_CATEGORIES.CUSTOM]: '#94a3b8',
};
