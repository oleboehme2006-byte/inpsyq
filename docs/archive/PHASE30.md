# Phase 30: Production Onboarding Hardening

## Overview
Ensures reliable production onboarding from ADMIN login to green dashboards.

## Key Improvements

### Week Offset Consistency
All weekly-related logic uses `week_offset=-1` (last completed week):
- `/api/admin/org/health` (default -1)
- `/api/admin/system/run-weekly` (called with -1 from setup)
- `/api/admin/setup/status` (uses -1 internally)

### Admin Setup Wizard (`/admin/setup`)
Steps A-E with clear status:
- **A: Org Selected** - Current org context
- **B: Teams Created** - Active team count
- **C: Access Configured** - Members + pending invites
- **D: Weekly Pipeline** - OK/degraded/missing counts, run button
- **E: Dashboards Ready** - Executive + sample team checks

### Verification Scripts

#### `verify_phase30_weekly_prod.ts`
- Checks admin health endpoint
- Verifies pipeline coverage
- Verifies interpretation coverage
- Outputs `artifacts/phase30/weekly_prod.json`

#### `verify_phase30_prod_smoke.ts`
- Browser-based validation
- Landing page: no banned text
- Demo page: banner visible
- Auth redirects work
- Admin health API responds
- Outputs `artifacts/phase30/prod_smoke.json`

## Usage

```bash
# Build and lint
npm run build
npm run lint

# Weekly verification (requires INTERNAL_ADMIN_SECRET)
INTERNAL_ADMIN_SECRET=xxx npx tsx scripts/verify_phase30_weekly_prod.ts

# Smoke test (requires server running)
npx tsx scripts/verify_phase30_prod_smoke.ts
```

## Banned Content on Public Pages
- "Data Unavailable"
- "Run pipeline"

## Idempotency
Re-running weekly for the same week:
- Skips if products already exist (unless forced)
- No duplicate aggregates created
- Safe to trigger multiple times

## Slack Alert Guards
- If `total_teams == 0`: No alert (configuration issue)
- Alerts use environment prefix from `getEnvLabel()`
- `[STAGING]` only when `APP_ENV=staging`
