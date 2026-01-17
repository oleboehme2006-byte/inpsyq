# Phase 25.1 Admin Runbook

## Quick Reference

### Create an Invite
1. Go to `/admin/invites`
2. Enter email address
3. Select role
4. If TEAMLEAD, select team
5. Click "Create Invite"

### Update Member Role
1. Go to `/admin/users`
2. Click "Edit" on the member row
3. Select new role
4. If TEAMLEAD, select team
5. Click "Save"

## Common Issues

### "TEAMLEAD invite must specify a team"
TEAMLEAD role requires a team assignment. Select a team from the dropdown.

### "Cannot remove the last ADMIN"
At least one ADMIN must exist in the organization. Add another ADMIN first.

### "Maximum outstanding invites limit reached"
Revoke existing invites or wait for them to expire (72 hours).

## API Troubleshooting

### Test invite creation
```bash
curl -X POST http://localhost:3001/api/admin/invites \
  -H "Content-Type: application/json" \
  -H "Cookie: inpsyq_dev_user=ADMIN_USER_ID; inpsyq_selected_org=ORG_ID" \
  -d '{"email":"test@example.com","role":"EMPLOYEE"}'
```

### Test member update
```bash
curl -X PATCH http://localhost:3001/api/admin/members \
  -H "Content-Type: application/json" \
  -H "Cookie: inpsyq_dev_user=ADMIN_USER_ID; inpsyq_selected_org=ORG_ID" \
  -d '{"userId":"USER_ID","role":"EXECUTIVE"}'
```

## E2E Verification
```bash
# Start dev server
npm run dev -- -p 3001

# Run E2E tests
npx tsx scripts/verify_phase25_1_admin_e2e.ts

# Check artifacts
cat artifacts/phase25_1/summary.json
```
