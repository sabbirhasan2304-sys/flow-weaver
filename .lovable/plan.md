

## Setup Pricing for Tracking, Nodes, and Combined Plans

### Current State
- 4 plans exist (Free/Starter/Pro/Enterprise) focused on **workflow automation only**
- No separate tracking pricing (NexusTrack server-side tracking has no pricing model)
- No per-node pricing or usage tiers for tracking events
- Comparison table mentions competitors but not tracking competitors (Stape.io)

### Research Summary

**n8n Cloud Pricing (2026):**
- Starter: $24/mo (2,500 executions)
- Pro: $60/mo (10,000 executions)
- Business: $800/mo (40,000 executions)

**Stape.io Pricing (2026):**
- Free: 10K requests
- Pro: $17/mo (500K requests)
- Business: $83/mo (5M requests)
- Enterprise: custom
- Meta CAPI Gateway: $8/mo per pixel, Unlimited: $83/mo for 100 pixels

### Plan — Three Pricing Categories

We will create **3 pricing categories** on the Pricing page, each with its own tiered plans optimized for Bangladesh:

#### Category 1: Workflow Automation (existing plans, minor updates)
Keep existing 4 plans but update comparison table to show accurate current prices.

#### Category 2: NexusTrack — Server-Side Tracking
New plans benchmarked **40-60% below Stape.io** for Bangladesh market:

| Plan | Monthly (BDT) | ~USD | Events/mo | Destinations | Features |
|------|--------------|------|-----------|--------------|----------|
| Free | ৳0 | $0 | 10K | 2 | Basic pixel, GA4 |
| Starter | ৳508 | ~$4 | 500K | 5 | Cookie recovery, bot filter |
| Pro | ৳2,540 | ~$20 | 5M | 10 | PII anonymizer, geo enrichment, all transforms |
| Business | ৳6,350 | ~$50 | 25M | Unlimited | Multi-zone, dedicated IP, SLA |
| Enterprise | ৳12,700 | ~$100 | 100M+ | Unlimited | Custom, white-label, priority |

**vs Stape.io:** Pro at $17/mo gives 500K; our Pro at ~$20 gives 5M (10x more events).

#### Category 3: All-in-One Bundle (Nodes + Tracking)
Combined plans with discount (save 20-30% vs buying separately):

| Plan | Monthly (BDT) | Includes |
|------|--------------|----------|
| Starter Bundle | ৳1,905 | Starter Workflow + Starter Tracking |
| Pro Bundle | ৳6,350 | Pro Workflow + Pro Tracking |
| Enterprise Bundle | ৳25,400 | Enterprise Workflow + Business Tracking |

### Implementation Steps

**Step 1: Database — Insert new plan rows**
- Add 5 tracking plans + 3 bundle plans to the `plans` table with a new `category` field in the `features` JSON (e.g., `"plan_category": "tracking"` / `"bundle"`)
- No schema change needed — use `features` JSONB to store category

**Step 2: Update Pricing page UI**
- Add a **3-tab switcher** at the top: "Workflow Automation" | "Server-Side Tracking" | "All-in-One Bundle"
- Each tab shows its own set of plan cards filtered by `plan_category`
- Add tracking-specific feature lists (events/mo, destinations, transforms)
- Add a new comparison table for tracking: BiztoriBD vs Stape.io vs Google Cloud Run vs Addingwell

**Step 3: Update usage-based summary section**
- Add tracking-specific metrics: ৳0.0005/event, ৳15/destination/month
- Keep existing AI/execution/storage metrics

**Step 4: Update competitor comparison**
- Add tracking comparison table (BiztoriBD vs Stape.io vs Addingwell vs self-hosted GTM)
- Update workflow comparison with accurate n8n 2026 prices ($24/$60/$800)

**Step 5: Update SelectPlan page**
- Add the same tab switcher so users can select tracking or bundle plans during onboarding

### Files to Modify
- `src/pages/Pricing.tsx` — Major refactor with 3-tab layout, new comparison tables
- `src/pages/SelectPlan.tsx` — Add category filter for plan selection
- Database: INSERT new plan rows (tracking + bundle plans)

### Technical Details
- Plans filtered client-side using `features.plan_category` field
- No schema migration needed — leverages existing JSONB `features` column
- Pricing in BDT with USD equivalent shown in parentheses
- Yearly discount remains 20% across all categories

