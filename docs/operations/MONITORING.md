# Monitoring

## Health Endpoints

### System Health (`/api/internal/health/system`)

**Requires**: `Authorization: Bearer {INTERNAL_ADMIN_SECRET}`

**Returns**:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "ok": true, "latencyMs": 12 },
    "pipeline": { "ok": true, "lastRun": "2024-01-15T00:00:00Z" },
    "interpretations": { "ok": true, "coverage": 0.95 },
    "locks": { "ok": true, "stuckCount": 0 }
  }
}
```

### Check Details

| Check | Healthy When |
|-------|--------------|
| `database` | Connection succeeds, latency < 1000ms |
| `pipeline` | Last run within 7 days |
| `interpretations` | Coverage > 80% for active orgs |
| `locks` | No locks older than 1 hour |

## Monitoring Commands

### Quick Health Check
```bash
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

### Periodic Monitoring
Set up Vercel cron or external monitor to poll every 5 minutes.

## Alerting

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| DB latency | > 500ms | > 2000ms |
| Pipeline age | > 3 days | > 7 days |
| Interpretation coverage | < 90% | < 70% |
| Stuck locks | > 0 | > 3 |

### Integration
Alerts can be sent via:
- Slack webhook (configure `SLACK_WEBHOOK_URL`)
- Email (future)

## Operational Metrics

### Database
- Connection pool utilization
- Query latency percentiles
- Active connections

### Application
- Request count by endpoint
- Error rate
- Response time percentiles

### Business
- Active users per week
- Survey completion rate
- Interpretation generation success rate

## Log Access

### Vercel Logs
- Vercel Dashboard → Project → Logs
- Filter by function, status, timeframe

### Database Logs
- Neon Dashboard → Project → Logs

## Incident Response

### Severity Levels

| Level | Example | Response |
|-------|---------|----------|
| P1 | Production down | Immediate (on-call) |
| P2 | Feature broken | Same day |
| P3 | Minor issue | Next sprint |

### On-Call Playbook

1. **Identify**: Check health endpoint, logs
2. **Communicate**: Post to #incidents
3. **Mitigate**: Rollback if needed
4. **Resolve**: Fix root cause
5. **Document**: Post-incident review

## Diagnostic Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/internal/diag/auth-origin` | Origin configuration |
| `/api/internal/diag/auth-request-link` | Email transport status |
| `/api/internal/diag/db-schema` | Database schema verification |

All require `INTERNAL_ADMIN_SECRET`.
