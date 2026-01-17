# Ops Runbook

## System Health

### Health Endpoint
```bash
curl -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  https://app.inpsyq.com/api/internal/health/system
```

**Response includes:**
- `database.ok` - DB connectivity
- `pipeline.ok` - Weekly pipeline freshness
- `interpretations.ok` - LLM coverage
- `locks.ok` - No stuck locks

### Quick Checks

**DB Status:**
```sql
SELECT 1;
```

**Last Pipeline Run:**
```sql
SELECT week_start, created_at 
FROM weekly_products 
ORDER BY week_start DESC 
LIMIT 1;
```

**Stuck Locks:**
```sql
SELECT * FROM weekly_locks 
WHERE locked_at < NOW() - INTERVAL '1 hour'
AND completed_at IS NULL;
```

## Monitoring

### Key Metrics
- Dashboard load time (< 2s target)
- Pipeline duration (< 5min target)
- Interpretation fallback rate (< 10% target)

### Alerts (Slack)
- Pipeline duration anomaly
- High fallback rate
- Repeated admin failures
- Coverage gaps

## Weekly Pipeline

### Manual Trigger
```bash
curl -X POST \
  -H "Authorization: Bearer $INTERNAL_CRON_SECRET" \
  https://app.inpsyq.com/api/internal/run-weekly
```

### Check Status
1. Go to `/admin/setup`
2. Check Step D status
3. View `/admin/system/weekly` for history
