# Authentication & Admin

This document describes the authentication system, role-based access control, and admin operations.

## Authentication Flow

### Magic Link Authentication
InPsyq uses passwordless magic link authentication:

1. User enters email at `/login`
2. System generates token, stores in DB with expiry
3. Email sent with link to `/auth/consume?token=...`
4. User clicks link → confirm page renders
5. User clicks "Continue" → POST to `/api/auth/consume`
6. Token validated, session cookie set, redirect to app

### Public Origin Enforcement

**Critical**: Magic links MUST use the canonical public origin.

**Priority Order**:
1. `AUTH_BASE_URL` — Required in production, must be `https://www.inpsyq.com`
2. `NEXT_PUBLIC_SITE_URL` — Manual override
3. `VERCEL_URL` — Preview deployments only
4. Fallbacks — Dev: localhost, Prod: inpsyq.com

**Production Invariant**: In `VERCEL_ENV=production`, `AUTH_BASE_URL` must equal `https://www.inpsyq.com`. Any deviation throws a hard error.

### Email Transport

| Provider | Environment | Behavior |
|----------|-------------|----------|
| `resend` | Production | Sends real emails via Resend API |
| `disabled` | Staging/Preview | No-op, logs only |
| `test` | Local dev | Writes to `artifacts/email_outbox/` |

**Safety**: Preview deployments NEVER send real emails.

## Role-Based Access Control

### Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full organization access, can manage users |
| `TEAMLEAD` | Team-level dashboard access |
| `EXECUTIVE` | Org-level dashboard access |
| `EMPLOYEE` | Session participation only |

### Membership Model

```
User → Membership → Organization
              ↓
            Team (optional)
            Role
```

### Route Guards

| Route Pattern | Required Role |
|---------------|---------------|
| `/api/admin/*` | ADMIN |
| `/api/dashboard/team` | TEAMLEAD, ADMIN |
| `/api/dashboard/executive` | EXECUTIVE, ADMIN |
| `/api/internal/*` | `INTERNAL_ADMIN_SECRET` header |

## Admin Operations

### Test Organization

A dedicated test organization exists for UX development:

**TEST_ORG_ID**: `99999999-9999-4999-8999-999999999999`

This ID is intentionally distinct from fixture IDs to prevent collisions.

### Admin Endpoints

All require `Authorization: Bearer $INTERNAL_ADMIN_SECRET`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/internal/admin/test-org/ensure` | POST | Create org + admin |
| `/api/internal/admin/test-org/seed` | POST | Seed measurement data |
| `/api/internal/admin/test-org/status` | GET | Check data status |
| `/api/internal/admin/mint-login-link` | POST | Mint magic link for admin |

### Seeding Test Data

```bash
# 1. Ensure org exists
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/ensure \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"

# 2. Seed 6 weeks of data
curl -X POST https://www.inpsyq.com/api/internal/admin/test-org/seed \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" \
  -d '{"weeks": 6}'

# 3. Verify status
curl https://www.inpsyq.com/api/internal/admin/test-org/status \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

### Seeded Data

- **Org**: Test Organization
- **Teams**: Alpha, Beta, Gamma (3 teams)
- **Employees**: 5 per team (15 total, synthetic emails)
- **Weeks**: 6 weeks of measurement data
- **Sessions**: ~90 completed sessions
- **Interpretations**: Team + org-level per week

## Session Security

### Cookie Settings
- `Secure`: true (HTTPS only)
- `SameSite`: Lax
- `HttpOnly`: true

### Session Lifetime
- Absolute timeout: 7 days
- Idle timeout: 24 hours
- Fresh session required for destructive actions

## Verification

```bash
# Origin invariants
npx tsx scripts/verification/origin.verify.ts

# Email transport
npx tsx scripts/verification/email.verify.ts
```

## File References

- `lib/env/publicOrigin.ts` — Origin resolution
- `lib/auth/session.ts` — Session management
- `lib/admin/seedTestOrg.ts` — Test org seeding
- `services/email/transport.ts` — Email transport
- `app/api/auth/request-link/route.ts` — Magic link request
- `app/api/auth/consume/route.ts` — Token consumption
