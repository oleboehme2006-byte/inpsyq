# Phase 36.7a: SQL Parameter Fix

## Root Cause
The production endpoint `/api/internal/admin/test-org/ensure` failed with:
```
bind message supplies 3 parameters, but prepared statement requires 2
```

**Location**: `lib/admin/seedTestOrg.ts` line 101

**Bug**: INSERT statement had 2 placeholders but 3 parameters were passed:
```typescript
// BEFORE (wrong)
await query(
    `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, 'ADMIN')`,
    [userId, orgId, 'ADMIN']  // 3 params, but only $1, $2 in SQL
);
```

## Fix
Changed SQL to use all 3 placeholders:
```typescript
// AFTER (correct)
await query(
    `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, $3)`,
    [userId, orgId, 'ADMIN']  // 3 params matching $1, $2, $3
);
```

## Guard Script
Created `scripts/verify_phase36_7a_sql_param_guard.ts` to validate SQL placeholder counts.

## Verification
```bash
npm run build        # ✓ Passed
npm run lint         # ✓ Passed
npx tsx scripts/verify_phase36_7a_sql_param_guard.ts  # ✓ All tests passed
```

## Production Verification (after deploy)
```bash
# Ensure
curl -X POST "$BASE_URL/api/internal/admin/test-org/ensure" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"

# Seed
curl -X POST "$BASE_URL/api/internal/admin/test-org/seed" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -d '{"weeks":6}'

# Status
curl "$BASE_URL/api/internal/admin/test-org/status" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

## Files Changed
- `lib/admin/seedTestOrg.ts` — Fixed SQL placeholder mismatch
- `scripts/verify_phase36_7a_sql_param_guard.ts` — New validation script
