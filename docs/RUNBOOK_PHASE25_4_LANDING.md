# Phase 25.4 Landing & Demo Runbook

## Local Verification

### View Landing Page
```bash
npm run dev -- -p 3001
# Visit http://localhost:3001
```

Expected:
- InPsyq branding
- "Understand Your Team's Wellbeing" headline
- "Request Access" button → `/login`
- "View Demo" button → `/demo`
- 5 feature cards

### View Demo
```bash
# Visit http://localhost:3001/demo
```

Expected:
- Yellow "DEMO MODE" banner at top
- "Acme Industries" sample org
- Executive view by default
- Toggle to Team view
- Static data, no API calls

## Production Verification

### After Deploy
1. Visit production URL
2. Confirm landing page loads
3. Click "View Demo"
4. Confirm DEMO MODE banner visible
5. Check both Executive and Team views render

### Analytics (Optional)
If `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set:
- Check Plausible dashboard for events:
  - `landing_view`
  - `click_request_access`
  - `click_view_demo`
  - `demo_view`

## E2E Test
```bash
# Start dev server
npm run dev -- -p 3001

# Run E2E
npx tsx scripts/verify_phase25_4_landing_demo_e2e.ts

# Check artifacts
ls artifacts/phase25_4/
# landing_page.png, demo_page.png, summary.json
```

## Troubleshooting

### Landing page 404
Check that `app/(public)/page.tsx` exists and builds correctly.

### Demo data not showing
Demo page uses static imports from `lib/demo/demoData.ts` — no API calls needed.

### Analytics not tracking
- Verify `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set
- Check browser console for errors
- Plausible script may be blocked by ad blockers
