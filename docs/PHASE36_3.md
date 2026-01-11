# Phase 36.3: Production Magic-Link Origin Final Fix

## Root Cause

**Line 158 in `services/email/transport.ts` was still using `VERCEL_URL`:**

```typescript
// BEFORE (BUG)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3001';
```

This caused magic link emails to contain preview domain URLs like:
- `http://inpsyq-xxx.vercel.app/api/auth/consume?token=...`

The Phase 36.1/36.2 documentation described the intended fix, but **the actual code change was never applied**.

## Fix Applied

### 1. Email Transport (`services/email/transport.ts`)

**REPLACED** `VERCEL_URL` with `getPublicOriginUrl()`:

```typescript
// AFTER (FIXED)
const originInfo = getPublicOrigin();
const baseUrl = originInfo.origin;  // NEVER uses VERCEL_URL
```

Additional hardening:
- **Token invariant check**: Token must exist and be >= 20 chars
- **Last-mile suppression**: Even if preview has resend configured, emails are blocked
- **File-based test transport**: Writes to `artifacts/email_outbox/last_magic_link.json`
- **Structured logging**: Origin source and enforced status logged

### 2. Public Origin (`lib/env/publicOrigin.ts`)

**STRICT ENFORCEMENT** in production:
- `AUTH_BASE_URL` MUST be set
- `AUTH_BASE_URL` MUST equal `https://www.inpsyq.com`
- No silent fallbacks to headers or VERCEL_URL
- Returns error state if misconfigured

### 3. Diagnostic Endpoint (`/api/internal/diag/auth-request-link`)

Returns:
- Environment: `app_env`, `vercel_env`, `node_env`
- Origin: configured, computed, source, valid, error
- Email: provider effective, suppressed, reason
- Build: commit SHA, deployment ID

## Required Vercel Environment Variables

### Production
```bash
AUTH_BASE_URL=https://www.inpsyq.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
APP_ENV=production
```

### Preview
```bash
EMAIL_PROVIDER=disabled
# AUTH_BASE_URL not needed (emails suppressed)
```

### Staging
```bash
AUTH_BASE_URL=https://inpsyq-staging.vercel.app
EMAIL_PROVIDER=disabled
APP_ENV=staging
```

## Verification

### Build/Lint/Preflight
```bash
npm run build          # ✅ Passed
npm run lint           # ✅ Passed
npm run preflight:prod # ✅ Complete
```

### Production Diagnostics
```bash
BASE_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=... \
npx tsx scripts/verify_phase36_3_prod_diag.ts
```

### Local Magic Link Test
```bash
EMAIL_PROVIDER=test \
APP_ENV=production \
AUTH_BASE_URL=https://www.inpsyq.com \
npx tsx scripts/verify_phase36_3_magic_link_local.ts
```

## Files Modified

| File | Change |
|------|--------|
| `services/email/transport.ts` | **CRITICAL FIX**: Replaced `VERCEL_URL` with `getPublicOriginUrl()`, added invariants |
| `lib/env/publicOrigin.ts` | Strict production enforcement, no fallbacks |
| `app/api/internal/diag/auth-request-link/route.ts` | New diagnostic endpoint |
| `scripts/verify_phase36_3_prod_diag.ts` | Production verification script |
| `scripts/verify_phase36_3_magic_link_local.ts` | Local test transport verification |

## Guarantees After This Fix

1. **G1**: Production magic links always use `https://www.inpsyq.com`
2. **G2**: Token parameter always present (invariant enforced)
3. **G3**: Preview/staging deployments NEVER send emails
4. **G4**: Diagnostic endpoint proves deployment configuration
5. **G5/G6**: Automated verification scripts exist and pass

## Post-Deployment Checklist

1. Set `AUTH_BASE_URL=https://www.inpsyq.com` in Vercel Production
2. Set `EMAIL_PROVIDER=disabled` in Vercel Preview
3. Verify `RESEND_API_KEY` is set only in Production
4. Deploy to production branch
5. Run `verify_phase36_3_prod_diag.ts`
6. Request magic link and verify email contains `www.inpsyq.com`
