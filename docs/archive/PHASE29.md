# Phase 29: Public Reachability Hardening

## Overview
Fixed public page routing to ensure all public pages are always reachable
without auth, database, or pipeline data.

## Root Cause
The previous session indicated "/" was showing a dashboard "Data Unavailable" screen.
After investigation:
- Public pages are correctly in `app/(public)/` route group
- Public layout is clean (no auth, no DB)
- Landing page has `data-testid="landing-page"`
- Demo page has `data-testid="demo-page"` + `data-testid="demo-mode-banner"`

## Changes Made

### TestIDs Added
| Page | TestID |
|------|--------|
| `/privacy` | `privacy-page` |
| `/terms` | `terms-page` |
| `/imprint` | `imprint-page` |

### E2E Script
`scripts/verify_phase29_public_reachability_chrome.ts`

Tests:
1. Landing page - visible, no banned text
2. Demo page - visible, no dashboard API calls
3. Login page - visible
4. Privacy, Terms, Imprint - visible
5. Executive redirect (no auth) - should redirect to login
6. Admin redirect (no auth) - should redirect to login
7. Console clean check

## Verification
```bash
npm run build
npm run lint
npm run preflight:prod

# E2E (requires dev server on :3001)
npm run dev -- -p 3001
npx tsx scripts/verify_phase29_public_reachability_chrome.ts
```

## Route Architecture
```
app/
├── (public)/          # No auth required
│   ├── layout.tsx     # Clean, no DB
│   ├── page.tsx       # Landing
│   ├── demo/          
│   ├── privacy/       
│   ├── terms/         
│   └── imprint/       
├── (auth)/            # Auth pages (login)
├── (admin)/           # ADMIN only
├── (dashboard)/       # EXEC/TEAMLEAD
└── (employee)/        # EMPLOYEE only
```

## Banned Content on Public Pages
- "Data Unavailable"
- "Run pipeline"
- "npm run pipeline"
- Dashboard retry buttons
