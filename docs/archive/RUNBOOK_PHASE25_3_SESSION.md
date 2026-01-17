# Phase 25.3 Session Runbook

## Employee Session Flow

### Normal Flow
1. Employee logs in (magic link or dev cookie)
2. Navigate to `/employee/session`
3. Click "Start Session"
4. Answer questions (progress auto-saved)
5. Submit on last question
6. See success confirmation

### Role Gating
- EMPLOYEE: Access granted to `/employee/*`
- TEAMLEAD: Redirected to `/team/{teamId}`
- EXECUTIVE: Redirected to `/executive`
- ADMIN: Redirected to `/admin`

### Autosave
- Progress saved to localStorage after each question
- Key format: `inpsyq_session_draft_v1`
- Saved data: responses array, currentIndex
- Cleared on successful submit

### Week Start Logic
The session status uses "last completed week":
- Example: If today is Wednesday Jan 8, week_start = Monday Jan 6
- Consistent with weekly pipeline expectations

## Troubleshooting

### "Could not start session"
- Check if user has valid membership in selected org
- Verify user role is EMPLOYEE
- Check browser console for API errors

### Session not saving
- Check if localStorage is available
- Clear localStorage and retry
- Check for storage quota exceeded

### Redirect loop
- Clear cookies: `inpsyq_dev_user`, `inpsyq_selected_org`
- Re-login with correct role

## Testing Locally
```bash
# Start dev server
npm run dev -- -p 3001

# Set dev cookies (adjust user/org IDs as needed)
# Browser console:
document.cookie = 'inpsyq_dev_user=employee-user-id; path=/'
document.cookie = 'inpsyq_selected_org=org-id; path=/'

# Navigate to http://localhost:3001/employee/session
```

## API Quick Reference

### Check Status
```bash
curl http://localhost:3001/api/session/status \
  -H "Cookie: inpsyq_dev_user=...; inpsyq_selected_org=..."
```

### Start Session
```bash
curl -X POST http://localhost:3001/api/session/start \
  -H "Content-Type: application/json" \
  -H "Cookie: inpsyq_dev_user=...; inpsyq_selected_org=..." \
  -d '{}'
```
