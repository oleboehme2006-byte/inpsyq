# Phase 24.4 Ops Coverage Runbook

## Quick Diagnosis

### 1. Check Current Health Status
```bash
PROD_URL=https://your-app.vercel.app \
INTERNAL_ADMIN_SECRET=your-secret \
npm run verify:phase24.4:prod
```

### 2. Check Artifacts
```bash
cat artifacts/phase24_4/prod_health.json
cat artifacts/phase24_4/prod_summary.json
```

## Common Issues

### "100% teams failed/missing products"

**Before Phase 24.4 fix**: Health check was looking at current week, but data only exists for previous week.

**After fix**: Should check previous week (week_offset=-1).

### No weekly runs in database

Check if cron is running:
1. Go to GitHub Actions → Weekly InPsyq Run
2. Check last run status
3. If failing, check logs for secret issues

### Manual backfill

If data is missing for specific weeks:
```bash
curl -X POST "$PROD_URL/api/internal/run-weekly" \
  -H "x-cron-secret: $INTERNAL_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"week_offset": -1, "dry_run": false}'
```

## Alert Thresholds

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Failure rate | >10% | COVERAGE_GAP |
| Stuck locks | >0 | LOCK_STUCK |
| Degraded teams | >0 | INTERPRETATION_FALLBACK_HIGH |

## Verifying Fix Worked

After deploying the fix:
1. Wait for next hourly ops check
2. Verify no new COVERAGE_GAP alerts in Slack
3. Run diagnostic script to confirm health status
