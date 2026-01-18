# RUNBOOK: Bootstrap Dev Environment

## Quick Start (One Command)

```bash
# Start dev server first
npm run dev

# In another terminal:
npm run bootstrap:dev
```

This will:
1. Create 1 org, 1 team, 5 users
2. Run 3 sessions per user through /api/session/start and /api/session/submit
3. Populate latent_states via inference
4. Print IDs for testing

---

## Verify Bootstrap Success

```bash
# Get IDs
npm run ids

# Check team stats
IDS=$(curl -s http://localhost:3001/api/internal/ids)
ORG=$(echo $IDS | jq -r '.orgId')
TEAM=$(echo $IDS | jq -r '.teamId')

curl -s "http://localhost:3001/api/internal/diag/team-stats?org_id=$ORG&team_id=$TEAM" | jq

# Expected output:
# - sessions: 15+ (3 per user × 5 users)
# - responses: 100+ (10 per session × 15)
# - latent_states: > 0
# - diagnosis: ["OK: data pipeline appears healthy"]
```

---

## Test Dashboard

```bash
# API
curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG&team_id=$TEAM" | jq '.audit'

# Expected:
# - sessions_count > 0
# - participation_rate > 0

# UI
# 1. Open http://localhost:3001/admin/teamlead
# 2. Click "Auto-fill from /api/internal/ids"
# 3. Click "Load Data"
# → Should render dashboard with indices
```

---

## Root Cause Analysis

| Symptom | Cause | Fix |
|---------|-------|-----|
| "IDs not accepted" | DemoConfig required weekStart from dropdown | Changed to date input with default |
| sessions_count=0 | Sessions exist but org/team mismatch | Verified FK relationships in seed |
| No indices | No latent states | Bootstrap runs sessions through API |
| Silent nothing | No error display | Added UUID validation + error messages |

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `seed:dev` | Create org/team/users only |
| `bootstrap:dev` | Seed + run synthetic sessions |
| `ids` | Get org/team/user UUIDs |

---

## Cold Start Behavior (Production)

In production, new orgs with no sessions will see:
- `sessions_count: 0`
- `state.label: UNKNOWN`
- Indices at baseline (0.5)
- "Gather More Data" implied through governance

This is correct. The bootstrap script is DEV-ONLY and does not affect production behavior.
