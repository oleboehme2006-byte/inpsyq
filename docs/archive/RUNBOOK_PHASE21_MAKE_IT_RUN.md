# Phase 21 Runbook: Make-It-Run Troubleshooting

Quick fixes for common Phase 21 issues.

---

## Landing Page Doesn't Load

**Symptom**: `GET /` returns non-200 or connection refused

**Check**:
```bash
# Is server running?
lsof -i :3001

# Check for startup errors
npm run dev 2>&1 | head -50
```

**Fixes**:
1. **Port in use**: Kill existing process or use different port
2. **Build error**: Run `npm run build` to see errors
3. **Missing deps**: Run `npm ci`

---

## Dashboard Shows "Data Unavailable"

**Symptom**: Executive or Team dashboard shows error state

**Check**:
```bash
npm run verify:phase21:data
```

**Fixes**:
1. **No products**: Run `npm run pipeline:dev:rebuild`
2. **No interpretations**: Run `npm run interpretations:dev:rebuild`
3. **Wrong week**: Check if data exists for current ISO week

---

## "Team Not Found" Error

**Symptom**: `/team/<id>` returns 404

**Check**:
```bash
npm run verify:phase21:team
```

**Fixes**:
1. **Invalid UUID**: Use fixture UUID `22222222-2222-4222-8222-222222222201`
2. **Slug not in fixture map**: Add slug to `lib/teams/resolver.ts` FIXTURE_MAP
3. **DB lookup failed**: Check teams table has `slug` column

---

## API Returns 401 in Browser

**Symptom**: Dashboard API calls fail with Unauthorized

**Check**:
```bash
npm run verify:phase21:auth
```

**Fixes**:
1. **Cookie not set**: Visit `/api/internal/dev/login` first (POST with user_id)
2. **Wrong user ID format**: Must be valid UUID
3. **Not in dev mode**: Ensure `NODE_ENV=development`

---

## Playwright Fails

**Symptom**: Browser verification errors

**Check**:
```bash
# Ensure Playwright browsers installed
npx playwright install chromium

# Run with debug
DEBUG=pw:api npm run verify:phase21:browser
```

**Fixes**:
1. **Timeout**: Increase `timeout` in script or check network
2. **No screenshots**: Ensure `artifacts/phase21/` is writable
3. **Login fails**: Check `/api/internal/dev/login` is accessible

---

## Mock Badge Shows Unexpectedly

**Symptom**: "MOCK DATA" badge visible when mocks should be off

**Check**:
```bash
echo $NEXT_PUBLIC_DASHBOARD_DEV_MOCKS
```

**Fixes**:
1. **Env variable set**: Unset or set to `false`
2. **Cached build**: Restart dev server
3. **.env.local override**: Check file doesn't set `NEXT_PUBLIC_DASHBOARD_DEV_MOCKS=true`

---

## Quick Reference

| Issue | First Command |
|-------|---------------|
| Health gate | `npm run verify:phase21:health` |
| Data missing | `npm run pipeline:dev:rebuild` |
| Auth broken | `npm run verify:phase21:auth` |
| Team 404 | `npm run verify:phase21:team` |
| API errors | `npm run verify:phase21:api` |
| Browser fails | `npx playwright install chromium` |
