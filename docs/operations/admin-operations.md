# Admin Operations

This document describes day-to-day admin operations: test org management, seeding, and admin access.

## Prerequisites

- `INTERNAL_ADMIN_SECRET` environment variable
- `curl` or equivalent HTTP client
- Access to target environment

## Test Organization Management

### Ensure Test Org Exists

```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "orgId": "99999999-9999-4999-8999-999999999999",
    "userId": "<admin-user-id>",
    "teamIds": ["<alpha-id>", "<beta-id>", "<gamma-id>"]
  }
}
```

### Seed Measurement Data

```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"weeks": 6}'
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "sessionsCreated": 90,
    "responsesCreated": 1350,
    "interpretationsCreated": 24
  }
}
```

### Check Test Org Status

```bash
curl https://www.inpsyq.com/api/internal/admin/test-org/status \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

**Response**:
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

## Admin Login

### Mint Magic Link

```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/mint-login-link \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email": "oleboehme2006@gmail.com"}'
```

**Response**:
```json
{
  "ok": true,
  "link": "https://www.inpsyq.com/auth/consume?token=..."
}
```

### Standard Login Flow

1. Go to https://www.inpsyq.com/login
2. Enter admin email
3. Check email for magic link
4. Click link and confirm

## Full Setup Workflow

### Initial Setup (New Environment)

```bash
export BASE_URL=https://www.inpsyq.com
export INTERNAL_ADMIN_SECRET=<secret>

# 1. Ensure test org
curl -X POST "$BASE_URL/api/internal/admin/test-org/ensure" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"

# 2. Seed data
curl -X POST "$BASE_URL/api/internal/admin/test-org/seed" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -d '{"weeks": 6}'

# 3. Verify
curl "$BASE_URL/api/internal/admin/test-org/status" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"

# 4. Login
# Go to $BASE_URL/login, enter admin email
```

### Re-seeding (Refresh Data)

The seed operation is idempotent. It will:
1. Delete existing synthetic sessions for the weeks being seeded
2. Create fresh sessions and responses
3. Create or update interpretations

```bash
curl -X POST "$BASE_URL/api/internal/admin/test-org/seed" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -d '{"weeks": 6, "seed": 42}'
```

The `seed` parameter ensures deterministic data generation.

## Expected Counts

| Entity | Expected |
|--------|----------|
| Teams | 3 (Alpha, Beta, Gamma) |
| Employees | 15 (5 per team) |
| Weeks | 6 |
| Sessions | ~90 (15 users × 6 weeks) |
| Interpretations | 24 (4 per week: 3 teams + 1 org) |

## Verification Scripts

```bash
# Test org seeding
BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=<secret> \
  npx tsx scripts/verification/test-org.verify.ts

# Schema verification
BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=<secret> \
  npx tsx scripts/verification/schema.verify.ts
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Wrong/missing secret | Check `INTERNAL_ADMIN_SECRET` |
| "Org not found" | Not ensured | Run ensure first |
| Low session count | Seed not run | Run seed |
| No interpretations | Seed incomplete | Re-run seed |
