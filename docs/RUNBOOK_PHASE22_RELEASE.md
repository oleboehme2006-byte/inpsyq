# Runbook: Phase 22 Release (Production Check)

Use this checklist before promoting any build to production.

## 2. Local Verification (Release Candidate)

> **CRITICAL**: The `preflight:prod` script is now self-contained. It will **forcefully kill** anything running on ports 3000/3001. Do not run it while developing.

1.  **Run Full Preflight**
    ```bash
    npm run preflight:prod
    ```
    *Actions*: Cleans ports -> Builds -> Lints -> Starts Server (Prod) -> Verifies -> Stops Server.
    
    *Success Criteria*:
    - "✓ PREFLIGHT COMPLETE (Safe & Deterministic)" printed at end.
    - Exit code 0.

2.  **Manual Dev Verification (Optional)**
    To verify dev-only features (mock safety, dev login):
    ```bash
    npm run dev -p 3001
    npm run verify:phase22:smoke
    # (Ctrl+C to stop)
    ```

## 3. Environment Variables (Vercel/Production)
Ensure these variables are set in your production environment:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | **YES** | Must be `production`. |
| `DATABASE_URL` | **YES** | Connection string for Neon/Postgres. |
| `INTERNAL_ADMIN_SECRET` | **YES** | Secret for `/api/internal/ops` endpoints. |
| `INTERNAL_RUNNER_SECRET` | **YES** | Secret for `/api/internal/run-weekly` cron. |
| `INTERNAL_CRON_SECRET` | **YES** | Matching header value for cron jobs. |
| `NEXT_PUBLIC_DASHBOARD_DEV_MOCKS` | NO | Should be unset or `false`. Hard ignored in prod code, but cleaner to verify. |

## 3. Deployment Verification
After deployment, run the smoke test against the live URL:

```bash
# Replace with your actual production URL
PROD_URL=https://inpsyq-landing.vercel.app INTERNAL_ADMIN_SECRET=your_secret npm run verify:phase22:smoke
```

## 4. Manual Sanity Check
1.  **Visit Root**: Should show Executive Dashboard (or Landing Page).
2.  **Visit `/api/internal/dev/login`**: Should return `404 Not Found`.
3.  **No "MOCK DATA" Banner**: Ensure the yellow warning banner is NOT visible.

## Troubleshooting
- **Build Failures**: Check `verify_phase22_env_gate` output.
- **Health Check 401**: Verify `INTERNAL_ADMIN_SECRET` matches the header used in scripts (default `secret` in dev).
- **Mock Banner Visible**: CRITICAL. Check `NODE_ENV`. It must be `production`.
