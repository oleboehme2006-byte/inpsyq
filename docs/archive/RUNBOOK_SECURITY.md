# Security Runbook

## Rate Limiting

### Configuration
See `lib/security/rateLimit.ts` for limits.

### Troubleshooting
**User reports being rate limited:**
1. Check if legitimate (not automated attack)
2. Rate limits reset after window expires
3. No manual override in production

**Attack detected:**
1. Rate limiter will auto-block
2. Check `audit_logs` for `RATE_LIMIT_EXCEEDED` events
3. Consider IP-level blocking at CDN

## Session Security

### Session Lifetime
- Absolute max: 30 days
- Idle timeout: 7 days

### Force Session Invalidation
```sql
DELETE FROM sessions WHERE user_id = 'target-user-id';
```

### Check Active Sessions
```sql
SELECT * FROM sessions 
WHERE user_id = 'target-user-id' 
AND expires_at > NOW();
```

## Destructive Admin Actions

Require fresh session (< 10 min since last activity).
If session not fresh, API returns 401 with `requiresReauth: true`.

User must re-login via magic link to proceed.

## Audit Logs

### Query Recent Events
```sql
SELECT * FROM audit_logs 
WHERE org_id = 'your-org-id'
ORDER BY created_at DESC
LIMIT 50;
```

### Security-Relevant Actions
- `LOGIN_FAILURE` - Potential brute force
- `RATE_LIMIT_EXCEEDED` - Abuse detection
- `USER_DELETED` - GDPR action
- `ORG_PURGE_*` - Major data action
