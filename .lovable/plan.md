
# Microsoft Clarity Integration for NexusTrack

## Overview
Add a comprehensive Microsoft Clarity integration tab in the /tracking section that lets users connect their Clarity project, generate tracking snippets, and leverage Clarity's heatmaps, session recordings, rage clicks, and dead click insights through their NexusTrack dashboard.

## Steps

### 1. Create `src/components/tracking/ClarityIntegration.tsx`
A full-featured Clarity integration panel with sub-sections:
- **Setup**: Input Clarity Project ID, generate the tracking script snippet (with copy-to-clipboard)
- **Identify API**: Configure custom user identifiers to link Clarity sessions with your users
- **Custom Tags & Events**: UI to define custom tags (`clarity("set", key, value)`) and events (`clarity("event", name)`) with code preview
- **Heatmaps Dashboard**: Visual card showing heatmap types (Click, Scroll, Area) with deep-link to Clarity dashboard
- **Session Recordings**: Card showing recording stats and link to view recordings filtered by rage clicks, dead clicks, excessive scrolling, quick-backs
- **Smart Events**: Configure and monitor rage clicks, dead clicks, and other Clarity smart events
- **Privacy Masking**: Configure which elements to mask/unmask using `data-clarity-mask` and `data-clarity-unmask`
- **Snippet Generator**: Full code snippet generator that combines all configured options into a ready-to-paste script

### 2. Add "Clarity" tab to Tracking page
Add a new tab in `src/pages/Tracking.tsx` with the Clarity icon, positioned alongside existing tabs.

### 3. Store Clarity config in database
Create a `tracking_clarity_config` table to persist each user's Clarity project ID, custom tags, events, and masking rules.

## Technical Details
- Clarity Project ID is a **public/publishable** key — safe to store in the database, no secrets needed
- The integration generates client-side JavaScript snippets that users paste into their websites
- Deep-links to `clarity.microsoft.com/projects/view/{projectId}` for heatmaps and recordings
- No edge function needed — purely client-side configuration and snippet generation
