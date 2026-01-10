# Phase 35.1: Server-Side Dashboard Gates

## Root Cause (from Phase 35)
The `next.config.mjs` contained a redirect: `/ → /executive` which caused the landing page to redirect to the executive dashboard.

**Fix applied in Phase 35:** Removed the redirect.

## Phase 35.1 Enhancement
Added server-side authentication gating to the dashboard layout to ensure:
1. Unauthenticated users accessing `/executive`, `/team/*` get redirected to `/login` server-side
2. No client-side error states ("Data Unavailable") are shown to unauthenticated users

## Changes Made

### 1. Removed redirect (Phase 35)
**File:** `next.config.mjs`
```javascript
// REMOVED:
async redirects() {
    return [{ source: '/', destination: '/executive', permanent: false }];
}
```

### 2. Added server-side auth gate (Phase 35.1)
**File:** `app/(dashboard)/layout.tsx`
```typescript
export default async function DashboardLayout({ children }) {
    const authResult = await resolveAuthContext();

    if (!authResult.authenticated || !authResult.context) {
        redirect(authResult.redirectTo || '/login');
    }

    if (authResult.context.role === 'EMPLOYEE') {
        redirect('/measure');
    }

    return <>{children}</>;
}
```

## Expected Behavior
| Route | Unauth Behavior | Auth Behavior |
|-------|-----------------|---------------|
| `/` | Landing page | Landing page |
| `/executive` | Redirect to `/login` | Render dashboard |
| `/team/*` | Redirect to `/login` | Render dashboard |
| `/admin/*` | Redirect to `/login` | Render admin |

## Verification
```bash
npm run build          # ✅ Passed
npm run lint           # ✅ Passed
npm run preflight:prod # ✅ Passed
```

## Deployment Required
Changes must be deployed to production. After deployment:
```bash
npm run verify:phase33:prod:chrome
```
