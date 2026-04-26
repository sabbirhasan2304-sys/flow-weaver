# Build the missing pieces

The four phases (Queue → Ghost Loader → Identity Stitching → Predictive Recovery) are all in place, but several connecting pieces are stubbed or missing. This plan finishes them.

## What's missing today

1. **No real destination forwarding.** `process-tracking-queue` writes events to the `tracking_events` table but never actually sends them to Meta CAPI / TikTok / GA4 / etc. Recovered events show `destinations_forwarded: ["tracking_pipeline"]` but nothing leaves the server.
2. **Heartbeat snippet not in the main tracking script.** Predictive Recovery only works if you copy a separate snippet from the "Predictive → Install" tab. The universal tracking script and the polymorphic Ghost Loader don't ping `session-heartbeat`.
3. **No way to mark intent from product/checkout pages.** The snippet relies on `window.NXIntent` being set, but there's no helper API for merchants to set it from common platforms.
4. **No "click to seed test data"** — empty dashboards make it hard to verify the system works end-to-end.
5. **Recovered-event auditing is shallow.** `recovered_events.destinations_forwarded` is a fixed string, not the real list of destinations actually called.

## What we'll build

### 1. Real destination forwarder (the big one)
Add a new `forward-to-destinations` edge function that:
- Reads active destinations from `tracking_marketing_destinations` for the workspace owner
- Sends server-side conversions to **Meta CAPI**, **TikTok Events API**, **GA4 Measurement Protocol**, **Google Ads Enhanced Conversions** (the 4 highest-value destinations — others can follow the same pattern)
- Returns the list of platforms it actually delivered to + error details per platform
- Logs each delivery to a new `destination_delivery_logs` table for observability

Wire `process-tracking-queue` and `process-recovery-queue` to call it after insert/recovery, recording the real platforms in `recovered_events.destinations_forwarded`.

### 2. Heartbeat baked into the tracking layer
- Extend `serve-ghost-script` so the polymorphic JS includes the `sendBeacon` heartbeat loop. No second snippet needed — Ghost Loader users get recovery for free.
- Add a tiny helper API: `window.nx('intent', 'InitiateCheckout', { value, currency, user })` so merchants can mark intent in one line.
- Auto-detect intent from common e-commerce signals: `[data-nx-intent="checkout"]` clicks, form submits on pages matching `/checkout|/cart|/payment/`, and `localStorage` cart shape used by WooCommerce / Shopify.

### 3. Destination delivery audit table
New `destination_delivery_logs` (workspace-scoped, members can view) capturing per-platform attempts: platform, http status, latency, error, recovered flag. Surfaced in a small panel on the Predictive tab and on the existing Destinations tab.

### 4. "Simulate a recovery" button
On the Predictive tab, add a dev-mode button that:
- Inserts a fake stalled session with intent_score 0.9 (Purchase, $99.99)
- Triggers `process-recovery-queue` immediately
- Shows the result toast and refreshes both tables

### 5. Small UX polish
- Dropdown to pick recovery reason filter on Recovered Events
- Per-destination green/red dots on the Predictive header
- "Last batch" badge showing time + count from the most recent worker run

## Technical details

**New files**
- `supabase/functions/forward-to-destinations/index.ts` — fan-out to CAPI/TikTok/GA4/Google Ads with per-platform handlers and retry-once logic
- `src/components/tracking/DestinationDeliveryPanel.tsx` — log viewer reused on Predictive + Destinations tabs

**Modified files**
- `supabase/functions/process-tracking-queue/index.ts` — call forwarder after insert
- `supabase/functions/process-recovery-queue/index.ts` — call forwarder, record real destinations list
- `supabase/functions/serve-ghost-script/index.ts` — embed heartbeat + `window.nx()` API + auto-intent detection
- `src/components/tracking/PredictiveRecovery.tsx` — simulate button, delivery panel, last-batch badge
- `src/components/tracking/ConnectWebsite.tsx` — note that the universal script now includes recovery automatically

**Database migration**
- `destination_delivery_logs` table (workspace_id, destination_platform, event_name, http_status, latency_ms, error_message, recovered, created_at) with RLS: members can SELECT

**Forwarding contract**
```text
process-tracking-queue ──insert──▶ tracking_events
                       └──invoke──▶ forward-to-destinations
                                       ├─▶ Meta CAPI
                                       ├─▶ TikTok Events API
                                       ├─▶ GA4 MP
                                       └─▶ Google Ads
                                    returns { delivered: [...], failed: [...] }
                                       └──insert──▶ destination_delivery_logs
```

**No new secrets required** — destination credentials already live in `tracking_marketing_destinations.credentials` (per-workspace).

## Out of scope (flag for a later phase)
- Snapchat / Pinterest / LinkedIn / X destination handlers (same pattern, can be added incrementally)
- Webhook-based custom destinations
- Per-destination retry queue with exponential backoff (recovery currently retries via the queue's visibility timeout)