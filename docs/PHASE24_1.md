# Phase 24.1: RBAC Completion

## Overview
Phase 24.1 completes the RBAC implementation by adding ADMIN-only gates to all admin routes and APIs.

## Changes

### Admin API Gates
All `/api/admin/*` routes now enforce ADMIN-only access:

| Route | Guard |
|-------|-------|
| `/api/admin/employees` | `requireAdminStrict` |
| `/api/admin/weekly` | `requireAdminStrict` |
| `/api/admin/employee-profile` | `requireAdminStrict` |
| `/api/admin/profiles` | `requireAdminStrict` |
| `/api/admin/audit/team-contributions` | `requireAdminStrict` |
| `/api/admin/executive-dashboard` | `requireAdminStrict` |
| `/api/admin/team-dashboard` | `requireAdminStrict` |
| `/api/admin/_brief` | `requireAdminStrict` |
| `/api/admin/_decision` | `requireAdminStrict` |

### Error Format
All admin APIs return strict JSON errors:
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED" | "FORBIDDEN",
    "message": "..."
  }
}
```

## Verification

```bash
npm run verify:phase24.1        # Full Phase 24.1 suite
npm run verify:phase24.1:api    # Admin API matrix only
```

## Access Matrix

| Role | /api/admin/* | /api/dashboard/executive | /api/dashboard/team |
|------|--------------|-------------------------|---------------------|
| EMPLOYEE | 403 | 403 | 403 |
| TEAMLEAD | 403 | 403 | 200 (own team) |
| EXECUTIVE | 403 | 200 | 200 (any team) |
| ADMIN | 200 | 200 | 200 (any team) |
