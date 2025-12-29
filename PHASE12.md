# Phase 12 — Production Scheduling & Operational Health

Finalizes backend autonomy with production-grade scheduling, locking, backfill, and alerting.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Cron Trigger                            │
│         (Vercel Cron / GitHub Actions / Manual)           │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              POST /api/internal/run-weekly                │
│                                                            │
│  Body: {                                                   │
│    week_start?, week_offset?, org_id?, team_id?,          │
│    mode: FULL|PIPELINE_ONLY|INTERPRETATION_ONLY,          │
│    dry_run: boolean                                        │
│  }                                                         │
└────────────────────────┬───────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
    ┌───────────────┐         ┌───────────────┐
    │  Acquire Lock │         │  Dry Run      │
    │  (weekly_locks)│        │  (no writes)  │
    └───────┬───────┘         └───────────────┘
            │
            ▼
    ┌───────────────────────────────────────┐
    │         Weekly Runner                 │
    │  • Resolve orgs/teams                 │
    │  • Run pipeline (Phase 6)             │
    │  • Run interpretation (Phase 9)       │
    │  • Record audit (weekly_runs)         │
    └───────────────────────────────────────┘
            │
            ▼
    ┌───────────────────────────────────────┐
    │  Release Lock + Send Alert (if fail) │
    └───────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Locking** | Only one run per week/scope at a time |
| **Modes** | FULL, PIPELINE_ONLY, INTERPRETATION_ONLY |
| **Backfill** | Use week_offset for previous weeks |
| **Dry Run** | Validate without writes |
| **Alerting** | Webhook on failures |
| **Health** | /api/internal/health/weekly |

---

## Run Modes

| Mode | Pipeline | Interpretation |
|------|----------|----------------|
| FULL | ✅ | ✅ |
| PIPELINE_ONLY | ✅ | ❌ |
| INTERPRETATION_ONLY | ❌ (requires existing) | ✅ |

---

## New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/internal/run-weekly` | POST | Trigger weekly run |
| `/api/internal/health/weekly` | GET | Health status |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INTERNAL_CRON_SECRET` | Yes | Auth for run endpoint |
| `INTERNAL_ADMIN_SECRET` | Yes | Auth for health/diag |
| `ALERT_WEBHOOK_URL` | No | Failure notifications |
