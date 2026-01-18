# Deployment

This document describes how to build, deploy, and configure InPsyq environments.

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://www.inpsyq.com | Live customer data |
| Staging | https://staging.inpsyq.com | Pre-production testing |
| Preview | `*.vercel.app` | Branch deployments |
| Local | http://localhost:3000 | Development |

## Environment Variables

### Required (All Environments)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for LLM |

### Required (Production)

| Variable | Value |
|----------|-------|
| `AUTH_BASE_URL` | `https://www.inpsyq.com` |
| `RESEND_API_KEY` | Resend email API key |
| `INTERNAL_ADMIN_SECRET` | Admin API secret |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_PROVIDER` | `disabled` | `resend`, `disabled`, `test` |
| `APP_ENV` | (inferred) | `production`, `staging` |
| `OPS_ALERTS_DISABLED` | `false` | Disable monitoring alerts |

## Build Process

### Local Build

```bash
npm install
npm run build
```

### Vercel Build

Automatic on push to:
- `main` → Staging
- `production` → Production

## Deployment Checklist

### Before Production Deploy

1. **Build passes locally**: `npm run build`
2. **Lint passes**: `npm run lint`
3. **Verification scripts pass**: `npx tsx scripts/verification/origin.verify.ts`
4. **Staging validated**: Manual smoke test on staging

### Production Deploy

```bash
git checkout production
git merge main
git push origin production
```

### Post-Deploy Verification

```bash
# 1. Health check
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"

# 2. Public page check
curl -I https://www.inpsyq.com/

# 3. Auth origin check
curl https://www.inpsyq.com/api/internal/diag/auth-origin \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

## Production Invariants

| Invariant | Enforcement |
|-----------|-------------|
| `AUTH_BASE_URL = https://www.inpsyq.com` | Hard error if wrong |
| `EMAIL_PROVIDER = resend` | Default for production |
| No preview domain in emails | Origin enforcement |
| No demo banners | APP_ENV check |

## Rollback Procedure

```bash
# 1. Identify last good commit
git log --oneline production

# 2. Force push to previous commit
git push origin <commit>:production --force

# 3. Verify rollback
curl -I https://www.inpsyq.com/
```

## Secrets Rotation

### Internal Admin Secret

1. Generate new secret: `openssl rand -base64 32`
2. Update in Vercel dashboard
3. Redeploy
4. Update local `.env` files

### Resend API Key

1. Generate new key in Resend dashboard
2. Update in Vercel dashboard
3. Redeploy
4. Test with magic link

## Database

### Connection

- Provider: Neon PostgreSQL
- Pooling: Via connection string
- SSL: Required

### Migrations

No automated migration system. Schema changes via:
1. Manual SQL scripts in `scripts/`
2. Run against staging first
3. Run against production after validation

## Monitoring

### Health Endpoint

```bash
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

Returns:
- Database connectivity
- Lock status
- Pipeline coverage
- Interpretation coverage
