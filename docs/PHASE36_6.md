# Phase 36.6: Build Fix — deleteSession Export

## Root Cause
The Vercel build failed because `app/api/auth/logout/route.ts` imported `deleteSession` from `@/lib/auth/session`, but that function was not exported from the module.

This was caused by the session.ts file being restored in Phase 36.5 without the `deleteSession` function that the logout route expected.

## Fix
Added the following exports to `lib/auth/session.ts`:

```typescript
export async function deleteSession(sessionToken: string): Promise<void>
export function generateSessionToken(): string
export function hashSessionToken(token: string): string
```

## Verification

### Local
```bash
npm run build        # ✓ Compiled successfully
npm run lint         # ✓ No ESLint warnings or errors
npx tsx scripts/verify_phase36_6_build_guard.ts  # ✓ BUILD GUARD PASSED
```

### Production (after deploy)
```bash
# Route checks
curl -I https://www.inpsyq.com/              # 200
curl -I https://www.inpsyq.com/auth/consume  # 200
curl -i https://www.inpsyq.com/api/auth/consume  # 405 GET

# Logout check
curl -X POST https://www.inpsyq.com/api/auth/logout  # { ok: true }
```

## Files Changed
- `lib/auth/session.ts` — Added `deleteSession`, `generateSessionToken`, `hashSessionToken`
- `scripts/verify_phase36_6_build_guard.ts` — New build guard script
