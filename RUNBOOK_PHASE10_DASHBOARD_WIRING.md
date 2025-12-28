# RUNBOOK: Phase 10 Dashboard Wiring

## Overview

Dashboard pages fetch real data from Phase 7 APIs. No silent mocks.

---

## Quick Start

```bash
npm run pipeline:dev:rebuild       # Generate weekly products
npm run interpretations:dev:rebuild # Generate interpretations (optional)
npm run dev                         # Start server
npm run verify:phase10.1            # Verify wiring
```

---

## Phase 10.1: Strict Mock Gating

- **Mock OFF by default** — requires real API data
- **MOCK DATA badge** — visible when mocks active
- **Error states** — shown when API fails and mocks disabled

### Enable Mocks (dev only)

```bash
NEXT_PUBLIC_DASHBOARD_DEV_MOCKS=true npm run dev
```

---

## API Endpoints

| Dashboard | API |
|-----------|-----|
| Executive | `GET /api/dashboard/executive?org_id=...` |
| Team | `GET /api/dashboard/team?org_id=...&team_id=...` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Data Unavailable" | `npm run pipeline:dev:rebuild` |
| 403 error | Check X-DEV-USER-ID header |
| MOCK DATA badge | Unset `NEXT_PUBLIC_DASHBOARD_DEV_MOCKS` |
