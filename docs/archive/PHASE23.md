# Phase 23: Production Auth + Invite-Only Access

## Overview
Phase 23 implements production-ready authentication with magic-link email login and invite-only access enforcement.

## Key Features

### 1. Magic Link Authentication
- Single-use tokens with 15-minute expiry
- Tokens stored hashed (SHA-256) in database
- Rate limiting per email and IP

### 2. Invite-Only Access
- Unknown emails cannot obtain sessions
- Access via existing membership OR pending invite
- Non-enumerating API responses

### 3. Session Management
- Secure HttpOnly cookies (Secure flag in production)
- 30-day session expiry
- Session stored hashed in database

### 4. RBAC
- Roles: ADMIN, EXECUTIVE, TEAMLEAD, EMPLOYEE
- Protected routes require valid session
- Role-based redirects after login

## New Files

| File | Purpose |
|------|---------|
| `lib/auth/session.ts` | Session token generation/validation |
| `lib/auth/loginToken.ts` | Magic link token management |
| `services/email/transport.ts` | Email transport abstraction |
| `lib/analytics/plausible.ts` | Analytics helper |
| `app/(auth)/login/page.tsx` | Login UI |
| `app/api/auth/request-link/route.ts` | Request magic link |
| `app/api/auth/consume/route.ts` | Consume magic link |
| `app/api/auth/logout/route.ts` | Logout |

## Database Changes

### New Tables
- `login_tokens` — Magic link tokens
- Updates to `sessions` — Added `token_hash`, `last_seen_at`, `ip`, `user_agent`
- Updates to `active_invites` — Added `email`, `max_uses`, `uses_count`
- Updates to `users` — Added `email`, `name`

### Migration
```bash
npm run migrate:phase23
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_PROVIDER` | Yes | `"resend"` or `"disabled"` |
| `RESEND_API_KEY` | If resend | Resend API key |
| `EMAIL_FROM` | Yes | Sender address |
| `SESSION_SECRET` | Recommended | Session signing secret |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | Analytics domain |

## Verification

```bash
npm run verify:phase23       # All tests
npm run verify:phase23:unit  # Unit tests
npm run verify:phase23:invite # Invite-only tests
```
