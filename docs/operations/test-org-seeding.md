# Test Organization Seeding

## Overview

The test organization provides synthetic data for development, demos, and verification. It has a dedicated UUID that never collides with real organizations.

---

## Test Organization Details

| Property | Value |
|----------|-------|
| Org ID | `99999999-9999-4999-8999-999999999999` |
| Org Name | Test Organization |
| Admin Email | `oleboehme2006@gmail.com` |
| Teams | Alpha, Beta, Gamma (exactly 3) |
| Employees | 15 synthetic (5 per team) |

---

## API Endpoints

All endpoints require `INTERNAL_ADMIN_SECRET` authentication.

### 1. Ensure Test Org Exists

Creates or updates the test organization with admin user.

```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "ok": true,
  "data": {
    "orgId": "99999999-9999-4999-8999-999999999999",
    "userId": "...",
    "teamIds": ["...", "...", "..."]
  }
}
```

### 2. Seed Measurement Data

Creates synthetic measurement sessions and interpretations.

```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"weeks": 6}'
```

Response:
```json
{
  "ok": true,
  "data": {
    "sessionsCreated": 90,
    "responsesCreated": 1080,
    "interpretationsCreated": 24
  }
}
```

### 3. Check Status

```bash
curl https://www.inpsyq.com/api/internal/admin/test-org/status \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

Response:
```json
{
  "ok": true,
  "data": {
    "exists": true,
    "orgId": "99999999-9999-4999-8999-999999999999",
    "managedTeamCount": 3,
    "managedEmployeeCount": 15,
    "weekCount": 6,
    "sessionCount": 90,
    "interpretationCount": 24
  }
}
```

---

## Complete Seeding Workflow

```bash
# Set environment
export BASE_URL=https://www.inpsyq.com
export SECRET=$INTERNAL_ADMIN_SECRET

# Step 1: Ensure org exists
curl -X POST $BASE_URL/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $SECRET"

# Step 2: Seed data (6 weeks)
curl -X POST $BASE_URL/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"weeks": 6}'

# Step 3: Verify
curl $BASE_URL/api/internal/admin/test-org/status \
  -H "Authorization: Bearer $SECRET"
```

---

## Verification Script

```bash
BASE_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=$SECRET \
npx tsx scripts/verify/test-org.verify.ts
```

---

## Admin Login

After seeding, the admin user can log in:

1. Go to `https://www.inpsyq.com/login`
2. Enter `oleboehme2006@gmail.com`
3. Check email for magic link
4. Click link → redirected to admin dashboard

---

## Safety Guarantees

1. **Dedicated UUID**: Test org uses a fixed ID that cannot collide with real data
2. **Idempotent**: Seeding is safe to run multiple times
3. **Pruned to canonical state**: Always exactly 3 teams, 15 employees
4. **No fixture collision**: Never uses fixture IDs used in development
