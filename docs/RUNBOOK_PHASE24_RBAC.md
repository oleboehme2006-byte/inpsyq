# Phase 24 RBAC Runbook

## Manual Testing Matrix

### EMPLOYEE Testing
1. Login as EMPLOYEE user
2. Verify redirect to `/session`
3. Try accessing `/executive` → should redirect to `/session`
4. Try API `/api/dashboard/executive` → should return 403 JSON
5. Try API `/api/dashboard/team` → should return 403 JSON

### TEAMLEAD Testing
1. Login as TEAMLEAD user
2. Verify redirect to `/team/[ownTeamId]`
3. Access own team dashboard → should work
4. Try accessing different team → should return 403
5. Try `/executive` → should redirect or 403
6. Try `/api/dashboard/executive` → should return 403

### EXECUTIVE Testing
1. Login as EXECUTIVE user
2. Verify redirect to `/executive`
3. Access executive dashboard → should work
4. Access any team dashboard → should work
5. Try `/admin` → should redirect or 403
6. Try `/api/admin/*` → should return 403

### ADMIN Testing
1. Login as ADMIN user
2. Verify redirect to `/admin`
3. Access all dashboards → should work
4. Access admin tools → should work

### Multi-Org Testing
1. Login with user who has multiple orgs
2. Should redirect to `/org/select`
3. Select an org
4. Verify cookie `inpsyq_selected_org` is set
5. Verify redirect by role

## Debugging

### Check Current Context
```bash
curl http://localhost:3001/api/access/whoami \
  -H "Cookie: inpsyq_dev_user=USER_ID; inpsyq_selected_org=ORG_ID"
```

### Verify Role in DB
```sql
SELECT u.email, m.role, m.team_id, o.name as org_name
FROM memberships m
JOIN users u ON m.user_id = u.user_id
JOIN orgs o ON m.org_id = o.org_id
WHERE u.email = 'test@example.com';
```
