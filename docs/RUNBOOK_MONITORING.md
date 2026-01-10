# Monitoring Runbook

## Overview
Automated system health checks with alerting.

## Check Frequency
Run monitoring at least every 4 hours in production.

## Running Monitoring

### Via API
```bash
curl -X POST \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  https://www.inpsyq.com/api/internal/ops/monitor
```

### Response
```json
{
  "ok": true,
  "result": {
    "environment": "production",
    "checks": {
      "database": { "ok": true, "latencyMs": 45 },
      "pipeline": { "ok": true, "daysAgo": 3 },
      "interpretations": { "ok": true, "coverage": 100 },
      "retention": { "ok": true, "overdue": false },
      "locks": { "ok": true, "stuckCount": 0 }
    },
    "alerts": [],
    "deliveryStatus": "skipped"
  }
}
```

## Checks Explained

| Check | OK Condition | Alert Code |
|-------|--------------|------------|
| Database | Query succeeds | `DB_UNREACHABLE` |
| Pipeline | Last run < 14 days | `PIPELINE_STALE` |
| Interpretations | Coverage ≥ 80% | `INTERPRETATION_GAP` |
| Retention | Not overdue | `RETENTION_OVERDUE` |
| Locks | No stuck locks | `STUCK_LOCKS` |

## Alert Delivery

### Production
- Alerts sent to `SLACK_WEBHOOK_URL`
- Set `OPS_ALERTS_DISABLED=true` to suppress

### Staging
- Uses `SLACK_WEBHOOK_URL_STAGING`
- All alerts prefixed with `[STAGING]`
- If no staging webhook: delivery skipped

## Troubleshooting

### False Positives
1. Check `APP_ENV` is correct
2. Verify database connectivity
3. Check retention was run recently

### Alerts Not Delivering
1. Verify webhook URL is set
2. Check `OPS_ALERTS_DISABLED` is not true
3. Check audit logs for `MONITORING_CHECK_RAN`
