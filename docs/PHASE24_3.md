# Phase 24.3: Playwright E2E RBAC Proof

## Overview
Phase 24.3 provides browser E2E proof that RBAC is correctly enforced with screenshots as evidence.

## Prerequisites
- Dev server running: `npm run dev -- -p 3001`
- Playwright installed (auto-installed with dependencies)

## How to Run

```bash
# Run full E2E suite (fixtures + browser tests)
npm run verify:phase24.3

# Or run steps individually:
npx tsx scripts/ensure_dev_fixtures.ts  # Create test users
npm run verify:phase24.3:browser         # Run Playwright tests
```

## What It Proves

| Scenario | Test | Expected Outcome |
|----------|------|-----------------|
| EMPLOYEE → /session | Access | `session-page` visible |
| EMPLOYEE → /admin | Blocked | No `admin-home`, redirected |
| EMPLOYEE → /executive | Blocked | No `org-title`, redirected |
| TEAMLEAD → own team | Access | `team-title` visible |
| TEAMLEAD → other team | Blocked | Forbidden or redirect |
| TEAMLEAD → /admin | Blocked | Redirect to team home |
| EXECUTIVE → /executive | Access | `org-title` visible |
| EXECUTIVE → /admin | Blocked | Redirect to /executive |
| ADMIN → /admin | Access | `admin-home` visible |
| ADMIN → /executive | Access | `org-title` visible |
| MULTI-ORG | Flow | /org/select shown, cookie set after selection |

## Artifacts

All artifacts saved to `artifacts/phase24_3/`:

| File | Description |
|------|-------------|
| `fixtures.json` | Test user IDs and org/team IDs |
| `summary.json` | Test results with pass/fail |
| `*.png` | Screenshots for each scenario |

## Test Users Created

| Role | User ID | Org | Team |
|------|---------|-----|------|
| EMPLOYEE | `...-0001` | Org A | Engineering |
| TEAMLEAD | `...-0002` | Org A | Engineering |
| EXECUTIVE | `...-0003` | Org A | - |
| ADMIN | `...-0004` | Org A | Engineering |
| MULTI_ORG | `...-0005` | Org A + B | - |
