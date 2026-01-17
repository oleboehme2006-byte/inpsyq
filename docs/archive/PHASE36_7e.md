# Phase 36.7e: Seed Idempotency Under Global Uniqueness

## Root Cause
`measurement_sessions` has a global unique constraint on `(user_id, week_start)`.

This means a user can only have ONE session per week, regardless of org. When seeding the test org, synthetic employees may already have sessions from prior seeding attempts, causing `INSERT` to fail with duplicate key violation.

## Solution: Safe Pre-Delete
Before inserting sessions for each week, delete any existing sessions for **synthetic employees only**.

### Safety Guarantees
- Only deletes rows where `user_id` is in canonical synthetic set
- Only affects weeks being seeded
- Never touches non-synthetic users
- Never touches other orgs' data

### Canonical Synthetic Employees
```
employee-alpha-0@test-org.local ... employee-alpha-4@test-org.local
employee-beta-0@test-org.local  ... employee-beta-4@test-org.local
employee-gamma-0@test-org.local ... employee-gamma-4@test-org.local
```
(15 total)

## Code Flow
```
1. Get syntheticUserIds from canonical emails
2. For each weekStart:
   a. DELETE measurement_quality WHERE session_id IN (stale sessions)
   b. DELETE measurement_responses WHERE session_id IN (stale sessions)
   c. DELETE measurement_sessions WHERE user_id IN (synthetic) AND week_start = weekStart
   d. INSERT new sessions, responses, quality
```

## Verification
```bash
npm run build        # ✓ Passed
npm run lint         # ✓ Passed
```

## Production Commands
```bash
BASE_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=xxx \
npx tsx scripts/verify_phase36_7b_schema_prod.ts
```

## Security Note
> [!CAUTION]
> **Rotate `INTERNAL_ADMIN_SECRET` after any exposure.**
> Document rotation date in audit log.

## Files Changed
- `lib/admin/seedTestOrg.ts` — Added pre-delete for synthetic employees
- `lib/env/publicOrigin.ts` — Fixed missing module (unrelated)
