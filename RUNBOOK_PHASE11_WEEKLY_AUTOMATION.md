# RUNBOOK: Phase 11 Weekly Automation

## Quick Start

```bash
# Dev: Run weekly cycle manually
npm run weekly:dev:run

# Verify
npm run verify:phase11.security
npm run verify:phase11.idempotency
npm run verify:phase11.coverage
```

---

## Cron Setup (Production)

Add to your cron scheduler (e.g., Vercel Cron, GitHub Actions):

```bash
# Every Monday at 02:00 UTC
0 2 * * MON curl -X POST \
  -H "x-cron-secret: $INTERNAL_CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://your-domain.com/api/internal/run-weekly
```

---

## Endpoint Reference

### POST /api/internal/run-weekly

**Headers:**
- `x-cron-secret`: Required, must match `INTERNAL_CRON_SECRET`

**Body (JSON):**
```json
{
  "org_id": "optional-uuid",
  "week_start": "2025-01-06",
  "dry_run": false
}
```

**Response:**
```json
{
  "success": true,
  "run_id": "uuid",
  "week_start": "2025-01-06",
  "week_label": "2025-W02",
  "status": "completed",
  "counts": {
    "orgs_total": 1,
    "teams_total": 2,
    "pipeline_upserts": 2,
    "interpretation_generations": 2
  }
}
```

---

## Diagnostics

```bash
# List recent runs
curl "http://localhost:3001/api/internal/diag/weekly-runs?action=list" \
  -H "x-inpsyq-admin-secret: $INTERNAL_ADMIN_SECRET"

# Get run details
curl "http://localhost:3001/api/internal/diag/weekly-runs?action=detail&run_id=UUID" \
  -H "x-inpsyq-admin-secret: $INTERNAL_ADMIN_SECRET"

# Check readiness
curl "http://localhost:3001/api/internal/diag/weekly-runs?action=readiness&org_id=UUID" \
  -H "x-inpsyq-admin-secret: $INTERNAL_ADMIN_SECRET"
```

---

## Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| Team timeout | Team marked failed, org continues |
| DB error on team | Team marked failed, org continues |
| Total timeout | Run marked partial, stops processing |
| Missing secret | 401 Unauthorized |

---

## Recovery

1. Check run status:
   ```bash
   curl "...?action=list"
   ```

2. If partial, re-run:
   ```bash
   npm run weekly:dev:run
   ```
   (Idempotent — only processes missing/changed data)

3. For specific org:
   ```bash
   curl -X POST \
     -H "x-cron-secret: $SECRET" \
     -d '{"org_id":"UUID"}' \
     .../api/internal/run-weekly
   ```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INTERNAL_CRON_SECRET` | Yes | Secret for cron endpoint |
| `INTERNAL_ADMIN_SECRET` | Yes | Secret for diagnostics |
| `DATABASE_URL` | Yes | Database connection |
