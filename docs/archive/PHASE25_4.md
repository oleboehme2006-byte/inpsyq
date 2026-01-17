# Phase 25.4: Landing Page & Demo Mode

## Overview
Built a production-grade landing page and deterministic demo experience.

## Pages Added

| Route | Purpose | Test Selectors |
|-------|---------|----------------|
| `/` | Landing page | `landing-page`, `landing-cta-login`, `landing-cta-demo` |
| `/demo` | Public demo | `demo-page`, `demo-mode-banner` |

## Landing Page Features
- Clear headline and subheadline
- 5 feature bullets with icons
- "Request Access" CTA → `/login`
- "View Demo" CTA → `/demo`
- Consistent dark theme with existing design

## Demo Mode
- **No auth required** — public access
- **Deterministic** — uses static mock data only
- **DEMO MODE banner** — clearly labeled
- **Two views**: Executive overview, Team detail
- **No real API calls** — works even if DB is down

## Demo Data Location
```
lib/demo/demoData.ts
```

Exports:
- `demoOrg` — sample org info
- `demoTeams` — 4 teams with health scores
- `demoWeeklyTrends` — 8-week trend data
- `demoWatchlist` — 3 watchlist items
- `demoInterpretations` — AI-style summaries
- `demoTeamDetail` — detailed team view data

## Analytics
Optional tracking via Plausible:
```
lib/analytics/track.ts
```

Only fires if `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set:
- `landing_view`
- `click_request_access`
- `click_view_demo`
- `demo_view`

## Verification

```bash
npm run build
npm run lint
npm run preflight:prod

# E2E (requires dev server on :3001)
npx tsx scripts/verify_phase25_4_landing_demo_e2e.ts
```

## RBAC Unchanged
Public pages never touch org data. Demo uses only static fixtures.
