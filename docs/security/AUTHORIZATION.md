# Authorization

## Role-Based Access Control (RBAC)

### Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| `ADMIN` | Organization | Full org management, user/team/invite management, view all data |
| `EXECUTIVE` | Organization | View org-wide dashboards and all team data |
| `TEAMLEAD` | Team | View team dashboard, own team's data only |
| `EMPLOYEE` | Self | Complete surveys, view own feedback |

### Role Hierarchy
```
ADMIN > EXECUTIVE > TEAMLEAD > EMPLOYEE
```

Higher roles inherit lower capabilities but scoping differs.

## Membership Model

Users have memberships to organizations with a role:

```sql
memberships (
  user_id,
  org_id,
  team_id,  -- Optional, for team-scoped roles
  role
)
```

### Constraints
- One membership per user per org: `UNIQUE(user_id, org_id)`
- TEAMLEAD and EMPLOYEE require `team_id`
- ADMIN and EXECUTIVE have `team_id = NULL`

## Route Protection

### Protected Routes
All routes except `/`, `/login`, and `/auth/*` require authentication.

### Middleware Flow
```
1. Extract session cookie
2. Validate session (not expired, not revoked)
3. Load user and memberships
4. Check route-specific authorization
5. Proceed or redirect to /login
```

### Role-Based Redirects After Login
| Role | Redirect |
|------|----------|
| ADMIN | `/admin` |
| EXECUTIVE | `/executive` |
| TEAMLEAD | `/team` |
| EMPLOYEE | `/employee` |

## API Authorization

### Pattern
```typescript
// Route handler
export async function GET(request: Request) {
  const session = await requireSession(request);
  const user = await getUser(session.userId);
  
  // Role check
  if (!hasRole(user, 'ADMIN', orgId)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Proceed...
}
```

### Admin API Endpoints
Routes under `/api/internal/admin/` require:
```
Authorization: Bearer {INTERNAL_ADMIN_SECRET}
```

This is for internal tooling, not user-facing.

## Team Isolation

### TEAMLEAD Access
- Can view only their assigned team's data
- Cannot view other teams in same org
- Team resolution via UUID or slug

### EMPLOYEE Access
- Can view only their own data
- Cannot view team aggregates or other employees

## Multi-Tenancy

### Organization Isolation
All queries include `org_id` filter. Users cannot access data from organizations they don't belong to.

### Test Organization
`TEST_ORG_ID = 99999999-9999-4999-8999-999999999999` is isolated for testing/demo purposes.

## Audit Trail

Role changes and access attempts are logged:
```
ROLE_CHANGED: actor changed user X from Y to Z
LOGIN_SUCCESS: user authenticated
LOGIN_FAILURE: failed attempt for email
```

See [AUDIT_LOGGING.md](./AUDIT_LOGGING.md) for details.
