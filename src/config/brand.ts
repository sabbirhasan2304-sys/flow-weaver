// Centralized brand domain configuration
// Display URLs shown to users in snippets, docs, and plugins
// In production, these domains should be reverse-proxied to the actual infrastructure

export const BRAND_DOMAIN = 'biztoribd.com';
export const TRACKING_SCRIPT_URL = `https://cdn.${BRAND_DOMAIN}/nexus-track.js`;
export const API_ENDPOINT = `https://api.${BRAND_DOMAIN}/v1`;
export const BRAND_URL = `https://${BRAND_DOMAIN}`;

// Internal URLs for actual API calls (not shown to users)
export const INTERNAL_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
