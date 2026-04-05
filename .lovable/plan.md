

# NexusTrack — Full Feature Enhancement Plan

Building all core features progressively across the existing `/tracking` module. No existing code is replaced.

## Phase 1: Enhanced Tracking Dashboard

### 1A. POAS / Profit Dashboard (new tab)
- New component `src/components/tracking/POASDashboard.tsx`
- Product feed upload (CSV with SKU, cost, price)
- Profit per order calculation from tracking events
- ROAS vs POAS comparison chart (Recharts)
- Trend line and date range picker
- New DB table `tracking_product_feeds` (user_id, sku, cost_price, sell_price)

### 1B. Event Replay & Dead Letter Queue
- Add "Replay" button per failed event in `EventLog.tsx`
- New "Dead Letter" tab inside Event Log filtering `status = 'failed'`
- Resend action calls a new edge function `replay-tracking-event`
- Bulk replay with checkbox selection
- Error explanation column in the detail drawer

### 1C. Enhanced Monitoring Cards
- Update `MonitoringDashboard.tsx` with 3 new sections:
  - **Ad Recovery Metrics**: Card showing estimated events recovered from ad-blocked users
  - **Cookie Health Monitor**: Pie chart showing users by cookie type (first-party, third-party, none) and average lifetime
  - **Bot Traffic Analysis**: Bar chart of bot vs human traffic, top bot sources, blocked count

### 1D. Website Tracking Auditor
- Enhance `AISetupAssistant.tsx` with a second mode: "Audit"
- AI scans for tracking gaps, duplicate pixels, consent issues
- Returns fix recommendations with estimated revenue impact
- Uses existing `ai-tracking-setup` edge function with an expanded prompt

## Phase 2: NexusStore (Document Store)

### 2A. Database
- New table `nexus_store_collections` (user_id, name, description)
- New table `nexus_store_documents` (collection_id, user_id, data JSONB, ttl_expires_at)
- RLS scoped to `get_profile_id()`

### 2B. UI — New tab "NexusStore" on `/tracking` page
- New component `src/components/tracking/NexusStore.tsx`
- Collection list with create/delete
- Visual document browser: filter by any JSON key, sort, paginate
- Inline JSON editor for creating/editing documents
- Bulk import (CSV/JSON upload) and export
- TTL configuration per document or per collection
- Search bar with basic JSON path queries

## Phase 3: Agency & White-Label Tools

### 3A. Database
- New table `agency_clients` (agency_profile_id, client_name, client_email, workspace_id)
- New table `agency_reports` (agency_profile_id, client_id, report_data JSONB, generated_at)

### 3B. UI — New tab "Agency" on `/tracking` page
- New component `src/components/tracking/AgencyDashboard.tsx`
- Client sub-account list with invite flow
- Per-client event stats cards (events processed, delivery rate, errors)
- Consolidated billing view showing cost per client
- Automated report generation: select client, date range, metrics — generates summary
- White-label settings: upload logo, set brand colors, custom dashboard domain field

## Phase 4: Migration & Onboarding Wizard

### 4A. Stape Migration Wizard
- New component `src/components/tracking/StapeMigrationWizard.tsx`
- Step 1: Enter Stape API key
- Step 2: AI reads containers, power-ups, store data (simulated — shows mapped equivalents)
- Step 3: Auto-generate NexusTrack workflow with equivalent nodes
- Step 4: Review and confirm

### 4B. Interactive Onboarding
- New component `src/components/tracking/OnboardingWizard.tsx`
- Persona selection (Merchant / Agency / Enterprise)
- Platform detection (Shopify / WooCommerce / Custom)
- Goal selection (Meta CAPI / GA4 / Both / All platforms)
- Auto-generates a starter tracking workflow with the right nodes pre-connected
- Progress tracking with completion percentage

## Files Summary

| Action | File |
|--------|------|
| Create | `src/components/tracking/POASDashboard.tsx` |
| Create | `src/components/tracking/NexusStore.tsx` |
| Create | `src/components/tracking/AgencyDashboard.tsx` |
| Create | `src/components/tracking/StapeMigrationWizard.tsx` |
| Create | `src/components/tracking/OnboardingWizard.tsx` |
| Create | `supabase/functions/replay-tracking-event/index.ts` |
| Modify | `src/pages/Tracking.tsx` — add 3 new tabs (POAS, NexusStore, Agency) |
| Modify | `src/components/tracking/EventLog.tsx` — replay button, dead letter filter |
| Modify | `src/components/tracking/MonitoringDashboard.tsx` — ad recovery, cookie health, bot analysis |
| Modify | `src/components/tracking/AISetupAssistant.tsx` — audit mode |
| Migrate | 3 new DB tables + RLS policies |

## Implementation Order
1. DB migration (product_feeds, nexus_store_collections, nexus_store_documents, agency_clients, agency_reports)
2. POAS Dashboard + product feed upload
3. Event Replay + Dead Letter Queue + edge function
4. Enhanced Monitoring (ad recovery, cookie health, bot traffic)
5. Website Tracking Auditor enhancement
6. NexusStore UI (collections, documents, query builder)
7. Agency Dashboard (clients, reports, white-label)
8. Stape Migration Wizard
9. Onboarding Wizard
10. Update Tracking page tabs and navigation

