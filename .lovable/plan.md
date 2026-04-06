## NexusTrack vs Stape.io Gap Analysis & Improvement Plan

### What NexusTrack Already Has (Ahead of Stape)
- ✅ AI Event Mapper (Stape doesn't have AI)
- ✅ Visual workflow builder for tracking (Stape relies on GTM)
- ✅ NexusStore document DB (matches Stape Store)
- ✅ Identity Hub (cross-device stitching)
- ✅ Custom Dashboards
- ✅ Agency Dashboard with white-label
- ✅ 8 marketing destinations configured
- ✅ Bot detection & anomaly detection
- ✅ Reliability Engine with DLQ + replay

### Critical Gaps to Fix

#### 1. Event Ingestion Edge Function (CRITICAL)
- Stape's core: events come in → get processed → forwarded to destinations
- **Current state**: No real endpoint to receive tracking events from the JS snippet
- **Fix**: Create `track-event` edge function that accepts events, validates, stores in `tracking_events`, and triggers forwarding

#### 2. Consent Mode v2 Support
- Stape heavily promotes Google Consent Mode v2 compliance
- **Fix**: Add Consent Mode configuration to the Privacy tab with:
  - Google Consent Mode v2 settings (ad_storage, analytics_storage, etc.)
  - Auto-adjustment of event data based on consent state
  - Visual consent state indicator per event

#### 3. Website Tracking Checker / Site Auditor
- Stape offers a free "scan your site" tool that checks tracking setup
- **Fix**: Build a "Scan Website" feature in the Connect tab that:
  - Checks if tracking script is installed
  - Verifies custom domain CNAME
  - Tests event delivery
  - Checks consent mode setup
  - Shows actionable recommendations

#### 4. Conversion Recovery Dashboard
- Stape's key selling point: "recover X% lost conversions"
- **Fix**: Add a "Recovery" section to Overview showing:
  - Events that bypassed ad blockers (server-side vs client-side comparison)
  - Estimated additional conversions captured
  - Revenue impact calculation

#### 5. Live Event Debugger
- Stape has real-time debugging/preview mode
- **Fix**: Add a "Debug Mode" toggle that shows:
  - Live event stream with request/response details
  - Payload validation with warnings
  - Test event sending from the dashboard

### Files to Create/Modify
- **NEW**: `supabase/functions/track-event/index.ts` — Event ingestion endpoint
- **NEW**: `src/components/tracking/ConsentModeConfig.tsx` — Consent Mode v2 UI
- **NEW**: `src/components/tracking/SiteAuditor.tsx` — Website tracking checker
- **NEW**: `src/components/tracking/ConversionRecovery.tsx` — Recovery metrics
- **NEW**: `src/components/tracking/LiveDebugger.tsx` — Real-time event debugger
- **MODIFY**: `src/pages/Tracking.tsx` — Add new tabs
- **MODIFY**: `src/components/tracking/ConnectSnippets.tsx` — Update script to use new endpoint
- **MODIFY**: `src/components/tracking/TrackingOverview.tsx` — Add recovery metrics
