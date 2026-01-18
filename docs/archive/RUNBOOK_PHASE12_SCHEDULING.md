# RUNBOOK: Phase 12 Production Scheduling

## Quick Start

```bash
# Dry run (validates, no writes)
npm run weekly:dev:dry

# Full run
npm run weekly:dev:run

# Check health
npm run weekly:health

# Verification
npm run verify:phase12.security
npm run verify:phase12.locking
npm run verify:phase12.backfill
```

---

## Production Cron Setup

### Option A: Vercel Cron (Preferred)

Already configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/internal/run-weekly",
    "schedule": "0 2 * * 1"
  }]
}
```

Runs every Monday at 02:00 UTC.

**Required**: Set `INTERNAL_CRON_SECRET` in Vercel environment.

### Option B: GitHub Actions

Create `.github/workflows/weekly-automation.yml`:

```yaml
name: Weekly Automation
on:
  schedule:
    - cron: '0 2 * * 1'  # Monday 02:00 UTC
  workflow_dispatch:

jobs:
  run-weekly:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Weekly Run
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "x-cron-secret: ${{ secrets.INTERNAL_CRON_SECRET }}" \
            -d '{}' \
            https://your-domain.com/api/internal/run-weekly
```

---

## Backfill Previous Weeks

```bash
# Last week
curl -X POST \
  -H "x-cron-secret: $SECRET" \
  -d '{"week_offset": -1}' \
  .../api/internal/run-weekly

# Two weeks ago
curl -X POST \
  -H "x-cron-secret: $SECRET" \
  -d '{"week_offset": -2}' \
  .../api/internal/run-weekly
```

---

## Mode Usage

```bash
# Pipeline only (skip interpretation)
curl -X POST \
  -H "x-cron-secret: $SECRET" \
  -d '{"mode": "PIPELINE_ONLY"}' \
  .../api/internal/run-weekly

# Interpretation only (requires pipeline exists)
curl -X POST \
  -H "x-cron-secret: $SECRET" \
  -d '{"mode": "INTERPRETATION_ONLY"}' \
  .../api/internal/run-weekly
```

---

## Failure Recovery

1. **Check health**:
   ```bash
   npm run weekly:health
   ```

2. **View recent runs**:
   ```bash
   curl "...?action=list" -H "x-inpsyq-admin-secret: $SECRET"
   ```

3. **Re-run failed week**:
   ```bash
   curl -X POST \
     -H "x-cron-secret: $SECRET" \
     -d '{"week_start": "2025-01-06"}' \
     .../api/internal/run-weekly
   ```

4. **Force specific org**:
   ```bash
   curl -X POST \
     -H "x-cron-secret: $SECRET" \
     -d '{"org_id": "UUID"}' \
     .../api/internal/run-weekly
   ```

---

## Secret Rotation

1. Generate new secret
2. Update in environment variables
3. Deploy
4. Update cron/scheduler with new secret
5. Verify with dry run

---

## Alert Webhook

Set `ALERT_WEBHOOK_URL` to receive failure notifications.

Payload format:
```json
{
  "env": "production",
  "run_id": "uuid",
  "week_start": "2025-01-06",
  "status": "failed",
  "counts": {...},
  "top_error": "...",
  "timestamp": "..."
}
```

Compatible with Slack, Discord, PagerDuty, etc.
