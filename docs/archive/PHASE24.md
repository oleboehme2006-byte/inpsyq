# Phase 24: Strict Role-Based Access Control (RBAC)

## Overview
Phase 24 implements airtight server-side RBAC enforcement with organization selection for multi-org users.

## Role Permissions

| Role | Executive Dashboard | Team Dashboard | Admin Tools | Session |
|------|-------------------|----------------|-------------|---------|
| EMPLOYEE | ❌ | ❌ | ❌ | ✅ Own only |
| TEAMLEAD | ❌ | ✅ Own team only | ❌ | ✅ |
| EXECUTIVE | ✅ | ✅ Any team | ❌ | ✅ |
| ADMIN | ✅ | ✅ Any team | ✅ | ✅ |

## Key Changes

### Central Auth Context
- `lib/auth/context.ts` - Unified auth + org resolver
- Validates session, resolves org, returns role + team info

### Organization Selection
- `/org/select` - Page for multi-org users
- `/api/org/list` - List user's organizations
- `/api/org/select` - Select an organization (sets cookie)

### Guard Helpers (guards.ts)
- `requireRolesStrict(req, roles[])` - Enforce specific roles
- `requireTeamAccessStrict(req, teamId)` - TEAMLEAD: own team only
- `requireAdminStrict(req)` - ADMIN only

### Post-Login Routing (auth/consume)
- Single org: auto-select, redirect by role
- Multi-org: redirect to `/org/select`
- Role-based destinations:
  - ADMIN → `/admin`
  - EXECUTIVE → `/executive`
  - TEAMLEAD → `/team/[teamId]`
  - EMPLOYEE → `/session`

## API Enforcement

All APIs return strict JSON errors:
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

## Verification

```bash
npm run verify:phase24        # All tests
npm run verify:phase24:unit   # Role ordering, permissions
npm run verify:phase24:api    # API access matrix
```
