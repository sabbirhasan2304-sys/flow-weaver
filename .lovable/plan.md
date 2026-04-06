
# Marketing Platform Destinations for NexusTrack

## Overview
Add a "Destinations" tab in NexusTrack with built-in connectors for major marketing platforms, plus pre-built workflow templates for advanced customization.

## Steps

### 1. Create `src/components/tracking/MarketingDestinations.tsx`
A comprehensive destinations panel with:

**Platform Connectors (simple setup forms):**
- **Facebook / Meta CAPI** — Pixel ID, Access Token, Test Event Code, event mapping (Purchase, AddToCart, Lead, etc.)
- **TikTok Events API** — Pixel Code, Access Token, event mapping
- **Google Ads** — Conversion ID, Conversion Label, Enhanced Conversions config
- **Google Analytics 4** — Measurement ID, API Secret, event mapping
- **Snapchat** — Pixel ID, Access Token
- **Pinterest** — Tag ID, Access Token
- **LinkedIn** — Partner ID, Conversion ID
- **Twitter/X** — Pixel ID

Each connector card shows:
- Connection status (connected/disconnected)
- Quick setup form with required credentials
- Event mapping table (map your events → platform events)
- Test event button
- Toggle to enable/disable

**Pre-built Workflow Templates section:**
- "Facebook CAPI Server-Side" template
- "TikTok Server-Side Tracking" template
- "GA4 Measurement Protocol" template
- "Multi-Platform Fan-Out" template (sends to all platforms at once)
- Each template has a "Use Template" button that navigates to the workflow editor

### 2. Create `tracking_destinations_config` table
Store platform credentials and event mappings per user, per platform.

### 3. Add "Destinations" tab to Tracking page
New tab between existing tabs with a Send/ArrowUpRight icon.

## Technical Details
- Platform API tokens are sensitive → stored encrypted in database, never exposed to client after save
- Event mapping lets users map their custom events (e.g. "checkout_complete") to platform events (e.g. "Purchase")
- Test event feature sends a test conversion to verify the connection works
- Pre-built templates link to the existing workflow editor with pre-configured nodes
