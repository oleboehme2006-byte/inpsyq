# Verification

This document describes the verification scripts and when to run them.

## Verification Philosophy

Verification scripts test **invariants** — properties that must always hold. They are:
- **Idempotent**: Safe to run multiple times
- **Independent**: Can be run in any order
- **Production-safe**: Read-only operations

## Script Location

All verification scripts are in `scripts/verification/`:

| Script | Purpose |
|--------|---------|
| `origin.verify.ts` | Public origin enforcement |
| `email.verify.ts` | Magic link generation |
| `schema.verify.ts` | Database schema invariants |
| `test-org.verify.ts` | Test organization state |
| `dashboard.verify.ts` | Dashboard data flow |
| `measurement.verify.ts` | Measurement layer logic |

## When to Run

### Before Production Deploy

```bash
npx tsx scripts/verification/origin.verify.ts
npx tsx scripts/verification/email.verify.ts
```

### After Seed Operations

```bash
BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=<secret> \
  npx tsx scripts/verification/test-org.verify.ts
```

### During Development

```bash
npx tsx scripts/verification/measurement.verify.ts
npx tsx scripts/verification/dashboard.verify.ts
```

## Script Details

### origin.verify.ts

**Tests**: Public origin resolution logic

**Invariants**:
- Production requires `AUTH_BASE_URL = https://www.inpsyq.com`
- Wrong production domain throws error
- Missing production domain throws error
- Staging respects `AUTH_BASE_URL`
- Preview falls back to `VERCEL_URL`

**Run**:
```bash
npx tsx scripts/verification/origin.verify.ts
```

### email.verify.ts

**Tests**: Magic link email generation

**Invariants**:
- Links point to `/auth/consume`
- Token is included in URL
- Origin matches canonical URL
- Test transport writes to outbox

**Run**:
```bash
npx tsx scripts/verification/email.verify.ts
```

### schema.verify.ts

**Tests**: Database schema correctness

**Invariants**:
- Required tables exist
- Primary keys correct
- Foreign keys intact
- Unique constraints present

**Run**:
```bash
BASE_URL=<url> INTERNAL_ADMIN_SECRET=<secret> \
  npx tsx scripts/verification/schema.verify.ts
```

### test-org.verify.ts

**Tests**: Test organization state

**Invariants**:
- `orgId = 99999999-9999-4999-8999-999999999999`
- `managedTeamCount = 3`
- `managedEmployeeCount = 15`
- `weekCount >= 6`
- `interpretationCount > 0`

**Run**:
```bash
BASE_URL=<url> INTERNAL_ADMIN_SECRET=<secret> \
  npx tsx scripts/verification/test-org.verify.ts
```

### dashboard.verify.ts

**Tests**: Dashboard data flow

**Invariants**:
- Team dashboard returns valid DTO
- Executive dashboard returns valid DTO
- Performance within targets

**Run**:
```bash
ORG_ID=<uuid> TEAM_ID=<uuid> \
  npx tsx scripts/verification/dashboard.verify.ts
```

### measurement.verify.ts

**Tests**: Measurement layer logic

**Invariants**:
- Evidence aggregation produces valid mean/sigma
- Consistency patterns detected correctly
- Governance flags applied

**Run**:
```bash
npx tsx scripts/verification/measurement.verify.ts
```

## Failure Interpretation

| Exit Code | Meaning |
|-----------|---------|
| 0 | All invariants hold |
| 1 | One or more invariants violated |

When a script fails:
1. Read the error message
2. Identify which invariant failed
3. Fix the root cause
4. Re-run verification

## Adding New Verifications

1. Create `scripts/verification/<name>.verify.ts`
2. Add header comment explaining invariants
3. Use `assert` for invariant checks
4. Exit with code 1 on failure
5. Document in this file
