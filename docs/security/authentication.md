# Authentication

## Overview

InPsyQ uses magic-link email authentication. There are no passwords.

---

## Authentication Flow

```
1. User enters email at /login
2. System checks if user has membership or pending invite
3. If valid, creates login token (15-min expiry)
4. Sends email with magic link
5. User clicks link → /auth/consume?token=...
6. System validates token, creates session
7. User redirected by role
```

---

## Magic Link Tokens

### Properties

| Property | Value |
|----------|-------|
| Length | 32 bytes (64 hex chars) |
| Expiry | 15 minutes |
| Single-use | Yes (deleted after use) |
| Storage | SHA-256 hash in database |

### Rate Limiting

- **Per email**: 3 requests per 15 minutes
- **Per IP**: 10 requests per hour

---

## Sessions

### Properties

| Property | Value |
|----------|-------|
| Length | 32 bytes (64 hex chars) |
| Expiry | 30 days (absolute) |
| Idle timeout | 7 days |
| Storage | SHA-256 hash in database |
| Cookie | `session` (HttpOnly, Secure, SameSite=Lax) |

### Session Validation

On each request:
1. Extract session token from cookie
2. Hash and lookup in database
3. Check expiry and idle timeout
4. Update `last_seen_at`

---

## Origin Enforcement

Magic link emails must use the canonical public origin.

### Production

- `AUTH_BASE_URL` **MUST** be set
- **MUST** equal `https://www.inpsyq.com`
- Any deviation throws a hard error at startup

### Preview/Staging

- Emails are **suppressed** (never sent)
- `EMAIL_PROVIDER=disabled` enforced

### Key Module

```
lib/env/publicOrigin.ts
```

Exports:
- `getPublicOrigin()` — Returns origin with source info
- `getPublicOriginUrl()` — Returns just the URL string
- `assertPublicOriginValid()` — Throws if misconfigured

---

## Invite-Only Access

Users must have either:
- An existing `membership` record, OR
- A valid `active_invite` record

Unknown emails receive a generic response (no enumeration).

---

## Post-Login Routing

| Role | Destination |
|------|-------------|
| ADMIN | `/admin` |
| EXECUTIVE | `/executive` |
| TEAMLEAD | `/team/[teamId]` |
| EMPLOYEE | `/session` |

Multi-org users are first sent to `/org/select`.

---

## Debugging Authentication

### Check Origin Configuration

```bash
curl https://www.inpsyq.com/api/internal/diag/auth-origin \
  -H "Authorization: Bearer $SECRET"
```

### Check Login Token Status

```bash
curl https://www.inpsyq.com/api/internal/diag/login-token?email=... \
  -H "Authorization: Bearer $SECRET"
```

### Verify Email Transport

```bash
EMAIL_PROVIDER=test npx tsx scripts/verify/email.verify.ts
```

---

## Security Considerations

1. **No password storage** — Authentication via email only
2. **Tokens hashed** — Never stored plaintext
3. **Rate limiting** — Prevents brute force and enumeration
4. **Invite-only** — Unknown emails cannot authenticate
5. **Strict origin** — Production emails always use canonical domain
