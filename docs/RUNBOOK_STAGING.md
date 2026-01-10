# Staging Runbook

## Overview
Staging is a production-like environment for testing before deployment.

## Vercel Configuration
| Setting | Value |
|---------|-------|
| Project | inpsyq-staging |
| Branch | `main` |
| Domain | inpsyq-staging.vercel.app |

## Required Environment Variables
```bash
APP_ENV=staging
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
EMAIL_PROVIDER=disabled
OPS_ALERTS_DISABLED=true
DATABASE_URL=<staging-neon-branch-url>
INTERNAL_ADMIN_SECRET=<staging-specific>
INTERNAL_CRON_SECRET=<staging-specific>
```

## Safety Rules (Enforced)
1. **No real emails** - EMAIL_PROVIDER must be 'disabled'
2. **No prod DB** - DATABASE_URL must not match production patterns
3. **Alerts suppressed** - OPS_ALERTS_DISABLED=true

## Neon Database
- Create staging branch from main
- Staging branch URL contains "staging" in host or path
- Production branch: `ep-small-sea-ag0i6j4g`

## Verification
```bash
# Full staging verification
BASE_URL=https://inpsyq-staging.vercel.app \
INTERNAL_ADMIN_SECRET=xxx \
npm run verify:phase32:staging
```

## Troubleshooting

### "STAGING_UNSAFE_CONFIG" Error
Safety gate triggered. Check:
1. `EMAIL_PROVIDER` - should be 'disabled'
2. `DATABASE_URL` - should not match prod
3. `APP_ENV` - should be 'staging'
4. `NODE_ENV` - should be 'production'

### Wiring Check
```bash
curl -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  https://inpsyq-staging.vercel.app/api/internal/diag/staging-wiring
```

### Redeploy
1. Push to `main` branch
2. Vercel auto-deploys staging
3. Run verification commands

## Promotion to Production
See RUNBOOK_RELEASE.md
