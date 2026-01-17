# Phase 35.2: Production Root Recovery

## Root Cause
Production (`https://www.inpsyq.com/`) returns **HTTP 307 Location: /executive** because:

**The code fix from Phase 35 has not been deployed to production yet.**

### Evidence
```bash
curl -I https://www.inpsyq.com/
# HTTP/2 307
# location: /executive
```

The redirect was removed from `next.config.mjs` in Phase 35, but the production branch still has the old code.

### Before (deployed)
```javascript
async redirects() {
    return [{ source: '/', destination: '/executive', permanent: false }];
}
```

### After (fixed in Phase 35)
```javascript
const nextConfig = {
    // No redirects - public landing page serves at /
};
```

## Changes in Phase 35.2

### 1. Build Diagnostic Endpoint
**File:** `app/api/internal/diag/build/route.ts`

Returns:
- `git_sha` (Vercel deployment commit)
- `git_ref` (branch)
- `app_env`, `node_env`, `vercel_env`

### 2. Production Chrome Verifier
**File:** `scripts/verify_phase35_2_prod_public_gate_chrome.ts`

Tests:
- 6 public pages with correct testids
- No banned text ("Data Unavailable", "Run pipeline")
- Auth redirects (/executive, /admin → /login)
- Console clean

### 3. NPM Script
```bash
npm run verify:phase35.2:prod:chrome
```

## Deployment Required
These changes must be deployed to production:

1. Merge changes to `production` branch
2. Wait for Vercel deployment
3. Verify:
```bash
# Check headers
curl -I https://www.inpsyq.com/

# Run Chrome verifier
BASE_URL=https://www.inpsyq.com npm run verify:phase35.2:prod:chrome
```

## Expected Results After Deployment
```bash
curl -I https://www.inpsyq.com/
# HTTP/2 200
# x-matched-path: /
```

## Files Changed
- `next.config.mjs` (Phase 35)
- `app/(dashboard)/layout.tsx` (Phase 35.1)
- `app/api/internal/diag/build/route.ts` (new)
- `scripts/verify_phase35_2_prod_public_gate_chrome.ts` (new)
