# Phase 36.7: Seed Test Org + Admin Access

## Overview
Created infrastructure to seed a "Test Organization" with fake data for UX development without touching real customer data.

## Components

### Seed Engine (`lib/admin/seedTestOrg.ts`)
- `ensureTestOrgAndAdmin(email)` — Idempotent creation of org + admin user
- `seedTestOrgData(orgId, weeks, seed)` — Idempotent seeding of measurement data
- `getTestOrgStatus()` — Status check for dashboards

### Admin Endpoints (require INTERNAL_ADMIN_SECRET)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/internal/admin/test-org/ensure` | POST | Create org + admin |
| `/api/internal/admin/test-org/seed` | POST | Seed measurement data |
| `/api/internal/admin/test-org/status` | GET | Check data status |
| `/api/internal/admin/mint-login-link` | POST | Mint magic link for test admin |

### Data Created
- **Org**: "Test Organization"
- **Teams**: Alpha, Beta, Gamma (3 teams)
- **Employees**: 5 per team (15 total)
- **Weeks**: 6 weeks of measurement data
- **Sessions**: ~90 completed sessions
- **Interpretations**: Team + org-level per week

## Verification

### Setup (Production)
```bash
# 1. Ensure org and admin exist
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json"

# 2. Seed data
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"weeks": 6}'

# 3. Check status
curl https://www.inpsyq.com/api/internal/admin/test-org/status \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

### Scripts
```bash
# Seed verification
BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=... \
  npx tsx scripts/verify_phase36_7_seed_test_org.ts

# Browser admin flow
BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=... \
  npx tsx scripts/verify_phase36_7_prod_browser_admin_flow.ts
```

## Files Changed
- `lib/admin/seedTestOrg.ts` — Seed engine
- `app/api/internal/admin/test-org/ensure/route.ts`
- `app/api/internal/admin/test-org/seed/route.ts`
- `app/api/internal/admin/test-org/status/route.ts`
- `app/api/internal/admin/mint-login-link/route.ts`
- `scripts/verify_phase36_7_seed_test_org.ts`
- `scripts/verify_phase36_7_prod_browser_admin_flow.ts`
