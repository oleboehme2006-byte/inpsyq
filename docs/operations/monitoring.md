# Monitoring & Operations

## Health Endpoints

### System Health

```
GET /api/internal/health/system
Authorization: Bearer $INTERNAL_ADMIN_SECRET
```

Returns:
- Database connectivity
- Active locks
- Pipeline status
- Cache metrics

### Quick Health Check

```bash
curl -s https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $SECRET" | jq .
```

---

## Alerts & Monitoring

### Alert Sources

| Source | Description |
|--------|-------------|
| Vercel | Deployment failures, function errors |
| Slack (if configured) | Custom application alerts |
| Manual checks | Daily ops verification |

### Alert Response

1. **Check health endpoint** for system status
2. **Check recent deployments** for correlation
3. **Check database** for lock/connection issues
4. **Check logs** in Vercel dashboard

---

## Weekly Pipeline

The weekly measurement pipeline runs automatically and processes:
1. Aggregate team responses
2. Generate LLM interpretations
3. Update dashboards

### Check Pipeline Status

```bash
# Via API
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $SECRET" | jq '.pipeline'

# Or check admin dashboard
```

### Manual Pipeline Trigger

```bash
npx tsx scripts/ops/trigger-weekly.ts
```

---

## Lock Management

Distributed locks prevent concurrent operations. If a lock becomes stale:

### Check Stale Locks

```bash
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $SECRET" | jq '.locks'
```

### Release Stale Locks

```bash
npx tsx scripts/ops/release-locks.ts
```

---

## Data Retention

Retention policies:
- **Measurement responses**: 2 years
- **Session records**: 2 years
- **Audit logs**: 5 years
- **Login tokens**: Auto-deleted after use/expiry

### Check Retention Status

```bash
curl https://www.inpsyq.com/api/admin/system/retention/plan \
  -H "Authorization: Bearer $SECRET"
```

---

## Common Operations

### View Recent Sessions

```sql
SELECT * FROM measurement_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Active Users

```sql
SELECT COUNT(DISTINCT user_id) FROM sessions
WHERE last_seen_at > NOW() - INTERVAL '24 hours';
```

### Debug Auth Issues

```bash
# Check origin configuration
curl https://www.inpsyq.com/api/internal/diag/auth-origin \
  -H "Authorization: Bearer $SECRET"
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 | Service down | Immediate |
| P2 | Major feature broken | < 1 hour |
| P3 | Minor issue | < 24 hours |

### Response Steps

1. **Acknowledge** the alert
2. **Assess** impact scope
3. **Mitigate** (rollback if needed)
4. **Fix** root cause
5. **Document** in incident log
