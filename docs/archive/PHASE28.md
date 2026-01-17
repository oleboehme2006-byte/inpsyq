# Phase 28: Staging + CI + Compliance Foundation

## Overview
Brings the system from "production-working" to "production-operable & enterprise-ready".

## Part A: Staging Environment

### Environment Abstraction
- `lib/env/appEnv.ts` - APP_ENV detection (development/staging/production)
- Functions: `getAppEnv()`, `isStaging()`, `isProduction()`, `isDevelopment()`
- Staging safety validation: `validateStagingSafety()`, `assertStagingSafe()`

### Required ENV Variables (Staging)
| Variable | Value |
|----------|-------|
| `NODE_ENV` | production |
| `APP_ENV` | staging |
| `NEXT_PUBLIC_APP_ENV` | staging |
| `DATABASE_URL` | Staging Neon DB |
| `EMAIL_PROVIDER` | disabled |

### Staging Safety Rules
- EMAIL_PROVIDER must be "disabled" in staging
- Slack alerts prefixed with "[STAGING]"
- Production DB patterns blocked

## Part B: CI Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)
1. Install dependencies (locked)
2. Typecheck
3. Lint
4. Build
5. E2E UI Gate (on PRs)

### Release Flow
- `main` → Production
- `staging` → Staging (optional)

## Part C: Compliance Foundation

### Legal Pages
- `/privacy` - Privacy Policy (Data Processor role)
- `/imprint` - EU-compliant Impressum
- `/terms` - B2B Terms of Service

### Data Retention (`lib/compliance/retention.ts`)
| Category | Retention |
|----------|-----------|
| Session Data | 12 months |
| Aggregates | Indefinite |
| Invites | 72 hours |
| Audit Logs | 24 months |

### DPA Template
- `docs/DPA.md` - Data Processing Agreement skeleton

## Verification
```bash
npm run build
npm run lint
npm run preflight:prod
```

## Files Added
- `lib/env/appEnv.ts`
- `lib/compliance/retention.ts`
- `app/(public)/privacy/page.tsx`
- `app/(public)/imprint/page.tsx`
- `app/(public)/terms/page.tsx`
- `.github/workflows/ci.yml`
- `docs/DPA.md`
