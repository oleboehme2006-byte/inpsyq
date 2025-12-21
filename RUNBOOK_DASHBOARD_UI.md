# RUNBOOK: Dashboard UI

## Quick Start

```bash
# 1. Start server
npm run dev

# 2. Seed + simulate + aggregate (9 weeks)
npm run sim:dev:ready

# 3. Open dashboards
open http://localhost:3001/admin/teamlead
open http://localhost:3001/admin/executive
```

In dev mode, teamlead dashboard **auto-fills** stable IDs and loads on mount.

---

## Stable Dev IDs

```
ORG_ID  = 11111111-1111-4111-8111-111111111111
TEAM_ID = 22222222-2222-4222-8222-222222222201
```

These are persisted in `localStorage` after first use.

---

## Teamlead Dashboard

**Route:** `/admin/teamlead`

**Layout:**
- **Row A** — Index panels (strain, trust gap, withdrawal, coverage)
- **Row B** — Uncertainty band time-series (9 weeks)
- **Row C** — Causal graph + Risk space

**Interactions:**
- Hover index → see semantic label
- Hover week → cross-highlight drivers
- Click node → pin detail

---

## Executive Dashboard

**Route:** `/admin/executive`

**Layout:**
- Org-level indices (LatentField)
- Team portfolio grid (mini LatentField per team)
- Systemic patterns (CausalGraph)

**Actions:**
- Click team → navigate to teamlead

---

## Verification

```bash
# API check
npm run verify:dashboard_ui

# Manual check
curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG&team_id=$TEAM" | jq '{range: .meta.range_weeks, state: .state.label}'
```

**Expected:** `range_weeks >= 8`, `state.label != UNKNOWN`

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty dashboard | No data loaded | Check `npm run sim:dev:ready` |
| Auto-fill not working | Not in dev mode | Set `NODE_ENV=development` |
| IDs reset on reload | localStorage cleared | Re-enter IDs |
| range_weeks = 0 | No aggregates | Run `npm run agg:dev` |

---

## Checklist

- [ ] `npm run sim:dev:ready` completes
- [ ] Teamlead loads with auto-filled IDs
- [ ] Index panels show non-zero values
- [ ] Uncertainty band shows 9 weeks
- [ ] Causal graph nodes are interactive
- [ ] Executive shows team grid
- [ ] Click team navigates to teamlead
