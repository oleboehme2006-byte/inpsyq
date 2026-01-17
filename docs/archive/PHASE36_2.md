# Phase 36.2: Production Magic-Link Canonicalization

## Root Cause
**Magic link emails contained preview deployment URLs instead of production canonical domain.**

The `sendMagicLinkEmail` function was using `VERCEL_URL` (preview domain like `inpsyq-xxx.vercel.app`) instead of the canonical `https://www.inpsyq.com`.

## Fixes Applied

### A) Public Origin Module (`lib/env/publicOrigin.ts`)
- Single source of truth for email link origins
- Production: Always enforces `https://www.inpsyq.com`
- Staging: Uses `https://inpsyq-staging.vercel.app`
- Development: Uses `http://localhost:3000`

### B) Preview Email Kill Switch (`app/api/auth/request-link/route.ts`)
- `VERCEL_ENV=preview` → Email suppressed
- `APP_ENV=staging` → Email suppressed
- `EMAIL_PROVIDER=disabled` → Email suppressed
- Logs `EMAIL_SUPPRESSED` with reason

### C) Origin Validation
- Production routes validate origin on startup
- Returns `ORIGIN_MISCONFIGURED` error if wrong

### D) Diagnostic Endpoint (`/api/internal/diag/auth-origin`)
Returns:
- Computed origin and source
- VERCEL_ENV, APP_ENV, NODE_ENV
- Effective email provider
- Preview email disabled status

## Required Vercel Environment Variables

### Production
```
AUTH_BASE_URL=https://www.inpsyq.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### Preview
```
EMAIL_PROVIDER=disabled
```

### Staging
```
AUTH_BASE_URL=https://inpsyq-staging.vercel.app
EMAIL_PROVIDER=disabled
APP_ENV=staging
```

## Verification
```bash
npm run build          # ✅ Passed
npm run lint           # ✅ Passed
npm run preflight:prod # ✅ Complete
```

## Files Added/Modified
- `lib/env/publicOrigin.ts` (new)
- `app/api/internal/diag/auth-origin/route.ts` (new)
- `app/api/auth/request-link/route.ts` (modified)
- `services/email/transport.ts` (modified in Phase 36.1)
- `scripts/verify_phase36_2_prod_auth_origin.ts` (new)

## Verification Commands
```bash
# Check auth origin configuration
BASE_URL=https://www.inpsyq.com \
INTERNAL_ADMIN_SECRET=... \
npx tsx scripts/verify_phase36_2_prod_auth_origin.ts
```

## Post-Deployment Checklist
1. Set `AUTH_BASE_URL=https://www.inpsyq.com` in Vercel Production
2. Set `EMAIL_PROVIDER=disabled` in Vercel Preview
3. Deploy to production
4. Run verification script
5. Request magic link (should contain www.inpsyq.com)
