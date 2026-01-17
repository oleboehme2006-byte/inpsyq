# Phase 33: Release Promotion & Production Validation Gates

## Overview
Makes promotion from staging to production safe, deterministic, and verifiable.

## What Phase 33 Guarantees
- Promotion blocked unless staging is healthy
- Every production deploy is browser-validated
- All public pages verified in Chrome
- Auth redirects work correctly
- No console errors in production

## What Phase 33 Does NOT Guarantee
- Zero downtime deployments
- Rollback automation
- Performance benchmarks
- Database migrations

## Release Promotion Flow
```
main (staging) → verify → production
```

## Commands

### Pre-Promotion Gate
```bash
npm run release:gate
```
Checks:
1. Working tree is clean
2. On main branch
3. main is ahead of production
4. Staging API is healthy
5. Staging public pages reachable

### Production Chrome Verification
```bash
npm run verify:phase33:prod:chrome
```
Tests:
- Public pages: /, /demo, /login, /privacy, /terms, /imprint
- Auth redirects: /executive, /admin, /employee/session
- Demo mode banner
- Console errors

## Artifacts
- `artifacts/phase33/release_gate.json`
- `artifacts/phase33/prod_chrome.json`
- `artifacts/phase33/prod_*.png` (screenshots)

## Full Promotion Procedure
```bash
# 1. Verify staging
npm run verify:phase32:staging

# 2. Run release gate
npm run release:gate

# 3. If gate passes, promote
git checkout production
git merge main
git push origin production

# 4. Verify production
npm run verify:phase33:prod:chrome
```

## Files Added
- `scripts/release/promote_to_production.ts`
- `scripts/verify_phase33_prod_chrome.ts`
