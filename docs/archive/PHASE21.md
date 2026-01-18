# Phase 21: Make-It-Run + Real-Data-First Dashboards

## Summary
Phase 21 ensures reliable app startup, enforces Real-Data-First dashboard behavior with strict mock gating, and provides comprehensive verification.

## What Changed

### New Verification Scripts
| Script | Purpose |
|--------|---------|
| `verify_phase21_health_gate.ts` | Landing page + runtime endpoints |
| `verify_phase21_data_ready.ts` | Products + interpretations exist |
| `verify_phase21_auth.ts` | Cookie + header auth work |
| `verify_phase21_team_resolution.ts` | UUID + slug resolver |
| `verify_phase21_api.ts` | Dashboard APIs return data |
| `verify_phase21_browser.ts` | Playwright full-page validation |

### Package.json Scripts
```bash
npm run verify:phase21        # Run all sub-checks
npm run verify:phase21:health # Health gate only
npm run verify:phase21:data   # Data readiness only
npm run verify:phase21:auth   # Auth only
npm run verify:phase21:team   # Team resolution only
npm run verify:phase21:api    # API checks only
npm run verify:phase21:browser # Playwright browser test
```

## Mock Gating

**Default: Mocks OFF**

Mock data only activates when:
```bash
NEXT_PUBLIC_DASHBOARD_DEV_MOCKS=true
```

When mocks are active, dashboards display a "MOCK DATA" badge.

## Commands to Run

### Full Verification
```bash
# Start dev server
npm run dev

# In another terminal:
npm run verify:phase21
```

### Browser Verification (Real Mode)
```bash
npm run verify:phase21:browser
# Artifacts saved to: artifacts/phase21/real/
```

### Browser Verification (Mock Mode)
```bash
NEXT_PUBLIC_DASHBOARD_DEV_MOCKS=true npm run dev
# Then:
npm run verify:phase21:browser
# Artifacts saved to: artifacts/phase21/mock/
```

## Artifact Locations

| Mode | Path |
|------|------|
| Real | `artifacts/phase21/real/` |
| Mock | `artifacts/phase21/mock/` |
| Summary (Real) | `artifacts/phase21/summary.real.json` |
| Summary (Mock) | `artifacts/phase21/summary.mock.json` |

## Troubleshooting

See [RUNBOOK_PHASE21_MAKE_IT_RUN.md](./RUNBOOK_PHASE21_MAKE_IT_RUN.md) for common issues.
