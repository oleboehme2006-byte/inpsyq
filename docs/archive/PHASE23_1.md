# Phase 23.1: Production Auth Bootstrapping + Repo Hygiene

## Overview
Phase 23.1 makes Phase 23 auth fully deployable with secure bootstrapping, schema verification, and deterministic tests.

## Key Changes

### Repo Hygiene
- Updated `.gitignore` with playwright/test-results entries
- Verified no secrets in tracked files
- Verified `artifacts/` is not tracked

### Bootstrap Endpoint
- `POST /api/internal/bootstrap/first-admin-invite`
- Secured with `BOOTSTRAP_SECRET` header
- Returns 404 in production if secret not set
- Returns 409 if admin already exists

### New Verification Scripts
| Script | Purpose |
|--------|---------|
| `verify:phase23:schema` | Validates all Phase 23 tables/columns |
| `verify:phase23:email` | Tests email transport |
| `verify:phase23:bootstrap` | Tests bootstrap security + invite-only |
| `verify:phase23.1` | Full Phase 23.1 suite |

## Bootstrap Procedure

### Production Bootstrap
```bash
# Set BOOTSTRAP_SECRET in Vercel env vars

# Call bootstrap endpoint
curl -X POST https://your-app.vercel.app/api/internal/bootstrap/first-admin-invite \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: YOUR_BOOTSTRAP_SECRET" \
  -d '{"email": "admin@company.com", "orgId": "ORG_UUID"}'

# Admin receives magic link via email and completes login
```

### Local Development
```bash
BOOTSTRAP_SECRET=test npx tsx scripts/bootstrap_first_admin_invite.ts admin@example.com 11111111-1111-4111-8111-111111111111
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOOTSTRAP_SECRET` | For bootstrap | Secret for admin invite endpoint |
| `TEST_EMAIL` | Optional | Email for transport testing |
| `EMAIL_PROVIDER` | Yes | `resend` or `disabled` |
| `RESEND_API_KEY` | If resend | Resend API key |

## Verification Results

| Test | Status |
|------|--------|
| Schema verification | ✅ 24/24 columns |
| Unit tests | ✅ All passed |
| Invite-only enforcement | ✅ Unknown emails blocked |
| Email transport | ✅ Real email sent |
| Preflight | ✅ Build/Lint/Smoke passed |
