

# NexusTrack — Advanced Feature Implementation Plan

## What's Already Built
All 11 tabs are live: Overview, Events, POAS, Monitoring, Reliability, Privacy, Identity, NexusStore, Dashboards, Agency, Settings. Plus: AI Setup Assistant, Stape Migration Wizard, Onboarding Wizard, 30+ tracking nodes, realtime subscriptions, admin access, and sample data.

## What Needs Enhancement (gaps vs. the spec)

### Phase 1: AI-Powered Features (High Impact Differentiators)

**1A. AI Event Mapper** — New component
- Paste raw dataLayer/webhook JSON, AI maps fields to destination schemas (Meta CAPI, GA4, TikTok)
- Uses Lovable AI (Gemini) via edge function
- Output: field mapping config saved to NexusStore for reuse

**1B. AI Anomaly Detection** — Add to Monitoring tab
- Compute baseline event volumes from `tracking_events` (hourly averages over 7 days)
- Flag unusual drops/spikes (>2 standard deviations)
- Visual sparkline with anomaly markers
- Auto-create alert when anomaly detected

**1C. AI Attribution Assistant** — New sub-tab under POAS
- Multi-touch attribution models (last-click, linear, time-decay, position-based)
- Pull conversion paths from tracking events
- Recommendation engine: "Switch to position-based — estimated +12% ROAS accuracy"

### Phase 2: Data Reliability — Connect to Real Data

**2A. ReliabilityEngine** — Replace mock data with live queries
- Delivery rate, retry count, dedup stats from `tracking_events`
- Delivery receipts timeline from real event status transitions
- Save retry/dedup config to `tracking_privacy_settings` or new config table

**2B. Alert Rules Engine** — New within Monitoring
- Configurable rules: metric + threshold + channel (email/webhook)
- DB table: `tracking_alert_rules` (user_id, metric, operator, threshold, channel, enabled)
- Evaluate rules on each realtime event update

### Phase 3: Analytics Enhancements

**3A. Ad Recovery Metrics** — Enhance MonitoringDashboard
- Quantify events recovered from ad-blocked users
- Estimated revenue impact calculation (events recovered x avg order value from POAS feed)

**3B. Cookie Health Monitor** — New card in Monitoring
- Breakdown by cookie type (first-party server-set, first-party client, third-party)
- Cookie lifetime distribution chart
- ITP/ETP impact analysis

**3C. GDPR/CCPA PDF Report** — Make Privacy tab export functional
- Edge function that generates compliance summary PDF
- Includes: PII scan results, consent config, anonymizer rules, data residency

### Phase 4: Agency & NexusStore Enhancements

**4A. Automated Agency Reports** — Make report generation real
- Edge function to compile client metrics into PDF
- Schedule: daily/weekly/monthly via cron or manual trigger
- Email delivery to client

**4B. Bulk Operations** — Agency Dashboard
- Select multiple clients, apply template/config changes in batch
- Bulk enable/disable power-ups across workspaces

**4C. NexusStore Bulk Import/Export**
- CSV/JSON file upload to bulk insert documents
- Export collection as CSV/JSON download

### Phase 5: Advanced Power-Ups

**5A. Webhook Proxy** — New tracking node + settings UI
- Bearer, HMAC, Basic auth support
- Request/response logging

**5B. IP Blocking** — New card in Settings
- CIDR range input, block list management
- Applied as transform node in pipelines

## Database Changes
```
-- Alert rules
CREATE TABLE tracking_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT '>',
  threshold NUMERIC NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add event_fingerprint for dedup
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS event_fingerprint TEXT;

-- Add retry_config per destination
ALTER TABLE tracking_destinations ADD COLUMN IF NOT EXISTS retry_config JSONB DEFAULT '{"max_retries": 10, "backoff": "exponential_jitter"}';
```

## Edge Functions
- `ai-event-mapper/index.ts` — Gemini-powered field mapping
- `generate-compliance-report/index.ts` — PDF compliance report
- `generate-agency-report/index.ts` — Client performance PDF

## Implementation Order
1. ReliabilityEngine live data + alert rules table (migration)
2. AI Event Mapper (edge function + UI component)
3. AI Anomaly Detection (monitoring enhancement)
4. Ad Recovery + Cookie Health metrics
5. GDPR/CCPA PDF export
6. NexusStore bulk import/export
7. Agency automated reports + bulk ops
8. AI Attribution Assistant
9. Webhook proxy + IP blocking

## Technical Details
- All AI features use Lovable AI (Gemini 2.5 Flash) — no API key needed
- PDF generation via edge functions using jsPDF or html-to-pdf approach
- Alert evaluation happens client-side on realtime events (Phase 2 can move to edge function cron)
- Dedup fingerprinting: SHA-256 hash of `event_name + user_id + timestamp_truncated_to_window`

