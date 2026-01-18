# Security Model

This document describes the security architecture including authentication, authorization, secrets management, and origin enforcement.

## Authentication

### Magic Link Flow

1. **Request**: User submits email to `/api/auth/request-link`
2. **Token Generation**: Cryptographically random token generated
3. **Storage**: Token stored in DB with:
   - Email (hashed lookup)
   - Expiry (10 minutes)
   - Single-use flag
4. **Email**: Link sent to canonical origin `/auth/consume?token=...`
5. **Confirmation**: User clicks link, lands on confirm page
6. **Consumption**: POST to `/api/auth/consume` validates and creates session
7. **Session**: HttpOnly, Secure, SameSite=Lax cookie set

### Session Security

| Property | Value | Purpose |
|----------|-------|---------|
| HttpOnly | true | Prevent XSS token theft |
| Secure | true | HTTPS only |
| SameSite | Lax | CSRF protection |
| Absolute timeout | 7 days | Limit session lifetime |
| Idle timeout | 24 hours | Inactive session expiry |

### Freshness Requirement

Destructive actions require a "fresh" session (logged in within last 30 minutes).

## Authorization (RBAC)

### Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| ADMIN | Organization | Full access, user management |
| EXECUTIVE | Organization | Org-level dashboards |
| TEAMLEAD | Team | Team-level dashboards |
| EMPLOYEE | Self | Session participation |

### Route Protection

| Pattern | Protection |
|---------|------------|
| `/api/admin/*` | ADMIN role required |
| `/api/dashboard/team` | TEAMLEAD or ADMIN |
| `/api/dashboard/executive` | EXECUTIVE or ADMIN |
| `/api/internal/*` | INTERNAL_ADMIN_SECRET header |
| `/api/auth/*` | Public (rate limited) |

## Origin Enforcement

### Production Invariant

In production (`VERCEL_ENV=production`):
- `AUTH_BASE_URL` MUST be set
- `AUTH_BASE_URL` MUST equal `https://www.inpsyq.com`
- Violation throws hard error, blocking deployment

### Origin Resolution Priority

1. `AUTH_BASE_URL` — Explicit, required in production
2. `NEXT_PUBLIC_SITE_URL` — Manual override
3. `VERCEL_URL` — Preview deployments only
4. Fallback — Dev: localhost, Prod: inpsyq.com

### Email Safety

| Environment | Email Behavior |
|-------------|----------------|
| Production | Real emails via Resend |
| Staging | Disabled, logs only |
| Preview | Disabled, logs only |
| Local (test) | Writes to file outbox |

**Invariant**: Preview deployments NEVER send real emails.

## Secrets Management

### Required Secrets

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `DATABASE_URL` | Database connection | On breach |
| `OPENAI_API_KEY` | LLM access | Monthly recommended |
| `RESEND_API_KEY` | Email sending | On breach |
| `INTERNAL_ADMIN_SECRET` | Admin API access | On personnel change |

### Secret Storage

- Production: Vercel environment variables
- Local: `.env.local` (gitignored)

### Rotation Procedure

1. Generate new secret
2. Update in Vercel dashboard
3. Redeploy application
4. Verify functionality
5. Revoke old secret (if applicable)

## Rate Limiting

### Implementation

In-memory sliding window algorithm:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/request-link` | 5 requests | 15 minutes |
| `/api/auth/consume` | 10 requests | 15 minutes |
| `/api/internal/*` | 100 requests | 1 minute |

### Bypass

Rate limits can be bypassed with valid `INTERNAL_ADMIN_SECRET`.

## Audit Logging

Security-relevant events logged to `audit_log` table:

| Event | Data Captured |
|-------|---------------|
| `LOGIN_REQUEST` | Email (hashed), IP, user agent |
| `LOGIN_SUCCESS` | User ID, session ID |
| `LOGIN_FAILURE` | Reason, email (hashed) |
| `SESSION_EXPIRED` | User ID, reason |
| `ADMIN_ACTION` | Action type, actor, target |

## Tenant Isolation

### Data Boundaries

- All queries scoped by `org_id`
- No cross-org data access possible
- Test org uses dedicated ID: `99999999-9999-4999-8999-999999999999`

### Isolation Verification

```bash
npx tsx scripts/verification/schema.verify.ts
```

Verifies foreign key constraints prevent data leakage.

## Incident Response

### Suspected Breach

1. **Rotate secrets immediately**
2. **Review audit logs**
3. **Invalidate all sessions** (if needed)
4. **Document incident**
5. **Notify affected parties** (if applicable)

### Secret Exposure

1. **Revoke exposed secret**
2. **Generate new secret**
3. **Deploy with new secret**
4. **Audit access logs**
