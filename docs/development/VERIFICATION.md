# Verification

## Philosophy

Verification scripts validate system invariants. They are:
- **Idempotent**: Safe to run multiple times
- **Independent**: No dependencies between scripts
- **Informative**: Clear pass/fail with diagnostic output

## Script Locations

| Directory | Purpose |
|-----------|---------|
| `scripts/verification/` | Core invariant verification |
| `scripts/verify_*.ts` | Legacy scripts (to be consolidated) |
| `scripts/archive/` | Historical scripts (reference only) |

## Core Verification Scripts

### Origin Verification
```bash
npx tsx scripts/verification/origin.verify.ts
```
Validates:
- `getPublicOrigin()` returns expected origin per environment
- Production strict enforcement works
- No VERCEL_URL leakage in production

### Test Organization Verification
```bash
npx tsx scripts/verification/test-org.verify.ts
```
Validates:
- Test org exists with correct ID
- 3 canonical teams (Alpha, Beta, Gamma)
- 15 synthetic employees
- Seeded weeks and interpretations

### Email Verification
```bash
npx tsx scripts/verification/email.verify.ts
```
Validates:
- Magic link generation uses canonical origin
- Token parameter present
- Test transport writes to outbox

## Running All Verification

```bash
# Quick check
npm run build
npm run lint

# Full verification
npx tsx scripts/verification/origin.verify.ts
npx tsx scripts/verification/test-org.verify.ts
npx tsx scripts/verification/email.verify.ts
```

## Environment Requirements

Scripts detect their environment:
- **Local**: Uses `http://localhost:3000` or env vars
- **CI**: Uses test database
- **Production**: Requires `BASE_URL` and `INTERNAL_ADMIN_SECRET`

### Example: Production Verification
```bash
BASE_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=xxx \
npx tsx scripts/verification/test-org.verify.ts
```

## Interpreting Results

### Pass
```
✅ All checks passed
```

### Fail
```
❌ Check failed: [specific check]
   Expected: [expected value]
   Actual: [actual value]
```

Review the diagnostic output to identify root cause.

## Writing New Verification Scripts

### Template
```typescript
#!/usr/bin/env npx tsx
/**
 * [Invariant Name] Verification
 * 
 * Validates:
 * - [Invariant 1]
 * - [Invariant 2]
 * 
 * Run:
 *   npx tsx scripts/verification/[name].verify.ts
 */

import { strict as assert } from 'node:assert';

async function main() {
  console.log('[name] Verification\\n');
  
  // Test 1
  console.log('Test 1: [description]');
  const result = await someCheck();
  assert.equal(result, expected, 'Error message');
  console.log('  ✅ Passed');
  
  console.log('\\n✅ All checks passed');
}

main().catch(e => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
```

### Guidelines
1. Use `assert` for invariant checks
2. Print clear pass/fail for each check
3. Exit with code 1 on failure
4. Include usage comments
5. No external dependencies beyond project

## CI Integration

Verification runs in GitHub Actions:
```yaml
- name: Verify
  run: |
    npm run build
    npm run lint
    npx tsx scripts/verification/origin.verify.ts
```
