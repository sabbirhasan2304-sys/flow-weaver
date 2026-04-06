

## Fix All Domain References to Use biztoribd.com

### Problem
The tracking snippet and API URLs currently expose infrastructure domains:
- **Script source**: Uses `window.location.origin` → shows `*.lovableproject.com` or `*.lovable.app`
- **API URL**: Uses `VITE_SUPABASE_URL` → shows `*.supabase.co`
- **Plugin code**: Also references the Supabase URL via `API_BASE_URL`

Users installing the tracking snippet on their sites see these internal domains instead of `biztoribd.com`.

### Solution
Create a centralized brand domain config and replace all external-facing URLs.

### Changes

**1. Create a brand config file** (`src/config/brand.ts`)
- Define constants: `BRAND_DOMAIN = 'biztoribd.com'`, `TRACKING_SCRIPT_URL = 'https://cdn.biztoribd.com/nexus-track.js'`, `API_ENDPOINT = 'https://api.biztoribd.com/v1'`
- These are the URLs shown in snippets to end users — they would be reverse-proxied to actual infra in production

**2. Update `src/components/tracking/ConnectSnippets.tsx`**
- Replace `window.location.origin` with `https://cdn.biztoribd.com`
- Replace `API_BASE_URL` (supabase URL) with `https://api.biztoribd.com/v1`
- All 3 snippet types (Universal, Shopify, WordPress) updated

**3. Update `src/components/api-docs/apiDocsData.ts`**
- Change `API_BASE_URL` to use `https://api.biztoribd.com/v1` for display in docs
- Keep actual supabase URL for internal API calls (playground)

**4. Update `src/components/api-docs/pluginCode.ts`**
- WordPress plugin and Shopify snippet use the brand domain

**5. Update `src/components/tracking/LiveDebugger.tsx`**
- Replace hardcoded `supabase.co` reference with brand API domain for display, keep actual supabase URL for fetch calls

**6. Update `supabase/functions/auth-email-hook/index.ts`**
- Replace `lovableproject.com` sample URL with `https://biztoribd.com`

### Architecture Note
- **Display URLs** (shown to users in snippets, docs, plugins): Always `biztoribd.com` subdomains
- **Internal fetch URLs** (actual API calls from the app): Continue using `VITE_SUPABASE_URL` since that's where the backend lives
- In production, `api.biztoribd.com` and `cdn.biztoribd.com` would be set up as reverse proxies (via Cloudflare or similar) pointing to the actual infrastructure

### Files to Create/Modify
- **New**: `src/config/brand.ts`
- **Edit**: `src/components/tracking/ConnectSnippets.tsx`
- **Edit**: `src/components/api-docs/apiDocsData.ts`
- **Edit**: `src/components/api-docs/pluginCode.ts`
- **Edit**: `src/components/tracking/LiveDebugger.tsx`
- **Edit**: `supabase/functions/auth-email-hook/index.ts`

