# Phase 25.3: Employee Session Flow

## Overview
Made the EMPLOYEE session flow production-ready with auth integration, autosave, and E2E verification.

## New/Updated APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/session/status` | Check session status for current week |
| POST | `/api/session/start` | Start new session (existing, hardened) |
| POST | `/api/session/submit` | Submit session responses (existing) |

## Session Status API Response
```json
{
  "hasActive": false,
  "isSubmitted": true,
  "weekStart": "2026-01-06",
  "draft": null
}
```

## Employee Session Page (`/employee/session`)

### UI States
- **Loading**: Initial check for session status
- **Ready**: Start Session CTA
- **Active**: Question view with progress bar
- **Submitting**: Spinner during submit
- **Complete**: Success confirmation
- **Error**: Retry option

### Features
- Auth-integrated (uses cookie session)
- Autosave to localStorage
- Progress indicator (3/10 format)
- Progress bar visualization
- Disabled submit during processing

### Test Selectors
| Selector | Purpose |
|----------|---------|
| `session-page` | Page container |
| `session-start` | Start Session button |
| `session-question-{index}` | Question container |
| `session-next` | Next button |
| `session-submit` | Submit button (last question) |
| `session-success` | Success state |
| `session-error` | Error state |
| `session-progress` | Progress indicator |

## Org Health Submissions Count
Added `submissions7d` to `/api/admin/org/health` response:
- Count of completed sessions in last 7 days
- Joins sessions with memberships to filter by org

## Week Start Calculation
Uses "last completed week" pattern:
- Monday of the previous week (UTC)
- Consistent with weekly runner expectations

## Verification
```bash
npm run build
npm run lint
npm run preflight:prod
```

## RBAC Unchanged
- Employee layout enforces EMPLOYEE role via `resolveAuthContext()`
- Other roles redirected to their appropriate pages
- No changes to existing auth guards
