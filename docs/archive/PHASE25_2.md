# Phase 25.2: Admin Teams & Ops Visibility

## Overview
Implemented Teams CRUD management and operational visibility pages for admin.

## New/Updated APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/teams` | List org teams |
| POST | `/api/admin/teams` | Create team |
| PATCH | `/api/admin/teams` | Rename/archive team |
| GET | `/api/admin/org/health` | Coverage snapshot |
| GET | `/api/admin/system/weekly` | Weekly runs history |
| GET | `/api/admin/system/alerts` | Stored + computed alerts |

## Admin Pages

### /admin/teams
- Create team form
- Teams table with rename/archive actions
- Test selectors: `admin-teams-page`, `teams-table`, `team-create-name`, `team-create-submit`

### /admin/org/health
- Coverage snapshot for week_offset=-1
- OK/degraded/failed team counts
- Coverage progress bar
- Test selectors: `admin-org-health-page`, `target-week-start`

### /admin/system/weekly
- Weekly runs history table
- Status badges (COMPLETED/FAILED/RUNNING)
- Error preview for failed runs
- Test selectors: `admin-weekly-page`, `weekly-runs-table`

### /admin/system/alerts
- Combined stored + computed alerts
- Severity badges
- COVERAGE_GAP diagnostics included
- Test selectors: `admin-alerts-page`, `alerts-table`

## Verification

```bash
npm run build
npm run lint
npm run preflight:prod
```

## RBAC Unchanged
All APIs use existing `requireAdminStrict()` guard. No RBAC rules were changed.
