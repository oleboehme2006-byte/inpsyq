# Phase 32: Staging Operationalization

## Overview
Makes staging a first-class, safe, production-like environment.

## Branch/Deploy Mapping
| Environment | Vercel Project | Branch | Domain |
|-------------|----------------|--------|--------|
| Production | inpsyq | `production` | www.inpsyq.com |
| Staging | inpsyq-staging | `main` | inpsyq-staging.vercel.app |

## Required Environment Variables (Staging)
```bash
# Core
APP_ENV=staging
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging

# Safety
EMAIL_PROVIDER=disabled
OPS_ALERTS_DISABLED=true

# Database
DATABASE_URL=<staging-branch-url>  # Must NOT match prod patterns

# Auth/Secrets
INTERNAL_ADMIN_SECRET=<unique-staging-secret>
INTERNAL_CRON_SECRET=<unique-staging-secret>
```

## Staging Safety Gates
File: `lib/env/stagingSafety.ts`

Enforced checks (hard fail if violated):
1. `NODE_ENV === 'production'`
2. `NEXT_PUBLIC_APP_ENV === 'staging'`
3. `EMAIL_PROVIDER !== 'resend'`
4. `DATABASE_URL` must NOT match production patterns
5. `DATABASE_URL` should contain "staging"

## Staging Wiring Endpoint
`GET /api/internal/diag/staging-wiring`

Returns (JSON):
- `app_env`, `node_env`, `next_public_app_env`
- `database_host_hash` (SHA256, first 16 chars)
- `email_provider_effective`
- `alerts_disabled`
- `safety.passed` + violations

## Verification Commands
```bash
# API verification
BASE_URL=https://inpsyq-staging.vercel.app \
INTERNAL_ADMIN_SECRET=xxx \
npm run verify:phase32:staging:api

# Chrome verification
BASE_URL=https://inpsyq-staging.vercel.app \
npm run verify:phase32:staging:chrome

# Both
npm run verify:phase32:staging
```

## Artifacts
Written to `artifacts/phase32/`:
- `staging_api.json` - API test results
- `staging_chrome.json` - Chrome test results
- `01_landing.png` ... `06_imprint.png` - Screenshots

## Files Added
- `lib/env/stagingSafety.ts`
- `app/api/internal/diag/staging-wiring/route.ts`
- `scripts/verify_phase32_staging_api.ts`
- `scripts/verify_phase32_staging_chrome.ts`
