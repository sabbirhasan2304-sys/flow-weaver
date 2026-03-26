

# UX Improvement Plan for BiztoriBD

## Current Issues Identified

1. **Mobile navigation is hidden** - No hamburger menu; nav links are `hidden md:flex`, completely invisible on the user's 411px viewport
2. **Landing page is text-heavy** - Long sections with no interactive demos or visual breaks
3. **Dashboard header is cramped on mobile** - 7 nav items overflow on smaller screens
4. **No onboarding flow** - New users land on Dashboard with no guidance
5. **No loading skeletons** - Content jumps when data loads
6. **Footer is minimal** - Missing social links, support, legal pages

## Plan

### 1. Add Mobile Navigation (Hamburger Menu)
- Add a `Sheet`-based mobile menu to the landing page header (Index.tsx)
- Add the same to `DashboardLayout.tsx` for the 7 nav items
- Include smooth open/close animation with backdrop

### 2. Improve Landing Page Mobile Experience
- Make hero text responsive (`text-3xl` on mobile instead of `text-5xl`)
- Stack CTA buttons vertically on small screens (already done partially)
- Add horizontal scroll for stats on very small screens
- Reduce section padding on mobile (`py-16` instead of `py-28`)

### 3. Add Dashboard Onboarding
- Show a welcome card for new users with 0 workflows
- Include 3 quick-start actions: "Create Workflow", "Browse Templates", "Import from n8n"
- Dismiss permanently via localStorage

### 4. Add Loading Skeletons
- Replace spinner states with skeleton cards in Dashboard
- Add skeleton to workflow editor while canvas loads

### 5. Improve Dashboard Mobile Layout
- Convert horizontal nav to a bottom tab bar on mobile (most important 5 items)
- Move secondary actions (Billing, Admin) to profile dropdown only
- Make workflow cards stack properly with touch-friendly tap targets

### 6. Micro-interactions & Feedback
- Add toast confirmations for all destructive actions
- Add hover tooltips to icon-only buttons
- Add transition animations when switching between grid/list view

## Files to Modify
- `src/pages/Index.tsx` — mobile nav, responsive spacing
- `src/components/layout/DashboardLayout.tsx` — hamburger menu, bottom tabs
- `src/pages/Dashboard.tsx` — onboarding card, skeletons
- `src/components/workflow/WorkflowEditor.tsx` — mobile toolbar adjustments

## Scope
Approximately 4 files modified. Focus is on mobile-first fixes since the user is viewing on a 411px viewport, plus onboarding for new users.

