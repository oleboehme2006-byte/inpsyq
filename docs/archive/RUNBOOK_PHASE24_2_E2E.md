# Phase 24.2 E2E Testing Runbook

## Prerequisites
- Start dev server: `npm run dev`
- Ensure fixtures exist (run `npx tsx scripts/ensure_dev_fixtures.ts`)

## Manual Browser Testing

### EMPLOYEE Flow
1. Set dev cookies in browser:
   - `inpsyq_dev_user` = Employee user ID
   - `inpsyq_selected_org` = Org ID
2. Navigate to `/session` → Should see `data-testid="session-page"`
3. Navigate to `/admin` → Should redirect to `/session` (not render admin content)
4. Navigate to `/executive` → Should redirect to `/session`

### TEAMLEAD Flow
1. Set dev cookies for TEAMLEAD user
2. Navigate to `/team/<ownTeamId>` → Should see `data-testid="team-title"`
3. Navigate to `/team/<otherTeamId>` → Should be forbidden/redirect
4. Navigate to `/admin` → Should redirect to `/team/<ownTeamId>`

### EXECUTIVE Flow
1. Set dev cookies for EXECUTIVE user
2. Navigate to `/executive` → Should see `data-testid="org-title"`
3. Navigate to `/team/<anyTeam>` → Should see team-title
4. Navigate to `/admin` → Should redirect to `/executive`

### ADMIN Flow
1. Set dev cookies for ADMIN user
2. Navigate to `/admin` → Should see `data-testid="admin-home"`
3. Navigate to `/executive` → Should see org-title
4. All pages accessible

## Finding User IDs for Testing

```sql
SELECT u.user_id, m.role, m.org_id, m.team_id
FROM users u
JOIN memberships m ON u.user_id = m.user_id
ORDER BY m.role;
```

## Cookie Setting (Browser Console)

```javascript
// Set dev user cookie
document.cookie = 'inpsyq_dev_user=USER_ID; path=/';
document.cookie = 'inpsyq_selected_org=ORG_ID; path=/';
```
