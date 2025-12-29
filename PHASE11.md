# Phase 11 — Weekly Automation Layer

Autonomous weekly cycle for production-ready weekly product + interpretation generation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    POST /api/internal/run-weekly            │
│                    (x-cron-secret required)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    services/weeklyRunner/runner.ts          │
│                                                             │
│  runWeekly({ orgId?, weekStart?, options })                │
│    ├─ getCanonicalWeek()                                   │
│    ├─ startRun()  [audit]                                  │
│    ├─ for each org:                                        │
│    │    └─ runWeeklyForOrg()                               │
│    │         └─ for each team (bounded concurrency):       │
│    │              └─ runWeeklyForTeam()                    │
│    │                   ├─ runWeeklyRollup() [Phase 6]      │
│    │                   └─ getOrCreateTeamInterpretation()  │
│    │                                         [Phase 9]     │
│    └─ finishRun()  [audit]                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

| File | Purpose |
|------|---------|
| `lib/week.ts` | Canonical week resolution (ISO Monday UTC) |
| `services/weeklyRunner/runner.ts` | Main orchestrator |
| `services/weeklyRunner/audit.ts` | Persistent run logging |
| `services/weeklyRunner/types.ts` | Type definitions |
| `app/api/internal/run-weekly/route.ts` | Secure trigger endpoint |
| `app/api/internal/diag/weekly-runs/route.ts` | Diagnostics API |

---

## Idempotency

- Pipeline uses `input_hash` — skips if unchanged
- Interpretation uses `input_hash` — skips if unchanged
- Safe to re-run any number of times

---

## Security

- Endpoint requires `X-CRON-SECRET` header
- Must match `INTERNAL_CRON_SECRET` env var
- No user authentication (internal-only)

---

## Concurrency

- Default: 3 teams in parallel
- Per-team timeout: 5 seconds
- Total run timeout: 5 minutes
- Team failures do NOT abort org run

---

## Audit

Persistent `weekly_runs` table stores:
- Run ID, week, scope
- Start/finish times
- Counts (orgs, teams, upserts, skips)
- Status (completed/partial/failed)
- Details (per-org breakdown)
