# Phase 34: Retention Enforcement + Monitoring

## Overview
GDPR-style retention enforcement and production-grade monitoring.

## Retention Enforcement

### Constants (from lib/compliance/retention.ts)
| Data Type | Retention |
|-----------|-----------|
| Sessions | 12 months |
| Invites | 72 hours |
| Audit logs | 24 months |
| Aggregates | Indefinite |

### Module: `lib/security/retention.ts`
- `computeRetentionPlan()` - Dry-run, no side effects
- `applyRetentionPlan()` - Execute deletions
- `getRetentionStatus()` - For monitoring

### Admin APIs
- `POST /api/admin/system/retention/plan` - Compute plan
- `POST /api/admin/system/retention/apply` - Execute (requires `confirm: "APPLY"`)

### Internal Ops
- `POST /api/internal/ops/monitor` - Run monitoring checks

## Monitoring

### System Health Endpoint
`GET /api/internal/health/system` now includes:
- `retention.ok` - Not overdue
- `retention.lastRunAt` - Last apply timestamp
- `retention.overdue` - If > 7 days since last run

### Monitoring Runner
`services/ops/monitoring.ts` checks:
1. Database connectivity
2. Pipeline freshness
3. Interpretation coverage
4. Retention status
5. Stuck locks

### Alert Delivery
- Production: Uses `SLACK_WEBHOOK_URL`
- Staging: Uses `SLACK_WEBHOOK_URL_STAGING` or skips
- Disabled: Set `OPS_ALERTS_DISABLED=true`

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `RETENTION_MAX_AGE_HOURS` | 168 | Max hours between retention runs |
| `AUDIT_TRIM_ENABLED` | false | Enable audit log trimming |
| `OPS_ALERTS_DISABLED` | false | Disable Slack alerts |
| `SLACK_WEBHOOK_URL_STAGING` | - | Staging webhook (optional) |

## Commands
```bash
# Run monitoring
curl -X POST -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  https://www.inpsyq.com/api/internal/ops/monitor
```

## Files Added
- `lib/security/retention.ts`
- `services/ops/monitoring.ts`
- `app/api/admin/system/retention/plan/route.ts`
- `app/api/admin/system/retention/apply/route.ts`
- `app/api/internal/ops/monitor/route.ts`
