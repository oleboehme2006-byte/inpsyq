# Deployment

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Production | `production` | `https://www.inpsyq.com` | Live users |
| Staging | `main` (preview) | `https://inpsyq-staging.vercel.app` | Pre-release testing |
| Development | local | `http://localhost:3000` | Local development |

## Environment Variables

### Required (All Environments)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `INTERNAL_ADMIN_SECRET` | Admin API authentication |

### Production Only

| Variable | Value | Description |
|----------|-------|-------------|
| `AUTH_BASE_URL` | `https://www.inpsyq.com` | **Required, strictly enforced** |
| `EMAIL_PROVIDER` | `resend` | Enable real emails |
| `RESEND_API_KEY` | `re_...` | Resend API key |
| `APP_ENV` | `production` | Environment identifier |

### Preview/Staging

| Variable | Value | Description |
|----------|-------|-------------|
| `EMAIL_PROVIDER` | `disabled` | Suppress all emails |
| `APP_ENV` | `staging` | Environment identifier |

### Development

| Variable | Value | Description |
|----------|-------|-------------|
| `EMAIL_PROVIDER` | `test` | Write to `artifacts/email_outbox/` |
| `AUTH_BASE_URL` | `http://localhost:3000` | Local origin |

## Deployment Workflow

### Standard Release

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Run local verification
npm run build
npm run lint

# 3. Push to production
git checkout production
git merge main
git push origin production
```

### Vercel Auto-Deploy
- Push to `production` branch → Production deployment
- Push to `main` branch → Preview deployment
- Pull requests → Preview deployment per PR

## Pre-Deployment Checklist

- [ ] `npm run build` passes locally
- [ ] `npm run lint` passes
- [ ] Verification scripts pass
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied (if any)

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

### 2. Origin Diagnostics
```bash
curl https://www.inpsyq.com/api/internal/diag/auth-origin \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

### 3. Magic Link Test
Request login for known admin email and verify email received.

## Rollback

### Via Vercel Dashboard
1. Go to Vercel → Project → Deployments
2. Find last known-good deployment
3. Click "..." → "Promote to Production"

### Via Git
```bash
git checkout production
git revert HEAD
git push origin production
```

## Secrets Rotation

### INTERNAL_ADMIN_SECRET
1. Generate new secret: `openssl rand -base64 32`
2. Update in Vercel environment variables
3. Redeploy
4. Log rotation date in audit log

### RESEND_API_KEY
1. Generate new key in Resend dashboard
2. Revoke old key
3. Update in Vercel
4. Redeploy

## Build Configuration

### Vercel Settings
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 20.x

### next.config.mjs
Standard Next.js configuration. No special build flags required.
