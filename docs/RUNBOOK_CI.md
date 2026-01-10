# CI Pipeline Runbook

## Overview
GitHub Actions workflow for automated testing and deployment gates.

## Workflow File
`.github/workflows/ci.yml`

## Pipeline Stages

| Stage | Purpose | Blocks Merge |
|-------|---------|--------------|
| Install | Lock dependencies | ✓ |
| Typecheck | TypeScript errors | ✓ |
| Lint | Code style | ✓ |
| Build | Production build | ✓ |
| E2E UI Gate | Browser tests | ✓ (PRs) |

## Triggers

- **Push to main/staging**: Full pipeline
- **Pull Request to main**: Full pipeline + E2E

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL_TEST` | Test database connection |
| `INTERNAL_ADMIN_SECRET_TEST` | Test admin auth |
| `INTERNAL_CRON_SECRET_TEST` | Test cron auth |

## Local Verification

```bash
# Run the same checks locally
npm ci
npx tsc --noEmit
npm run lint
npm run build

# E2E (requires fixtures + dev server)
npx tsx scripts/ensure_dev_fixtures.ts
npm run dev -- -p 3001 &
npx tsx scripts/verify_phase27_1_ui_gate_e2e.ts
```

## Troubleshooting

### Build fails
1. Check TypeScript errors: `npx tsc --noEmit`
2. Check lint errors: `npm run lint`

### E2E fails
1. Check fixtures exist
2. Verify server starts correctly
3. Check artifacts for screenshots
