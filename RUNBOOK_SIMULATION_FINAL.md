# RUNBOOK: Final Simulation Pipeline

## Stable IDs

| Entity | UUID |
|--------|------|
| **Org** | `11111111-1111-4111-8111-111111111111` |
| **Team 1** | `22222222-2222-4222-8222-222222222201` |
| **Team 2** | `22222222-2222-4222-8222-222222222202` |

---

## One-Command Setup

```bash
# Terminal 1
npm run dev

# Terminal 2 (full 9-week simulation)
npm run sim:dev:ready
```

**Pipeline:** `seed:dev` → `sim:dev` → `agg:dev` → `verify:sim` → `verify:dashboard`

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run seed:dev` | Create org/teams/users |
| `npm run sim:dev` | 9 weeks × 10 users |
| `npm run sim:dev:small` | 2 weeks × 3 users (quick) |
| `npm run agg:dev` | Build employee_profiles + org_aggregates_weekly |
| `npm run verify:sim` | Check sessions + responses > 0 |
| `npm run verify:dashboard` | Check aggregates + indices |
| `npm run verify:temporal` | Show week distribution |

### Custom Week Count

```bash
npx tsx scripts/simulate_sessions_dev.ts --weeks 12 --users 15
```

---

## Verification

```bash
ORG=11111111-1111-4111-8111-111111111111
TEAM=22222222-2222-4222-8222-222222222201

# Counts (expect aggregates >= 9)
curl -s "http://localhost:3001/api/internal/diag/team-stats?org_id=$ORG&team_id=$TEAM" | jq '.counts'

# Dashboard (expect range_weeks >= 8)
curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG&team_id=$TEAM" | jq '{range_weeks: .meta.range_weeks, state: .state.label, indices: .indices}'
```

**Expected:**
```json
{
  "range_weeks": 9,
  "state": "HEALTHY",
  "indices": {
    "strain_index": 0.12,
    "withdrawal_risk": 0.09,
    "trust_gap": 0.07
  }
}
```

---

## Data Flow

```
sessions → latent_states → employee_profiles → org_aggregates_weekly → Dashboard
              (sim:dev)        (agg:dev)            (agg:dev)          (decision)
```

**Week Convention:** Monday (ISO week start), UTC midnight

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `aggregates = 0` | Aggregation not run | `npm run agg:dev` |
| `range_weeks = 0` | Aggregates missing | `npm run agg:dev` |
| `range_weeks = 1` | Only 1 week simulated | Increase `--weeks` |
| `indices all 0` | Profiles < k_threshold | Need ≥7 users |
| `state = UNKNOWN` | No decision data | Run full pipeline |
| Timezone issues | Local vs UTC | All dates use UTC |
