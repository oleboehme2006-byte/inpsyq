# Phase 24.4: Fix Coverage Gap Alerts

## Root Cause Analysis

**Root Cause: RC3 — Wrong week computation**

The `checkSystemAlerts()` function was calling `getGlobalHealthSnapshot(0)`, which computed the target week as the **current week in progress**. However, the weekly runner (scheduled Monday 02:00 UTC) processes and stores data for the **previous week**.

This means:
- From Tuesday through Sunday, the health check looked for data that wouldn't exist until the next Monday
- Result: 100% failure rate = COVERAGE_GAP alert every hour

## Fix Applied

Changed `services/ops/alerting.ts`:
```diff
- const snapshot = await getGlobalHealthSnapshot(0); // Current week
+ const snapshot = await getGlobalHealthSnapshot(-1); // Previous completed week
```

Also enhanced the COVERAGE_GAP alert to include diagnostic details:
- `target_week_start` — which week is being checked
- `total_teams`, `missing_teams`, `ok_teams`, `degraded_teams`
- `missing_products`, `missing_interpretations`

## Verification

```bash
# Run production diagnostic
npm run verify:phase24.4:prod

# Check artifacts
cat artifacts/phase24_4/prod_health.json
```

## Expected Outcome

After this fix:
- `getGlobalHealthSnapshot(-1)` checks last Monday's data
- Weekly runner produces data for last Monday
- Coverage should be ~100% (assuming runner succeeded)
- COVERAGE_GAP alerts should stop

## Files Changed

| File | Change |
|------|--------|
| `services/ops/alerting.ts` | Fix week offset, add alert details |
| `scripts/verify_phase24_4_ops_coverage_prod.ts` | Diagnostic script |
