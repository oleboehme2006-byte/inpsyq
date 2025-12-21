# RUNBOOK: Session Simulation (Dev)

## Quick Start

```bash
# 1. Start dev server
npm run dev

# 2. Terminal 2: Seed + simulate
npm run seed:dev
npm run sim:dev:small
```

---

## Stable IDs (Same Every Run)

> **Note:** Fixture UUIDs must be valid v4/variant format to pass validation.
> Format: `xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx` (4=version, 8=variant)

| Entity | UUID |
|--------|------|
| Org | `11111111-1111-4111-8111-111111111111` |
| Team 1 | `22222222-2222-4222-8222-222222222201` |
| Team 2 | `22222222-2222-4222-8222-222222222202` |
| User 1 | `33333333-3333-4333-8333-000000000001` |

Get IDs programmatically:
```bash
npm run ids
```

---

## Commands

| Command | Users | Weeks | Purpose |
|---------|-------|-------|---------|
| `npm run seed:dev` | — | — | Create stable org/teams/users |
| `npm run sim:dev:small` | 3 | 2 | Quick smoke test |
| `npm run sim:dev` | 10 | 4 | Full simulation |

---

## Verification

```bash
# Check data pipeline
ORG=11111111-1111-4111-8111-111111111111
TEAM=22222222-2222-4222-8222-222222222201

curl -s "http://localhost:3001/api/internal/diag/team-stats?org_id=$ORG&team_id=$TEAM" | jq

# Expected after sim:dev:small:
# sessions: 6+ (3 users × 2 weeks)
# responses: 60+ (10 per session)
# diagnosis: ["OK: data pipeline appears healthy"]
```

```bash
# Check dashboard
curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG&team_id=$TEAM" | jq '.audit'

# Expected:
# sessions_count > 0
# participation_rate > 0
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `INVALID_USERID` | UUID format invalid | Fixtures updated to v4 format |
| `sessions: 0` after sim | Server not running | Start `npm run dev` first |
| `NO_USERS` | Seed not run | Run `npm run seed:dev` |
| Timeout errors | Concurrency too high | Set `SIM_CONCURRENCY=1` |

---

## Environment Variables

| Var | Default | Description |
|-----|---------|-------------|
| `APP_URL` | `http://localhost:3001` | Target server |
| `SIM_USERS` | 10 | Users to simulate |
| `SIM_WEEKS` | 4 | Weeks to simulate |
| `SIM_CONCURRENCY` | 2 | Parallel requests |

---

## UUID Format Requirements

Fixture UUIDs must be valid v4/variant UUIDs:
- Position 13 (3rd group, 1st char): `4` (version 4)
- Position 17 (4th group, 1st char): `8`, `9`, `a`, or `b` (RFC variant)

Example: `11111111-1111-4111-8111-111111111111`
                      ^    ^
                      |    +-- variant (8)
                      +------- version (4)
