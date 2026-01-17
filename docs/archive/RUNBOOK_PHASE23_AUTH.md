# Phase 23 Auth Runbook

## Prerequisites

### Required Environment Variables

Set in Vercel or `.env.local`:

```bash
# Email (required for production)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxx
EMAIL_FROM="InPsyq <no-reply@yourdomain.com>"

# Analytics (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
```

For local development without email:
```bash
EMAIL_PROVIDER=disabled
```

## Migration

Run before deployment:
```bash
npm run migrate:phase23
```

This creates:
- `login_tokens` table
- Updates `sessions` table
- Updates `active_invites` table
- Updates `users` table

## Verification

```bash
npm run verify:phase23
```

## Creating Invites

Only ADMIN or EXECUTIVE users can create invites:

```bash
curl -X POST http://localhost:3001/api/access/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: inpsyq_session=..." \
  -d '{"orgId": "...", "email": "newuser@company.com", "role": "EMPLOYEE"}'
```

## Login Flow

1. User visits `/login`
2. Enters email, submits
3. System checks for invite or membership
4. If allowed, sends magic link email
5. User clicks link, session created
6. Redirected to `/executive` (or `/admin` for admins)

## Logout

```bash
POST /api/auth/logout
```

Clears session cookie and database entry.

## Troubleshooting

### "Check your email" but no email received
- Verify `EMAIL_PROVIDER=resend` and `RESEND_API_KEY` are set
- Check Resend dashboard for delivery status
- Invite-only: email must have pending invite or existing membership

### Session not persisting
- Check `Secure` cookie flag (requires HTTPS in production)
- Verify session exists in database
- Check session expiry (30 days default)
