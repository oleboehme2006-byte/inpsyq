# Phase 36.7b: Schema Compatibility Fix

## Root Cause
The `seedTestOrg.ts` was using incorrect table and column names:
- **Used**: `organizations.id`
- **Production**: `orgs.org_id`

This caused FK constraint violations when inserting teams.

## Changes Made

### 1. Schema Diagnostic Endpoint
- `GET /api/internal/diag/db-schema?table=<name>`
- Returns columns, primary keys, foreign keys
- Protected by `INTERNAL_ADMIN_SECRET`

### 2. Fixed seedTestOrg.ts
| Before | After |
|--------|-------|
| `SELECT id FROM organizations` | `SELECT org_id FROM orgs` |
| `INSERT INTO organizations (id, name)` | `INSERT INTO orgs (org_id, name)` |
| `existingOrg.rows[0].id` | `existingOrg.rows[0].org_id` |

Added FK verification check after org insert.

### 3. Verification Script
`scripts/verify_phase36_7b_schema_prod.ts`:
- Fetches schema for key tables
- Calls ensure/seed/status endpoints
- Verifies expected data counts

## Verification
```bash
npm run build        # ✓ Passed
npm run lint         # ✓ Passed
```

## Production Commands (after deploy)
```bash
BASE_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=xxx \
npx tsx scripts/verify_phase36_7b_schema_prod.ts
```

## Files Changed
- `lib/admin/seedTestOrg.ts` — Fixed schema references
- `app/api/internal/diag/db-schema/route.ts` — New diagnostic endpoint
- `scripts/verify_phase36_7b_schema_prod.ts` — New verification script
