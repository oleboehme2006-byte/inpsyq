# Phase 23.1 Bootstrap Runbook

## Prerequisites
1. Phase 23 migration applied (`npm run migrate:phase23`)
2. Resend configured with `EMAIL_PROVIDER=resend` and `RESEND_API_KEY`
3. `BOOTSTRAP_SECRET` set (production only)

## Bootstrap First Admin

### Step 1: Get Org ID
Find your organization UUID from the database:
```sql
SELECT org_id, name FROM orgs LIMIT 5;
```

### Step 2: Call Bootstrap Endpoint

**Production (Vercel)**:
```bash
curl -X POST https://YOUR_APP.vercel.app/api/internal/bootstrap/first-admin-invite \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: YOUR_BOOTSTRAP_SECRET" \
  -d '{"email": "admin@company.com", "orgId": "YOUR_ORG_UUID"}'
```

**Local Development**:
```bash
BOOTSTRAP_SECRET=test npx tsx scripts/bootstrap_first_admin_invite.ts admin@example.com 11111111-1111-4111-8111-111111111111 http://localhost:3001
```

### Step 3: Complete Login
1. Admin receives magic link email
2. Click link to consume token
3. Session created, redirected to /admin

## Security Notes
- Bootstrap endpoint returns 404 in production if `BOOTSTRAP_SECRET` not set
- Returns 409 if admin already exists for org
- Never logs email or secrets
- Invite has 7-day expiry, single use

## Troubleshooting

**409 ALREADY_BOOTSTRAPPED**
An admin already exists for this org. Use `/api/access/invite` to create more invites.

**404 Not Found**
`BOOTSTRAP_SECRET` not set in production. Add to Vercel environment variables.

**No email received**
- Check `EMAIL_PROVIDER` is `resend`
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for delivery status
