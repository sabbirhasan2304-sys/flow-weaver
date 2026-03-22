// ============================================================
// BIZTORIBD NODE DEFINITIONS - COMPREHENSIVE 250+ NODES
// Full n8n parity + advanced capabilities
// ============================================================

import { NodeDefinition, NODE_CATEGORIES, CATEGORY_COLORS } from '@/types/nodes';
import { triggerNodes } from './triggers';
import { actionNodes } from './actions';
import { dataNodes } from './data';
import { logicNodes } from './logic';
import { aiNodes } from './ai';
// communicationNodes are included in productivity for now
import { productivityNodes } from './productivity';
import { storageNodes } from './storage';
import { databaseNodes } from './databases';
import { developmentNodes } from './development';
import { ecommerceNodes } from './ecommerce';
import { analyticsNodes } from './analytics';
import { blockchainNodes } from './blockchain';
import { iotNodes } from './iot';
import { mediaNodes } from './media';
import { securityNodes } from './security';
import { customNodes } from './custom';
import { paymentNodes } from './payments';
import { apiNodes } from './api';
import { emailMarketingNodes } from './emailMarketing';
import { integrationNodes } from './integrations';
import { bangladeshNodes } from './bangladesh';

// Combine all node definitions and deduplicate by type (first occurrence wins)
const allNodes: NodeDefinition[] = [
  ...triggerNodes,
  ...actionNodes,
  ...dataNodes,
  ...logicNodes,
  ...aiNodes,
  ...productivityNodes,
  ...storageNodes,
  ...databaseNodes,
  ...developmentNodes,
  ...ecommerceNodes,
  ...analyticsNodes,
  ...blockchainNodes,
  ...iotNodes,
  ...mediaNodes,
  ...securityNodes,
  ...customNodes,
  ...paymentNodes,
  ...apiNodes,
  ...emailMarketingNodes,
  ...integrationNodes,
  ...bangladeshNodes,
];

const seen = new Set<string>();
export const nodeDefinitions: NodeDefinition[] = allNodes.filter((node) => {
  if (seen.has(node.type)) return false;
  seen.add(node.type);
  return true;
});

// Helper function to get node by type
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeDefinitions.find((node) => node.type === type);
}

// Get nodes grouped by category (for NodePalette)
export function getNodesByCategory(): Record<string, NodeDefinition[]> {
  const grouped: Record<string, NodeDefinition[]> = {};
  nodeDefinitions.forEach((node) => {
    if (!grouped[node.category]) {
      grouped[node.category] = [];
    }
    grouped[node.category].push(node);
  });
  return grouped;
}

// Get nodes by specific category
export function getNodesByCategoryName(category: string): NodeDefinition[] {
  return nodeDefinitions.filter((node) => node.category === category);
}

// Get all categories with node counts
export function getCategoriesWithCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  nodeDefinitions.forEach((node) => {
    counts[node.category] = (counts[node.category] || 0) + 1;
  });
  return counts;
}

// Search nodes
export function searchNodes(query: string): NodeDefinition[] {
  const lowerQuery = query.toLowerCase();
  return nodeDefinitions.filter(
    (node) =>
      node.displayName.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.type.toLowerCase().includes(lowerQuery)
  );
}

export { NODE_CATEGORIES, CATEGORY_COLORS } from '@/types/nodes';
