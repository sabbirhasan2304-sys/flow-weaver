

## Admin Dashboard Improvement Plan

### Issues Found

1. **Fake trend percentages** — Stat cards show hardcoded "+12%", "+8%" etc. that are not calculated from real data
2. **Settings tab is a placeholder** — Shows "Coming Soon" with no actual settings
3. **Export button does nothing** — Header "Export" button has no onClick handler
4. **No recent activity feed** — No way to see recent signups, workflow creations, or executions at a glance
5. **No email marketing admin overview** — Admin can't see email stats across all users
6. **Crash Reports lacks severity/resolution** — No filtering, no "resolved" toggle, very basic
7. **Subscriptions tab counts from limited data** — Uses `users` array (max 100) instead of querying actual counts
8. **No system announcements** — No way for admin to broadcast messages to users

### Implementation Plan

**Step 1: Fix fake stat trends and add real calculations**
- Remove hardcoded trend values from stat cards
- Compare current period vs. previous period counts (e.g., users this week vs last week)
- Show "N/A" when insufficient data exists

**Step 2: Add recent activity feed to overview**
- Create an `AdminActivityFeed` component showing the last 20 events:
  - New user signups (from `profiles`)
  - Workflow executions (from `executions`)  
  - Payment transactions (from `payment_transactions`)
- Display as a timeline/list below the stat cards, before the tabs

**Step 3: Make Export button functional**
- Wire the header Export button to export a summary report (JSON) containing all stat cards data, user counts by plan, and execution stats

**Step 4: Add Email Marketing admin tab**
- New tab "Email" showing cross-user email campaign stats:
  - Total campaigns, total emails sent, open/click rates aggregated
  - Top campaigns table with sender, subject, stats
- Query `email_campaigns` table without profile filter

**Step 5: Improve Crash Reports**
- Add severity filter (info/warning/error)
- Add "Mark Resolved" button per crash report
- Add count badge on the Crash Reports tab trigger
- Add bulk "Clear All" action

**Step 6: Replace Settings placeholder with real settings**
- Platform name/branding config (stored in a `platform_settings` table or local state)
- Default trial duration setting
- Maintenance mode toggle (UI-only flag stored in DB)
- Email notification preferences for admin alerts

**Step 7: Fix subscription counts**
- Query actual counts from `subscriptions` table directly instead of filtering the limited `users` array
- Use `select('*', { count: 'exact', head: true })` grouped by plan

### Technical Details
- All new components follow existing patterns: motion animations, Card-based layouts, same color scheme
- New queries use existing RLS admin policies (already have `is_admin()` function)
- No new database tables required for steps 1-5; step 6 may need a `platform_settings` migration
- Estimated 6-8 files modified/created

