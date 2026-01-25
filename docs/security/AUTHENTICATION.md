# Authentication

## Overview

InPsyq uses passwordless magic-link authentication. Users receive a single-use login link via email that grants a session upon click.

## Flow

```
1. User enters email at /login
2. Server generates token, stores hash in login_tokens
3. Email sent with link to /auth/consume?token=...
4. User clicks link, server validates and consumes token
5. Session created, user redirected based on role
```

## Magic Link Tokens

### Generation (`lib/auth/loginToken.ts`)
- 64-byte random token
- Base64URL encoded
- 15-minute expiry
- Stored as SHA-256 hash

### Security Properties
- **Single-use**: Token consumed on first use
- **Short-lived**: 15-minute window
- **Non-enumerable**: API always returns success (prevents email enumeration)
- **Rate-limited**: 5 requests per minute per email/IP

## Origin Enforcement

Magic links MUST use the canonical production origin to prevent phishing.

### Production Requirements
```bash
AUTH_BASE_URL=https://www.inpsyq.com  # Required, strictly enforced
```

### Enforcement Logic (`lib/env/publicOrigin.ts`)
- Production (`VERCEL_ENV=production`): AUTH_BASE_URL must equal `https://www.inpsyq.com`
- Preview/Staging: Emails are suppressed (never sent)
- Development: Uses `http://localhost:3000`

### Invariant
> Magic links in production ALWAYS point to `https://www.inpsyq.com/auth/consume`

## Session Management

### Session Properties (`lib/auth/session.ts`)
| Property | Value |
|----------|-------|
| Absolute lifetime | 30 days |
| Idle timeout | 7 days |
| Fresh session window | 10 minutes (for destructive ops) |

### Cookie Settings
- `HttpOnly`: Yes (prevents XSS access)
- `Secure`: Yes in production
- `SameSite`: Lax
- `Path`: /

### Session Storage
Sessions stored in database with:
- `token_hash`: SHA-256 of session token
- `expires_at`: Absolute expiry
- `last_seen_at`: Updated on each request
- `ip`, `user_agent`: For audit

## Rate Limiting

### Limits (`lib/security/rateLimit.ts`)
| Endpoint | Limit | Block Duration |
|----------|-------|----------------|
| `/api/auth/request-link` | 5/min | 5 min |
| `/api/auth/consume` | 10/min | 5 min |
| Admin mutations | 20/min | 1 min |
| Destructive actions | 3/10min | 10 min |

### Algorithm
- Sliding window
- Per-IP + per-identity isolation
- JSON error on limit exceeded

## Invite-Only Access

Users must have one of:
1. Existing membership in an organization
2. Pending invite (in `active_invites`)

Unknown emails cannot obtain sessions.

## Email Transport

### Providers (`services/email/transport.ts`)
| Provider | Use Case |
|----------|----------|
| `resend` | Production (real emails) |
| `test` | Local testing (writes to `artifacts/email_outbox/`) |
| `disabled` | Preview/staging (no emails) |

### Suppression Logic
Emails are ALWAYS suppressed in:
- `VERCEL_ENV=preview`
- `APP_ENV=staging`
- `EMAIL_PROVIDER=disabled`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/request-link` | POST | Request magic link email |
| `/api/auth/consume` | POST | Consume token, create session |
| `/api/auth/logout` | POST | Revoke session |

## Troubleshooting

### Magic link not received
1. Check `EMAIL_PROVIDER` is `resend` in production
2. Check `RESEND_API_KEY` is set
3. Check `/api/internal/diag/auth-request-link` for diagnostics

### Token expired
- Tokens expire after 15 minutes
- User must request a new link

### Rate limited
- Wait for block duration
- Check `security_audit_log` for details
