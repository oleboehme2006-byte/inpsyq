# Phase 26.0 Admin Setup Runbook

## Using the Setup Wizard

### Access
1. Log in as ADMIN user
2. Navigate to `/admin/setup`
3. Complete steps A through E in order

### Step A: Org Selected
- Confirms you have a valid org selected
- Click "Switch Org" to change organizations

### Step B: Teams Created
- At least 1 active team required
- Click "Manage Teams" to create teams

### Step C: Access Configured
- Invite users via "Invite Users" link
- If email is disabled, invites won't be sent but can still be created

### Step D: Weekly Pipeline
- Click "Run Weekly" to generate data
- Use **dry-run mode** first to test without changes
- Pipeline generates aggregates and interpretations

### Step E: Dashboards Ready
- Check that Executive and Team dashboards have data
- Click links to view actual dashboards

## Local Testing

### Prerequisites
```bash
# Start dev server
npm run dev -- -p 3001

# Seed fixtures (if needed)
npx tsx scripts/ensure_dev_fixtures.ts
```

### Set Dev Cookies
In browser console:
```javascript
// Replace with actual IDs from fixtures
document.cookie = 'inpsyq_dev_user=<admin-user-id>; path=/'
document.cookie = 'inpsyq_selected_org=<org-id>; path=/'
```

### Navigate
```
http://localhost:3001/admin/setup
```

## Production Usage

1. Admin logs in via magic link
2. Selects organization (if multiple)
3. Navigates to `/admin/setup`
4. Follows wizard steps
5. Uses "Run Weekly" with dry-run first
6. Disables dry-run and runs for real

## Troubleshooting

### "Failed to fetch status"
- Check network tab for 401/403 errors
- Verify you're logged in as ADMIN
- Verify org is selected

### Run Weekly shows "LOCKED"
- Another run is in progress
- Wait 30 minutes or check `/admin/system/weekly` for stuck runs

### Dashboards show CRITICAL
- Run weekly pipeline first
- Check Step D for pipeline status
- Verify teams exist and have members

## API Quick Reference

### Check Status
```bash
curl http://localhost:3001/api/admin/setup/status \
  -H "Cookie: inpsyq_dev_user=...; inpsyq_selected_org=..."
```

### Run Weekly (dry-run)
```bash
curl -X POST http://localhost:3001/api/admin/system/run-weekly \
  -H "Content-Type: application/json" \
  -H "Cookie: inpsyq_dev_user=...; inpsyq_selected_org=..." \
  -d '{"week_offset": -1, "dry_run": true}'
```
