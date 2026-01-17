# Phase 25.2 Admin Ops Runbook

## Teams Management

### Create a Team
1. Go to `/admin/teams`
2. Enter team name (2-100 chars)
3. Click "Create Team"

### Rename a Team
1. Click "Rename" on the team row
2. Edit the name
3. Click "Save"

### Archive a Team
1. Click "Archive" on the team row
2. Confirm when prompted

> Archived teams remain in the database but are hidden from active lists.

## Viewing Health

### Current Coverage
Go to `/admin/org/health` to see:
- Target week (last completed week)
- Team counts: OK, degraded, failed
- Missing products/interpretations
- Stuck locks

Click "Refresh" to update.

## Weekly Runs

Go to `/admin/system/weekly` to see:
- Pipeline execution history
- Status per run
- Error messages for failed runs

## Alerts

Go to `/admin/system/alerts` to see:
- Current computed alerts (real-time)
- Stored historical alerts (if table exists)
- COVERAGE_GAP details with affected counts

## Troubleshooting

### "Failed to load" errors
Check browser console. Ensure you're logged in as ADMIN with an org selected.

### Team creation fails with "duplicate"
Team names must be unique per organization (case-insensitive).

### No weekly runs showing
Weekly runs appear after the Monday cron executes. Check GitHub Actions history.
