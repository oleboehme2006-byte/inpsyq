# Incident Response Runbook

## Severity Levels

| Level | Example | Response Time |
|-------|---------|---------------|
| P1 - Critical | Complete outage, data breach | Immediate |
| P2 - High | Partial outage, dashboard errors | < 1 hour |
| P3 - Medium | Performance degradation | < 4 hours |
| P4 - Low | Minor bug, cosmetic | Next business day |

## Incident Workflow

### 1. Detection
- Slack alerts
- User reports
- Monitoring dashboards

### 2. Triage
- Determine severity
- Assign incident lead
- Create incident channel (if P1/P2)

### 3. Containment
- Identify affected scope
- Consider rollback if recent deploy
- Disable affected feature if needed

### 4. Resolution
- Fix root cause
- Deploy fix
- Verify in staging first (for P1/P2)

### 5. Post-Incident
- Document timeline
- Identify root cause
- Create follow-up tasks

## Common Incidents

### Database Connectivity
1. Check Neon status page
2. Verify DATABASE_URL is correct
3. Check connection pool limits

### Pipeline Failures
1. Check `/admin/system/weekly`
2. Look for stuck locks
3. Clear locks if needed:
   ```sql
   DELETE FROM weekly_locks WHERE locked_at < NOW() - INTERVAL '1 hour';
   ```

### Rate Limiting False Positives
1. Check audit logs for patterns
2. Rate limits auto-reset after window
3. Consider adjusting limits (requires deploy)

### Data Breach Suspicion
1. **Do not discuss in public channels**
2. Notify security lead immediately
3. Preserve logs
4. Consider disabling affected accounts
5. Prepare for regulatory notification (72 hours GDPR)

## Contacts

| Role | Escalation |
|------|------------|
| On-call | Slack @on-call |
| Security | security@inpsyq.com |
| Data Protection | dpo@inpsyq.com |
