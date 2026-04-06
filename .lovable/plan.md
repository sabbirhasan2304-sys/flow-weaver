

# Global Error Boundary with Crash Reporting

## Overview
Add a React Error Boundary that catches unhandled errors app-wide, displays a friendly fallback UI, and logs crash details to a new database table.

## Steps

### 1. Create `error_logs` database table
Migration to create a table storing crash reports with columns: id, user_id (nullable), error_message, error_stack, component_stack, url, user_agent, created_at. RLS: users can insert (anonymous allowed via service role), admins can read all.

### 2. Create `src/components/ErrorBoundary.tsx`
Class component (Error Boundaries require class components) that:
- Catches errors via `componentDidCatch` and `getDerivedStateFromError`
- Shows a friendly fallback card with "Something went wrong" message, error details toggle, and "Reload" button
- Logs error + component stack to `error_logs` table via Supabase insert
- Styled consistently with the existing dark/light theme using Tailwind + shadcn Card

### 3. Wrap `<App />` in `main.tsx`
Wrap the root `<App />` component with `<ErrorBoundary>` so all unhandled React errors are caught globally.

### 4. Add error logs viewer in Admin dashboard
Add a new tab or section in `src/pages/Admin.tsx` showing recent crash reports from `error_logs` table — timestamp, URL, error message, expandable stack trace.

## Technical Details
- Error Boundary must be a class component (React limitation)
- Supabase insert for logging uses the anon client; RLS INSERT policy allows authenticated or falls back gracefully if unauthenticated
- No edge function needed — direct table insert from client
- Admin viewing uses existing `is_admin()` RLS pattern

