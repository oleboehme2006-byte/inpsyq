# Phase 26.0: Admin Onboarding Wizard

## Overview
Production-grade setup wizard that makes an org operational without manual DB work.

## New Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/admin/setup` | PAGE | Wizard UI with step-by-step checklist |
| `/api/admin/setup/status` | GET | Status of all onboarding steps |
| `/api/admin/system/run-weekly` | POST | Admin-triggered pipeline run |

## Setup Wizard Steps

| Step | Check | Status Mapping |
|------|-------|----------------|
| A. Org Selected | Cookie + valid membership | Always OK if page loads |
| B. Teams Created | ≥1 active team | CRITICAL if 0 |
| C. Access Configured | Members or invites exist | CRITICAL if none; AT_RISK if email disabled |
| D. Weekly Pipeline | Products/interpretations exist | CRITICAL if no products; AT_RISK if no interpretations |
| E. Dashboards Ready | Executive/Team APIs return data | CRITICAL if no data; AT_RISK if partial |

## Status Values
- **OK**: Step complete
- **AT_RISK**: Step partially complete or needs attention
- **CRITICAL**: Step blocking, requires immediate action

## Run Weekly Action
The "Run Weekly" button on Step D:
- Calls `/api/admin/system/run-weekly`
- Runs pipeline for selected org only
- Uses `week_offset=-1` (last completed week)
- Supports dry-run mode
- Writes audit event for tracking

### What It Does
1. Generates aggregates (`org_aggregates_weekly`)
2. Generates interpretations (`weekly_interpretations`)
3. Updates team health scores

### What It Does NOT Do
- Does NOT change any RBAC rules
- Does NOT redesign dashboards
- Does NOT bypass security guards

## Test Selectors
| Selector | Element |
|----------|---------|
| `admin-setup-page` | Page container |
| `setup-step-A` .. `setup-step-E` | Step cards |
| `setup-refresh` | Re-check button |
| `setup-run-weekly` | Run Weekly button |
| `setup-run-weekly-dryrun-toggle` | Dry-run checkbox |
| `setup-run-weekly-result` | Result display |

## Verification

```bash
npm run build
npm run lint
npm run preflight:prod

# With dev server on :3001
npx tsx scripts/verify_phase26_0_setup_status.ts
npx tsx scripts/verify_phase26_0_admin_setup_e2e.ts
```

## Security
- All routes require ADMIN role (`requireAdminStrict()`)
- Org resolved from session cookies (never from query params)
- No cron secrets exposed to browser
- Audit events logged for admin-triggered runs
