# Phase 24.3 E2E Troubleshooting Runbook

## Common Failures & Fixes

### "fixtures.json not found"
**Cause**: Fixtures not seeded before browser tests.
**Fix**: Run `npx tsx scripts/ensure_dev_fixtures.ts` first.

### "EMPLOYEE saw admin-home content"
**Cause**: Admin page gate not working.
**Check**:
1. Verify `app/(admin)/layout.tsx` exists with `resolveAuthContext()` gate
2. Check cookies are being set correctly in tests

### "Data Unavailable" on dashboards
**Cause**: No weekly aggregates for current week.
**Fix**: Ensure fixtures script ran successfully. Check `org_aggregates_weekly` table.

### Connection refused to localhost:3001
**Cause**: Dev server not running.
**Fix**: Start server in separate terminal: `npm run dev -- -p 3001`

### Test passes locally but fails in CI
**Cause**: Dev cookies require `NODE_ENV=development`.
**Fix**: E2E tests are designed for local dev only.

## Manual Cookie Testing

```javascript
// In browser console on localhost:3001
document.cookie = 'inpsyq_dev_user=USER_ID; path=/';
document.cookie = 'inpsyq_selected_org=ORG_ID; path=/';
location.reload();
```

## Verifying Redirects

| From | User Role | Expected Redirect |
|------|-----------|-------------------|
| /admin | EMPLOYEE | /session |
| /admin | TEAMLEAD | /team/<teamId> |
| /admin | EXECUTIVE | /executive |
| /executive | EMPLOYEE | /session |
| /team/<other> | TEAMLEAD | forbidden or /team/<own> |

## Re-running Individual Scenarios

The E2E script runs all scenarios sequentially. To debug a specific one:
1. Add `return` after the failing scenario in the `main()` function
2. Run `npm run verify:phase24.3:browser`
3. Check the screenshot in `artifacts/phase24_3/`
