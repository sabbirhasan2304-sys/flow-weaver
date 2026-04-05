

# NexusTrack — Phase 1 Implementation Plan

NexusTrack will be added as a new product section within your existing BiztoriBD platform at `/tracking`. Nothing existing will be replaced.

## What Gets Built

### 1. Tracking Dashboard Page (`/tracking`)
A tabbed page with 5 sections: Overview, Pipelines, Event Log, Monitoring, Settings. Uses the existing `DashboardLayout` wrapper.

**Overview tab**: Stats cards (events processed, delivery rate, active pipelines), quick-start buttons (Connect Shopify, Connect Meta, Connect GA4), and a live event stream preview table.

**Pipelines tab**: Visual drag-and-drop pipeline builder reusing ReactFlow. Source nodes (Web Pixel, Shopify, WooCommerce, Custom API) connect through Transform nodes (PII Anonymizer, Geo Enrichment, Bot Filter, Deduplicator, Cookie Recovery) to Destination nodes (Meta CAPI, Google Ads, GA4, TikTok, Snapchat, Custom Webhook). Simple config forms per node.

**Event Log tab**: Searchable/filterable table of tracking events with status badges (delivered/failed/retried), payload detail drawer, and CSV export.

**Monitoring tab**: Delivery health chart (success rate over time), anomaly alert cards, and an alert rule builder (email when error rate exceeds threshold).

**Settings tab**: Custom domain config, consent mode toggles, bot detection settings, cookie recovery options.

### 2. AI Setup Assistant
A dialog component accessible from the Overview tab. User enters a website URL, and an edge function uses Lovable AI (Gemini) to analyze the site and recommend optimal tracking configuration (which sources, destinations, and transforms to use).

### 3. Database Tables (4 new tables via migration)
- `tracking_pipelines` — stores pipeline ReactFlow data per user
- `tracking_events` — event log with status, retry count, payload
- `tracking_alerts` — user-defined alert rules
- `tracking_destinations` — saved destination configs (Meta pixel ID, GA4 measurement ID, etc.)

All tables have RLS policies scoped to `auth.uid()` via `get_profile_id()`.

### 4. Edge Function: `ai-tracking-setup`
Accepts a URL, uses Lovable AI to analyze it, returns recommended tracking configuration as JSON.

### 5. Navigation & Landing Page Updates
- Add "Tracking" nav item to `DashboardLayout` (with `Crosshair` icon)
- Add `/tracking` route to `App.tsx`
- Add a NexusTrack feature card in the landing page features array

## Files to Create
| File | Purpose |
|------|---------|
| `src/pages/Tracking.tsx` | Main page with tab navigation |
| `src/components/tracking/TrackingOverview.tsx` | Stats + quick-start cards |
| `src/components/tracking/PipelineBuilder.tsx` | ReactFlow-based visual builder |
| `src/components/tracking/trackingNodeDefinitions.ts` | Source/transform/destination node types |
| `src/components/tracking/EventLog.tsx` | Searchable event log table |
| `src/components/tracking/MonitoringDashboard.tsx` | Health charts + alert rules |
| `src/components/tracking/TrackingSettings.tsx` | Domain, consent, bot config |
| `src/components/tracking/AISetupAssistant.tsx` | AI website analyzer dialog |
| `supabase/functions/ai-tracking-setup/index.ts` | AI analysis edge function |

## Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/tracking` route |
| `src/components/layout/DashboardLayout.tsx` | Add "Tracking" nav item |
| `src/pages/Index.tsx` | Add NexusTrack to features array |

## Database Migration SQL
```sql
CREATE TABLE tracking_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  pipeline_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES tracking_pipelines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT,
  status TEXT DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  response JSONB,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tracking_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  condition JSONB NOT NULL,
  notify_email TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tracking_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS + policies for all 4 tables scoped to get_profile_id()
```

## Implementation Order
1. Database migration (4 tables + RLS)
2. Tracking node definitions
3. Core page + tab structure
4. Overview tab with stats
5. Pipeline builder (ReactFlow reuse)
6. Event log table
7. Monitoring dashboard
8. Settings panel
9. AI Setup Assistant + edge function
10. Navigation + landing page updates

