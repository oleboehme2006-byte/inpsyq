# Deployment Guide

## Branch Strategy

```
main (development) → staging (preview) → production (release)
```

All branches auto-deploy to Vercel:
- `main` → `inpsyq-staging.vercel.app`
- `production` → `www.inpsyq.com`

---

## Pre-Deployment Checklist

Before any production deployment:

```bash
# 1. Build locally
npm run build

# 2. Lint
npm run lint

# 3. Run verification scripts
npx tsx scripts/verify/production-smoke.verify.ts
```

---

## Staging Deployment

Staging deploys automatically when pushing to `main`:

```bash
git checkout main
git pull origin main
git push origin main
# Auto-deploys to staging
```

### Verify Staging

```bash
BASE_URL=https://inpsyq-staging.vercel.app \
INTERNAL_ADMIN_SECRET=$STAGING_SECRET \
npx tsx scripts/verify/production-smoke.verify.ts
```

---

## Production Deployment

### Step 1: Merge to Production Branch

```bash
git checkout production
git merge main
git push origin production
```

Vercel auto-deploys to `www.inpsyq.com`.

### Step 2: Verify Production

```bash
BASE_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=$PROD_SECRET \
npx tsx scripts/verify/production-smoke.verify.ts
```

### Step 3: Seed Test Organization (if needed)

```bash
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"

curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"weeks": 6}'
```

---

## Rollback Procedures

### Option 1: Git Revert

```bash
git checkout production
git revert HEAD
git push origin production
```

### Option 2: Vercel Instant Rollback

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select `inpsyq` project
3. Go to Deployments
4. Select previous successful deployment
5. Click "Instant Rollback"

---

## Environment Variables

### Production (Required)

| Variable | Value |
|----------|-------|
| `AUTH_BASE_URL` | `https://www.inpsyq.com` |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | (secret) |
| `INTERNAL_ADMIN_SECRET` | (secret) |
| `DATABASE_URL` | (Neon connection string) |

### Staging/Preview

| Variable | Value |
|----------|-------|
| `EMAIL_PROVIDER` | `disabled` |

---

## Post-Deployment Monitoring

1. **Check health endpoint**: `GET /api/internal/health/system`
2. **Verify public pages load**: `/`, `/login`, `/demo`
3. **Check Slack for alerts** (if configured)
4. **Verify weekly pipeline status** (admin dashboard)

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| On-call | `#ops` in Slack |
| Security | security@inpsyq.com |
