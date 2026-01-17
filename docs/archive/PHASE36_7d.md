# Phase 36.7d: Deterministic Test Org Isolation

## Problem
Previous test org lookup by name caused collision with fixture orgs, resulting in incorrect counts (teamCount=5 instead of 3).

## Solution
1. **Dedicated TEST_ORG_ID**: `99999999-9999-4999-8999-999999999999`
2. **Canonical Prune**: Enforces exactly 3 teams + 15 employees
3. **Managed vs Total Counts**: Status reports both for clarity

## Constants
```typescript
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';
const CANONICAL_TEAM_NAMES = ['Alpha', 'Beta', 'Gamma'];
const EMPLOYEES_PER_TEAM = 5;
```

## Functions Added

### `pruneTestOrgToCanonical(orgId)`
- Deletes teams not in canonical list
- Deletes EMPLOYEE memberships not matching canonical emails
- Ensures canonical teams/employees exist
- Only operates on TEST_ORG_ID (safety)

### Enhanced `getTestOrgStatus()`
Returns:
- `totalTeamCount` / `managedTeamCount`
- `totalEmployeeCount` / `managedEmployeeCount`
- `isCanonicalId` flag

## Canonical Expectations
After `ensure` + `seed`:
- `orgId === "99999999-9999-4999-8999-999999999999"`
- `managedTeamCount === 3`
- `managedEmployeeCount === 15`
- `weekCount >= 6`
- `interpretationCount > 0`

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

## Files Changed
- `lib/admin/seedTestOrg.ts` — Complete rewrite with isolation + prune
- `scripts/verify_phase36_7b_schema_prod.ts` — Assert managed counts + TEST_ORG_ID
