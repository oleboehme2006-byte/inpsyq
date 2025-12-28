# Phase 7: Dashboard Integration

## Overview

Dashboards now consume real weekly products from Phase 6.
No mock data. Deterministic. Cache-safe.

## Files Created

### Read Services (`services/dashboard/`)
| File | Purpose |
|------|---------|
| `cache.ts` | In-memory cache with TTL |
| `teamReader.ts` | Team dashboard data reader |
| `executiveReader.ts` | Executive dashboard aggregator |

### API Routes
| Route | Guard | Purpose |
|-------|-------|---------|
| `/api/dashboard/team` | TEAMLEAD/ADMIN | Team dashboard data |
| `/api/dashboard/executive` | EXECUTIVE/ADMIN | Org-level dashboard |
| `/api/internal/diag/dashboard-ready` | Internal | Data availability check |

## Data Flow

```
org_aggregates_weekly (Phase 6)
       ↓
teamReader / executiveReader
       ↓
API routes (guarded)
       ↓
Dashboard UI
```

## Verification

```bash
npm run verify:phase7
```

## API Examples

```bash
# Team dashboard
curl "http://localhost:3001/api/dashboard/team?org_id=...&team_id=..." \
  -H "X-DEV-USER-ID: ..."

# Executive dashboard
curl "http://localhost:3001/api/dashboard/executive?org_id=..." \
  -H "X-DEV-USER-ID: ..."

# Data availability check
curl "http://localhost:3001/api/internal/diag/dashboard-ready?org_id=..."
```

## Guarantees

- **No mock data** — All values from weekly products
- **Deterministic** — Same input → same output
- **Cache-safe** — Invalidates on input_hash change
- **RBAC enforced** — Access guards on all routes
