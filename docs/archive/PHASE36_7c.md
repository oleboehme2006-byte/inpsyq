# Phase 36.7c: API Contract Fix

## Root Cause
Response contract mismatch between endpoints and verifier script:

| Endpoint | Was Returning | Verifier Reading |
|----------|--------------|------------------|
| ensure | `{ ok, orgId, ... }` | `data.result?.orgId` |
| seed | `{ ok, ...result }` | `data.result?.*` |
| status | `{ ok, ...status }` | `data.status` |

## Solution
Standardized all endpoints to follow the contract:

**Success:**
```json
{ "ok": true, "data": { ... } }
```

**Error:**
```json
{ "ok": false, "error": { "code": "...", "message": "..." } }
```

## Changes Made

### 1. Endpoint Updates
- `ensure/route.ts`: Returns `{ ok: true, data: { orgId, userId, teamIds } }`
- `seed/route.ts`: Returns `{ ok: true, data: { orgId, weeksSeeded, ... } }`
- `status/route.ts`: Returns `{ ok: true, data: { exists, orgId, teamCount, ... } }`

All error responses now use structured `{ code, message }` format.

### 2. Verifier Script Updates
- Reads from `body.data.orgId` instead of `body.result?.orgId`
- Added invariant checks (fail if `data.orgId` is undefined when `ok=true`)
- Added raw response logging to artifacts
- Artifacts saved to `artifacts/phase36_7c/`

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
- `app/api/internal/admin/test-org/ensure/route.ts` — Added `data` wrapper
- `app/api/internal/admin/test-org/seed/route.ts` — Added `data` wrapper
- `app/api/internal/admin/test-org/status/route.ts` — Added `data` wrapper
- `scripts/verify_phase36_7b_schema_prod.ts` — Fixed field paths, added invariants
