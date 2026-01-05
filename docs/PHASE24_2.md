# Phase 24.2: Admin Page Gates & Browser E2E

## Overview
Phase 24.2 completes RBAC with server-side admin page gates and stable test selectors.

## Changes

### Admin Page Gate
- Created `app/(admin)/layout.tsx` with server-side ADMIN-only enforcement
- Uses `resolveAuthContext()` to validate session + org + role
- Non-ADMIN users redirected to their role home:
  - EXECUTIVE → `/executive`
  - TEAMLEAD → `/team/<teamId>`
  - EMPLOYEE → `/session`
- No org selected → `/org/select`
- Not authenticated → `/login`

### Test Selectors Added

| Page | Selector |
|------|----------|
| `/login` | `data-testid="login-email"`, `login-submit`, `login-success` |
| `/org/select` | `data-testid="org-select-page"`, `org-option` |
| `/session` | `data-testid="session-page"` |
| `/executive` | `data-testid="org-title"` (exists) |
| `/team/[teamId]` | `data-testid="team-title"` (exists) |
| `/admin/*` | `data-testid="admin-home"` |

## Verification

```bash
npm run verify:phase24.1        # API matrix tests
npm run preflight:prod          # Full preflight
```

## Access Matrix

| Role | /admin | /executive | /team/<own> | /team/<other> |
|------|--------|------------|-------------|---------------|
| EMPLOYEE | Redirect→/session | Redirect | N/A | N/A |
| TEAMLEAD | Redirect→/team | Redirect | ✅ | Redirect |
| EXECUTIVE | Redirect→/executive | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ |
