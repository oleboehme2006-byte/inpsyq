# Phase 24.1 RBAC Manual Testing Runbook

## Admin API Testing

### Test 1: Unauthenticated Access
```bash
# Should return 401 JSON
curl http://localhost:3001/api/admin/employees
```

### Test 2: Non-ADMIN Access
```bash
# Set dev cookie as EXECUTIVE user, should return 403 JSON
curl http://localhost:3001/api/admin/employees \
  -H "Cookie: inpsyq_dev_user=EXECUTIVE_USER_ID; inpsyq_selected_org=ORG_ID"
```

### Test 3: ADMIN Access
```bash
# Set dev cookie as ADMIN user, should return 200 or 400 (validation error)
curl http://localhost:3001/api/admin/employees \
  -H "Cookie: inpsyq_dev_user=ADMIN_USER_ID; inpsyq_selected_org=ORG_ID"
```

## Dashboard API Testing

### EMPLOYEE → Executive Dashboard (expect 403)
```bash
curl http://localhost:3001/api/dashboard/executive?org_id=ORG_ID \
  -H "Cookie: inpsyq_dev_user=EMPLOYEE_USER_ID; inpsyq_selected_org=ORG_ID"
```

### TEAMLEAD → Other Team (expect 403)
```bash
curl http://localhost:3001/api/dashboard/team?org_id=ORG_ID&team_id=OTHER_TEAM_ID \
  -H "Cookie: inpsyq_dev_user=TEAMLEAD_USER_ID; inpsyq_selected_org=ORG_ID"
```

### EXECUTIVE → Admin API (expect 403)
```bash
curl http://localhost:3001/api/admin/employees \
  -H "Cookie: inpsyq_dev_user=EXECUTIVE_USER_ID; inpsyq_selected_org=ORG_ID"
```

## Finding Test User IDs

```sql
-- Find users by role
SELECT u.user_id, u.email, m.role, m.org_id, m.team_id
FROM users u
JOIN memberships m ON u.user_id = m.user_id
WHERE m.role IN ('EMPLOYEE', 'TEAMLEAD', 'EXECUTIVE', 'ADMIN')
ORDER BY m.role;
```
