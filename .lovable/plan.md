

# Offline Detection Banner

## Overview
Add a global offline/online detection hook and a persistent warning banner that appears when the user loses internet connectivity.

## Steps

### 1. Create `src/hooks/useOnlineStatus.ts`
A small custom hook using `navigator.onLine` and `online`/`offline` window events to return a reactive `isOnline` boolean.

### 2. Create `src/components/OfflineBanner.tsx`
A fixed-position banner at the top of the viewport (above the header) that renders only when offline. Shows a warning icon, "You are offline" message, and auto-dismisses when connectivity returns. Uses existing Tailwind classes (bg-destructive, text-destructive-foreground) for consistent theming.

### 3. Add `<OfflineBanner />` to `App.tsx`
Place it inside the `<ThemeProvider>` but outside `<BrowserRouter>` so it's always visible regardless of route.

## Technical Details
- Uses native `window.addEventListener('online' | 'offline')` — no dependencies needed
- Banner uses `fixed top-0 z-[100]` to float above the sticky header (z-50)
- Smooth enter/exit animation via Tailwind `animate-in`/`animate-out` or simple conditional rendering

