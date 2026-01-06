# Phase 25.1: Admin Invites & Members

## Overview
Implemented admin functionality for managing invites and members.

## New APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/members` | List org members |
| PATCH | `/api/admin/members` | Update member role/team |
| GET | `/api/admin/invites` | List pending invites |
| POST | `/api/admin/invites` | Create invite |
| POST | `/api/admin/invites/revoke` | Revoke invite |
| GET | `/api/admin/teams` | List org teams |

## Role-Team Consistency Rules

| Role | Team Required |
|------|---------------|
| EMPLOYEE | null |
| TEAMLEAD | **required** |
| EXECUTIVE | null |
| ADMIN | null |

These rules are enforced in both APIs (server-side) and UI.

## Admin Pages

### /admin/invites
- Create invite form (email, role, team)
- Pending invites table
- Revoke action

### /admin/users
- Members table with role badges
- Inline role editing
- Team selection for TEAMLEAD
- "Last admin" protection

## Test Selectors

| Page | Selector |
|------|----------|
| Invites page | `admin-invites-page` |
| Email input | `invite-email` |
| Role select | `invite-role` |
| Team select | `invite-team` |
| Submit button | `invite-submit` |
| Invites table | `invites-table` |
| Users page | `admin-users-page` |
| Members table | `members-table` |
| Member row | `member-row-{userId}` |
| Save button | `member-save-{userId}` |

## Verification

```bash
# Build + Lint + Preflight
npm run build
npm run lint
npm run preflight:prod

# E2E Test (requires dev server on :3001)
npm run dev -- -p 3001
npx tsx scripts/verify_phase25_1_admin_e2e.ts
```

## RBAC Unchanged
All admin APIs use existing `requireAdminStrict()` guard. No RBAC rules were changed.
