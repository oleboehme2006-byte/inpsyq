# Audit Logging

## Purpose

Security audit logging provides a tamper-evident record of security-relevant actions for compliance and incident investigation.

## Implementation

Location: `lib/security/auditLog.ts`

## Logged Actions

| Action | When Logged |
|--------|-------------|
| `LOGIN_SUCCESS` | Magic link consumed successfully |
| `LOGIN_FAILURE` | Invalid or expired token |
| `SESSION_CREATED` | New session established |
| `SESSION_REVOKED` | Logout or session invalidation |
| `ROLE_CHANGED` | User role updated |
| `INVITE_CREATED` | New invite generated |
| `INVITE_REVOKED` | Invite cancelled |
| `INVITE_ACCEPTED` | Invite used to create membership |
| `WEEKLY_RUN_STARTED` | Interpretation pipeline began |
| `WEEKLY_RUN_COMPLETED` | Pipeline finished successfully |
| `WEEKLY_RUN_FAILED` | Pipeline error |
| `USER_DELETED` | Soft-delete (GDPR) |
| `ORG_PURGE_STARTED` | Data erasure began |
| `ORG_PURGE_COMPLETED` | Data erasure finished |
| `RATE_LIMIT_EXCEEDED` | Rate limit triggered |
| `REAUTH_REQUIRED` | Fresh session required for destructive action |

## Log Schema

```sql
security_audit_log (
  id            SERIAL PRIMARY KEY,
  actor_user_id UUID,           -- Who performed action (NULL for system)
  org_id        UUID,           -- Context organization
  action        TEXT NOT NULL,  -- Action enum
  metadata      JSONB,          -- Action-specific data
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

## API Usage

```typescript
import { logSecurityEvent } from '@/lib/security/auditLog';

await logSecurityEvent({
  action: 'LOGIN_SUCCESS',
  actorUserId: user.id,
  orgId: membership.orgId,
  metadata: { 
    ip: request.ip,
    userAgent: request.headers.get('user-agent')
  }
});
```

## Querying Logs

```typescript
import { querySecurityLogs } from '@/lib/security/auditLog';

const logs = await querySecurityLogs({
  action: 'LOGIN_FAILURE',
  since: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
  limit: 100
});
```

## Retention

Audit logs are retained for compliance requirements (typically 1-7 years depending on jurisdiction).

## Access

Audit logs are accessible only via:
- Direct database query (DBA access)
- Admin API with `INTERNAL_ADMIN_SECRET`

They are NOT exposed to any user-facing UI.

## Privacy Considerations

Logs contain:
- User IDs (can be mapped to emails)
- IP addresses
- User agents

Handle according to privacy policy and GDPR requirements.
