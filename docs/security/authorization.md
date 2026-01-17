# Authorization (RBAC)

## Role Hierarchy

Roles are ordered by permission level:

```
ADMIN > EXECUTIVE > TEAMLEAD > EMPLOYEE
```

---

## Permission Matrix

| Resource | EMPLOYEE | TEAMLEAD | EXECUTIVE | ADMIN |
|----------|----------|----------|-----------|-------|
| Own session | ✅ | ✅ | ✅ | ✅ |
| Team dashboard | ❌ | Own team | All teams | All teams |
| Executive dashboard | ❌ | ❌ | ✅ | ✅ |
| Admin tools | ❌ | ❌ | ❌ | ✅ |
| Manage invites | ❌ | ❌ | ❌ | ✅ |
| System health | ❌ | ❌ | ❌ | ✅ |

---

## Membership Model

Each user has one or more memberships:

```
User ──┬── Membership 1 ──── Org A, Team X, TEAMLEAD
       └── Membership 2 ──── Org B, Team Y, EMPLOYEE
```

### Membership Fields

| Field | Description |
|-------|-------------|
| `user_id` | User reference |
| `org_id` | Organization |
| `team_id` | Team (optional) |
| `role` | ADMIN, EXECUTIVE, TEAMLEAD, EMPLOYEE |

---

## Organization Context

For multi-org users, the active organization is stored in a cookie (`org_id`).

### Organization Selection

1. User logs in
2. If single org: auto-select
3. If multi-org: redirect to `/org/select`
4. Selection stored in `org_id` cookie

---

## Guard Functions

Located in `lib/auth/guards.ts`:

### `requireRolesStrict(req, roles[])`

Ensures user has one of the specified roles.

```typescript
// Only ADMIN or EXECUTIVE
await requireRolesStrict(req, ['ADMIN', 'EXECUTIVE']);
```

### `requireTeamAccessStrict(req, teamId)`

Ensures user can access the specified team.

- EMPLOYEE: denied
- TEAMLEAD: only own team
- EXECUTIVE/ADMIN: any team in org

### `requireAdminStrict(req)`

Shorthand for `requireRolesStrict(req, ['ADMIN'])`.

---

## API Error Responses

All authorization failures return:

```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

Status codes:
- `401 Unauthorized`: No valid session
- `403 Forbidden`: Insufficient role

---

## Tenant Isolation

All data queries include organization scope:

```sql
-- Example: Team dashboard query
SELECT * FROM measurement_sessions
WHERE org_id = $1 AND team_id = $2
```

**Invariant**: A user can never access data from an organization where they have no membership.

---

## Testing Authorization

```bash
npx tsx scripts/verify/security.verify.ts
```

Verifies:
- Role ordering is correct
- Guards reject unauthorized access
- Tenant isolation is enforced
