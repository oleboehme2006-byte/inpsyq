# RUNBOOK: Access & RBAC

## Overview

InPsyq uses role-based access control (RBAC) with tenant scoping. Users have memberships in organizations with specific roles.

## Roles

| Role | Org Dashboard | Team Dashboard | Admin APIs | Session APIs |
|------|---------------|----------------|------------|--------------|
| ADMIN | ✅ | ✅ | Full access | Any user |
| EXECUTIVE | ✅ | ✅ | Read-only | Own user |
| TEAMLEAD | ❌ | ✅ | Read-only | Own user |
| EMPLOYEE | ❌ | ❌ | ❌ | Own user |

## Development Authentication

In development (`NODE_ENV=development`), pass:
```bash
X-DEV-USER-ID: <user_uuid>
```

**Never works in production.**

---

## Provisioning (Dev)

### 1. Create Org/Team/User

```bash
npm run seed:dev
npm run ids  # Get fixture IDs
```

### 2. Create Membership

Use the database directly or run:
```sql
INSERT INTO memberships (user_id, org_id, role)
VALUES ('<user_id>', '<org_id>', 'EXECUTIVE');
```

### 3. Create Invite (via API)

```bash
curl -X POST http://localhost:3001/api/access/invite \
  -H "Content-Type: application/json" \
  -H "X-DEV-USER-ID: <admin_user_id>" \
  -d '{
    "orgId": "<org_id>",
    "role": "TEAMLEAD",
    "teamId": "<team_id>"
  }'
```

### 4. Accept Invite

```bash
curl -X POST http://localhost:3001/api/access/accept-invite \
  -H "Content-Type: application/json" \
  -d '{
    "inviteToken": "<token_from_step_3>",
    "userId": "<target_user_id>"
  }'
```

### 5. Verify Membership

```bash
curl http://localhost:3001/api/access/whoami \
  -H "X-DEV-USER-ID: <user_id>"
```

---

## Verification

```bash
npx tsx scripts/verify_access.ts
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `401 UNAUTHORIZED` | Missing or invalid `X-DEV-USER-ID` | Check header in dev mode |
| `403 FORBIDDEN` | User lacks role/permission | Create membership with required role |
| `403 INVALID_TENANT` | User not in org | Add membership to org |
| `INVALID_TOKEN` | Malformed invite token | Regenerate token |
| `Token has expired` | Invite expired (72h default) | Create new invite |

---

## Integration Checklist

- [ ] Run `npm run seed:dev` to create fixtures
- [ ] Add memberships for test users
- [ ] Test `/api/access/whoami` returns expected role
- [ ] Verify forbidden routes return 403
