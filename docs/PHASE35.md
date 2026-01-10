# Phase 35: Production Public Pages Recovery

## Root Cause
The landing page (`/`) was redirecting to `/executive` due to a misconfigured redirect in `next.config.mjs`:

```javascript
// BEFORE (broken)
async redirects() {
    return [{
        source: '/',
        destination: '/executive',
        permanent: false,
    }];
}
```

This caused unauthenticated visitors to see the executive dashboard's "Data Unavailable" error instead of the public landing page.

## Fix
Removed the redirect from `next.config.mjs`:

```javascript
// AFTER (fixed)
const nextConfig = {
    // No redirects - public landing page serves at /
};
```

## Affected File
- `next.config.mjs`

## Expected Behavior After Fix
| Route | Expected Content |
|-------|------------------|
| `/` | Landing page with CTA buttons |
| `/demo` | Demo mode with banner |
| `/login` | Login form |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/imprint` | Legal imprint |
| `/executive` (unauth) | Redirects to `/login` |
| `/admin` (unauth) | Redirects to `/login` |

## Verification
1. Build: ✅ Passed
2. Lint: ✅ Passed
3. Preflight: ✅ Passed

## Deployment Required
This fix requires deploying the change to production on Vercel. After deployment:
```bash
npm run verify:phase33:prod:chrome
```

## Evidence
Baseline Chrome test confirmed:
- `/` showed "Data Unavailable" error (dashboard)
- All other public pages worked correctly

Root cause: `next.config.mjs` redirect, not route collision.
