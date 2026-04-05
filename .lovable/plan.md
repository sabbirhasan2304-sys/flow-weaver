
# NexusTrack — Phase 2: Privacy, Identity & Data Reliability

## What's Already Built
✅ POAS Dashboard, Event Replay + Dead Letter Queue, Enhanced Monitoring (ad recovery, cookie health, bot traffic), AI Audit mode, NexusStore, Agency Dashboard, Stape Migration Wizard, Onboarding Wizard, 17 tracking nodes

## What Gets Built Now

### 1. Privacy & Compliance Center (new tab)
New component `src/components/tracking/PrivacyCompliance.tsx`
- **PII Auto-Scanner**: Scans event payloads for email, phone, IP, credit card patterns — flags before transmission
- **Consent Mode v2**: Toggle Google/Meta consent mode settings per workspace
- **Anonymizer Config**: IP truncation, user agent generalization, configurable field masking rules
- **CMP Integration**: Configure consent signals from OneTrust, Cookiebot, Usercentrics
- **Data Residency**: Choose storage region preference (EU/US/APAC) per workspace
- **GDPR/CCPA Report Generator**: One-click export of compliance summary as downloadable PDF

### 2. Identity & Enrichment Hub (new tab)
New component `src/components/tracking/IdentityHub.tsx`
- **User ID Generator**: Configure first-party hashed user IDs (salt, hashing algorithm)
- **Cross-Domain Stitching**: Set up domain list for identity linking
- **Cookie Lifetime Config**: Server-set first-party cookies with configurable TTL
- **Click ID Recovery**: Configure gclid/fbclid/ttclid recovery from URL params or first-party storage
- **Ad-Blocker Bypass**: Custom GTM/GA4 loader setup via first-party domain
- **Bot Detection Settings**: ML-based classifier threshold, SEO crawler allowlist, block/tag/pass actions

### 3. Data Reliability Dashboard
Enhance `EventLog.tsx` and add new component `src/components/tracking/ReliabilityEngine.tsx`
- **Event Backup Config**: Retention period selector (30/90/365 days, unlimited)
- **Dedup Settings**: Configure dedup window (event_id + fingerprinting), view dedup stats
- **Retry Config**: Max attempts (up to 10), backoff strategy (exponential + jitter), per-destination
- **Delivery Receipts Timeline**: Visual timeline showing per-event status transitions
- **Event Backup Browser**: Browse historical events beyond the live log, filter by date range

### 4. Custom Dashboard Builder
New component `src/components/tracking/CustomDashboard.tsx`
- Drag-and-drop widget grid using existing `@dnd-kit` library
- Widget types: stat card, line chart, bar chart, pie chart, table, metric counter
- Each widget configurable: data source (events/destinations/pipelines), time range, filters
- Save/load custom dashboards per user
- New DB table `tracking_dashboards` (user_id, name, widgets JSONB)

### 5. More Tracking Nodes (expand `tracking.ts`)
Add 10+ new nodes to `src/data/nodeDefinitions/tracking.ts`:
- **Sources**: Custom API Endpoint, Mobile SDK, Server Webhook
- **Transforms**: Consent Filter, Click ID Restorer, Request Scheduler, User ID Stitcher, XML→JSON
- **Destinations**: Pinterest CAPI, LinkedIn CAPI, Klaviyo, Custom Webhook with HMAC

## Database Migration
```sql
-- Custom dashboards
CREATE TABLE tracking_dashboards (user_id, name, widgets JSONB, is_default BOOLEAN)
-- Privacy settings per workspace
CREATE TABLE tracking_privacy_settings (user_id, consent_mode JSONB, anonymizer_rules JSONB, data_residency TEXT, cmp_provider TEXT)
-- Identity config
CREATE TABLE tracking_identity_config (user_id, user_id_salt TEXT, cookie_ttl_days INT, cross_domains TEXT[], click_id_recovery JSONB, bot_threshold NUMERIC)
```

## Files Summary
| Action | File |
|--------|------|
| Create | `src/components/tracking/PrivacyCompliance.tsx` |
| Create | `src/components/tracking/IdentityHub.tsx` |
| Create | `src/components/tracking/ReliabilityEngine.tsx` |
| Create | `src/components/tracking/CustomDashboard.tsx` |
| Modify | `src/pages/Tracking.tsx` — add 4 new tabs |
| Modify | `src/data/nodeDefinitions/tracking.ts` — add 12 new nodes |
| Migrate | 3 new tables + RLS |

## Implementation Order
1. DB migration (3 tables)
2. Privacy & Compliance Center
3. Identity & Enrichment Hub
4. Data Reliability Dashboard
5. Custom Dashboard Builder
6. Expand tracking nodes
7. Update Tracking page tabs
