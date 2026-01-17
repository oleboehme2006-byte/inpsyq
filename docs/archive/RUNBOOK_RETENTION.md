# Retention Runbook

## Overview
Enforces GDPR-compliant data retention policies.

## Retention Windows
| Data | Window | Action |
|------|--------|--------|
| Sessions | 12 months | Delete |
| Invites | 72 hours | Delete |
| Login tokens | On expiry | Delete |
| Audit logs | 24 months | Trim (if enabled) |

## Running Retention

### Step 1: Compute Plan (Dry-Run)
```bash
curl -X POST \
  -H "Cookie: <admin-session>" \
  -H "Content-Type: application/json" \
  https://www.inpsyq.com/api/admin/system/retention/plan
```

Response shows counts and sample IDs:
```json
{
  "ok": true,
  "plan": {
    "counts": {
      "expiredInvites": 5,
      "expiredLoginTokens": 12,
      "oldSessions": 0,
      "deletedUsersPurgeable": 0,
      "oldAuditLogs": 0
    }
  }
}
```

### Step 2: Apply Retention
Requires explicit confirmation:
```bash
curl -X POST \
  -H "Cookie: <admin-session>" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "APPLY"}' \
  https://www.inpsyq.com/api/admin/system/retention/apply
```

### Step 3: Verify
Check health endpoint:
```bash
curl -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  https://www.inpsyq.com/api/internal/health/system
```

## Troubleshooting

### Retention Overdue
1. Check last run: `retention.lastRunAt` in health endpoint
2. Compute plan to see pending work
3. Apply retention
4. Verify `retention.overdue` is false

### Apply Failed
1. Check audit logs for `RETENTION_APPLY_ABORTED`
2. Review error in metadata
3. Re-run (safe, idempotent)

## Audit Events
- `RETENTION_PLAN_RUN` - Plan computed
- `RETENTION_APPLY_RUN` - Retention executed
- `RETENTION_APPLY_ABORTED` - Execution failed
