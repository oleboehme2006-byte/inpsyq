# Release Runbook

## Overview
Production deployments follow a strict promotion flow.

## Branch Strategy
```
main (development) → staging (test) → production (release)
```

## Release Process

### 1. Pre-Release Checklist
- [ ] All tests pass locally (`npm run build && npm run lint`)
- [ ] Preflight passes (`npm run preflight:prod`)
- [ ] Staging verification passes
- [ ] No critical alerts in last 24h

### 2. Deploy to Staging
```bash
git checkout main
git pull origin main
# Changes auto-deploy to inpsyq-staging.vercel.app
```

### 3. Run Release Gate (Phase 33)
```bash
npm run release:gate
```
This verifies:
- Working tree clean
- On main branch
- Staging API healthy
- Staging pages reachable

### 4. Verify Staging (Phase 32)
```bash
BASE_URL=https://inpsyq-staging.vercel.app \
INTERNAL_ADMIN_SECRET=$STAGING_SECRET \
npm run verify:phase32:staging
```

### 4. Promote to Production
```bash
git checkout production
git merge main
git push origin production
# Vercel auto-deploys to www.inpsyq.com
```

### 5. Verify Production
```bash
PROD_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=$PROD_SECRET \
npx tsx scripts/verify_phase30_prod_smoke.ts
```

## Rollback

### Immediate Rollback
```bash
# Revert to previous commit
git checkout production
git revert HEAD
git push origin production
```

### Vercel Rollback
1. Go to Vercel dashboard
2. Select inpsyq project
3. Deployments → select previous deployment
4. Click "Instant Rollback"

## Post-Release
- [ ] Monitor Slack for alerts
- [ ] Check dashboard loads
- [ ] Verify weekly pipeline status

## Emergency Contacts
| Role | Contact |
|------|---------|
| On-call | @on-call in Slack |
| Security | security@inpsyq.com |
