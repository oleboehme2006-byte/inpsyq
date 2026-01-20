# Admin & Test Org Runbook

## Overview

This runbook covers administration tasks for the InPsyq platform, focusing on test organization management and admin operations.

## Prerequisites

- `INTERNAL_ADMIN_SECRET` environment variable set
- Access to production URL (`https://www.inpsyq.com`)

---

## Manual Verification Checklist

After any deployment, verify critical admin functionality:

1. **Mint Login Link**:
   ```bash
   curl -X POST https://www.inpsyq.com/api/internal/admin/mint-login-link \
     -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
     -H "Content-Type: application/json"
   ```
   - Verify URL is `https://www.inpsyq.com/auth/consume?token=...`

2. **Login & Session**:
   - Open minted URL in private window
   - Confirm redirect to `/admin` or dashboard
   - Verify "Ole Böhme" user is logged in

3. **Test Org Visibility**:
   - Navigate to `/admin`
   - Confirm Test Org (ID `...9999`) is listed
   - Confirm 3 teams (Alpha, Beta, Gamma) exist
   - Confirm 15 employees exist

4. **Data Integrity**:
   - Check `/api/internal/admin/test-org/status` returns canonical counts


```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json"
```

**Expected Output**:
```json
{
  "ok": true,
  "data": {
    "orgId": "99999999-9999-4999-8999-999999999999",
    "teamIds": ["...", "...", "..."]
  }
}
```

### Step 2: Seed Test Data

```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"weeks": 6}'
```

**Expected Output**:
```json
{
  "ok": true,
  "data": {
    "sessionsCreated": 90,
    "interpretationsCreated": 24
  }
}
```

### Step 3: Verify Status

```bash
curl https://www.inpsyq.com/api/internal/admin/test-org/status \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

**Expected**:
- `managedTeamCount`: 3
- `managedEmployeeCount`: 15
- `weekCount`: ≥ 6

---

## Admin User Login

### Step 1: Request Magic Link

1. Go to `https://www.inpsyq.com/login`
2. Enter admin email: `oleboehme2006@gmail.com`
3. Click "Send Link"

### Step 2: Check Email

1. Check inbox for magic link
2. Click link within 15 minutes
3. Confirm on landing page

### Step 3: Access Admin UI

After login, navigate to:
- `/admin` — Admin dashboard
- `/admin/users` — User management
- `/admin/teams` — Team management

---

## User Management

### Add User to Organization

```sql
-- Via direct SQL (admin only)
INSERT INTO memberships (user_id, org_id, team_id, role)
VALUES ('user-uuid', '99999999-9999-4999-8999-999999999999', 'team-uuid', 'EMPLOYEE');
```

### Change User Role

```sql
UPDATE memberships 
SET role = 'TEAMLEAD' 
WHERE user_id = 'user-uuid' 
  AND org_id = '99999999-9999-4999-8999-999999999999';
```

### Remove User

```sql
DELETE FROM memberships 
WHERE user_id = 'user-uuid' 
  AND org_id = '99999999-9999-4999-8999-999999999999';
```

---

## Invite Management

### Create Invite

```bash
curl -X POST https://www.inpsyq.com/api/admin/invites \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "99999999-9999-4999-8999-999999999999",
    "email": "new.user@example.com",
    "role": "EMPLOYEE"
  }'
```

### List Active Invites

```bash
curl https://www.inpsyq.com/api/admin/invites?orgId=99999999-9999-4999-8999-999999999999 \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

---

## Troubleshooting

### Magic Link Not Working

1. Check `EMAIL_PROVIDER` is `resend` in production
2. Verify `RESEND_API_KEY` is set
3. Check origin diagnostics:
```bash
curl https://www.inpsyq.com/api/internal/diag/auth-request-link \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

### Test Org Seed Fails

1. Check status endpoint first
2. Look for duplicate key errors (idempotency should handle)
3. If persistent, run cleanup SQL then re-seed

### Admin Access Denied

1. Verify user has ADMIN role in test org
2. Check membership exists:
```sql
SELECT * FROM memberships 
WHERE org_id = '99999999-9999-4999-8999-999999999999' 
  AND role = 'ADMIN';
```
