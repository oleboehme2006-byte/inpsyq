# Verification & Debug Runbook

## Quick Verification

### Build Check
```bash
npm run build
npm run lint
```

### Core Invariants
```bash
npx tsx scripts/verification/origin.verify.ts
npx tsx scripts/verification/test-org.verify.ts
npx tsx scripts/verification/email.verify.ts
```

---

## Production Verification

### Health Endpoint
```bash
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

**Check**:
- `status` should be `"healthy"`
- All `checks[*].ok` should be `true`

### Origin Configuration
```bash
curl https://www.inpsyq.com/api/internal/diag/auth-origin \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

**Check**:
- `computed.origin` should be `https://www.inpsyq.com`
- `computed.source` should be `AUTH_BASE_URL`
- `valid` should be `true`

### Email Transport
```bash
curl https://www.inpsyq.com/api/internal/diag/auth-request-link \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

**Check**:
- `origin.valid` should be `true`
- `email.provider` should be `resend` in production
- `email.suppressed` should be `false` in production

---

## Debug Procedures

### Database Schema
```bash
curl "https://www.inpsyq.com/api/internal/diag/db-schema?table=measurement_sessions" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

### User Role Check
```bash
curl "https://www.inpsyq.com/api/internal/diag/user-role?email=user@example.com" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

### Login Token Status
```bash
curl "https://www.inpsyq.com/api/internal/diag/login-token?email=user@example.com" \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

---

## Local Debug Mode

### Check Email Outbox
```bash
cat artifacts/email_outbox/last_magic_link.json | jq
```

### Database Query
```bash
npx tsx -e "
import { query } from './db/client';
const r = await query('SELECT COUNT(*) FROM users');
console.log(r.rows);
"
```

### Session Inspection
```bash
npx tsx -e "
import { query } from './db/client';
const r = await query('SELECT * FROM sessions LIMIT 5');
console.log(r.rows);
"
```

---

## Common Issues

### Build Fails with Module Error

**Symptom**: `Cannot find module 'X'`

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Origin Misconfigured

**Symptom**: `ORIGIN_MISCONFIGURED` error

**Fix**:
1. Check `AUTH_BASE_URL` in Vercel
2. Must be exactly `https://www.inpsyq.com` for production

### Rate Limited

**Symptom**: 429 response

**Fix**:
1. Wait for block duration (1-10 minutes)
2. Check `security_audit_log` for details

### Session Expired

**Symptom**: Redirected to login

**Fix**:
1. Sessions expire after 30 days
2. Idle timeout is 7 days
3. Request new magic link

---

## Verification Script Reference

| Script | Purpose |
|--------|---------|
| `origin.verify.ts` | Origin configuration |
| `test-org.verify.ts` | Test org structure |
| `email.verify.ts` | Email transport |
| `verify_access.ts` | Access patterns |
| `verify_dashboard.ts` | Dashboard APIs |
| `verify_pipeline_coverage.ts` | Pipeline health |

---

## Escalation

If verification fails and cannot be resolved:

1. Document exact error
2. Collect diagnostic output
3. Check recent deployments
4. Contact system owner
