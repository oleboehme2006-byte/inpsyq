# Test Organization

## Purpose

The Test Organization provides isolated, deterministic test data for:
- Admin UI development
- Dashboard testing
- Integration verification
- Demo purposes

## Configuration

### Test Organization ID
```
TEST_ORG_ID = 99999999-9999-4999-8999-999999999999
```

This ID is **reserved** and must never be used for real organizations.

### Canonical Structure

| Entity | Count | Description |
|--------|-------|-------------|
| Teams | 3 | Alpha, Beta, Gamma |
| Employees per team | 5 | Synthetic test users |
| Total employees | 15 | All with `@test-org.local` emails |
| Weeks of data | 6+ | Seeded measurement data |

### Synthetic Employee Emails
```
employee-alpha-0@test-org.local ... employee-alpha-4@test-org.local
employee-beta-0@test-org.local  ... employee-beta-4@test-org.local
employee-gamma-0@test-org.local ... employee-gamma-4@test-org.local
```

## API Endpoints

All endpoints require `Authorization: Bearer {INTERNAL_ADMIN_SECRET}`.

### Ensure Organization

Creates the test org with admin user if it doesn't exist.

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
    "userId": "...",
    "teamIds": ["...", "...", "..."],
    "pruneReport": {
      "removedTeams": 0,
      "removedMemberships": 0,
      "ensuredTeams": 3,
      "ensuredEmployees": 15
    }
  }
}
```

### Seed Data

Generates synthetic measurement sessions, responses, and interpretations.

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
    "orgId": "99999999-9999-4999-8999-999999999999",
    "weeksSeeded": 6,
    "sessionsCreated": 90,
    "responsesCreated": 1080,
    "interpretationsCreated": 24
  }
}
```

### Check Status

Returns current state of test organization.

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
    "isCanonicalId": true,
    "totalTeamCount": 3,
    "managedTeamCount": 3,
    "totalEmployeeCount": 15,
    "managedEmployeeCount": 15,
    "weekCount": 6,
    "sessionCount": 90,
    "interpretationCount": 24
  }
}
```

## Idempotency

### Safe to Run Multiple Times
- `ensure` is idempotent: creates only if missing
- `seed` is idempotent: pre-deletes stale synthetic data before inserting

### Pre-Delete Safety
Only affects rows where:
- `user_id` is a canonical synthetic employee
- `week_start` matches seeding week

Never touches:
- Non-synthetic users
- Non-test organizations
- Data outside seeding window

## Admin User

The test organization includes an ADMIN membership for the operator:

```
Email: oleboehme2006@gmail.com
Role: ADMIN
Org: TEST_ORG_ID
```

This allows logging in via magic link to access the Admin UI.

## Local Development

For local testing without production API:

```bash
# Set environment
export EMAIL_PROVIDER=test
export DATABASE_URL=postgres://...

# Seed locally
npx tsx scripts/seed_dev.ts
```

## Verification

```bash
# Verify test org via script
npx tsx scripts/verification/test-org.verify.ts
```

## Cleanup

To reset test org completely:

```sql
-- Nuclear option (use with caution)
DELETE FROM weekly_interpretations WHERE org_id = '99999999-9999-4999-8999-999999999999';
DELETE FROM measurement_quality WHERE session_id IN (
  SELECT session_id FROM measurement_sessions 
  WHERE org_id = '99999999-9999-4999-8999-999999999999'
);
DELETE FROM measurement_responses WHERE session_id IN (
  SELECT session_id FROM measurement_sessions 
  WHERE org_id = '99999999-9999-4999-8999-999999999999'
);
DELETE FROM measurement_sessions WHERE org_id = '99999999-9999-4999-8999-999999999999';
DELETE FROM memberships WHERE org_id = '99999999-9999-4999-8999-999999999999';
DELETE FROM teams WHERE org_id = '99999999-9999-4999-8999-999999999999';
DELETE FROM orgs WHERE org_id = '99999999-9999-4999-8999-999999999999';
```

Then re-run `ensure` and `seed`.
