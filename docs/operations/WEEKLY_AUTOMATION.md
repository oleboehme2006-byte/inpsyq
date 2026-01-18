# Weekly Automation

## Overview

The Weekly Automation pipeline (`runWeekly`) is the autonomous heartbeat of InPsyq. It transitions the system from one week to the next, processing data, generating insights, and updating artifacts.

## Architecture

```
Trigger (Cron/Manual)
  ↓
Endpoint (/api/internal/run-weekly)
  ↓
WeeklyRunner (Orchestrator)
  ├─ Locking (weekly_locks)
  ├─ Input Hashing (Idempotency)
  ├─ Stage 1: Aggregation (Orgs -> Teams)
  ├─ Stage 2: Attribution
  └─ Stage 3: Interpretation (LLM)
```

## Orchestration

### Locking (`daily/weekly_locks`)
- **Granularity**: Per Scope (full run, or org-specific) + Week
- **TTL**: 10 minutes (failsafe)
- **Behavior**: Fast-fail if lock usage detected.

### Concurrency
- **Organization Level**: Serial execution (one org at a time to manage load)
- **Team Level**: Bounded parallelism (default: 3 teams max concurrent)
- **Timeouts**: 
  - Team processing: 5s soft timeout
  - Total run: Vercel functions execution limit (check env)

### Idempotency
Every stage computes an `input_hash` of its dependencies.
- **Aggregates**: Hash of measurement answers
- **Attribution**: Hash of aggregates + dependency graph
- **Interpretation**: Hash of attribution + prompts

**Invariant**: If `input_hash` matches existing record, processing is SKIPPED. This allows safe re-runs of the entire pipeline.

## Pipeline Stages

### 1. Rollup (Aggregation)
- **Input**: Raw `measurement_responses`
- **Process**: Compute standard scores, breakdown by factors
- **Output**: `weekly_aggregates` table

### 2. Series & Attribution
- **Input**: `weekly_aggregates`, `team_dependencies`
- **Output**: `team_series`, `attribution_results` (in-memory/Blob)

### 3. Interpretation
- **Input**: Attribution results, trends
- **Process**: LLM Generation (OpenAI)
- **Output**: `weekly_interpretations` table

## Triggering

### Automatic (Cron)
Vercel Cron calls `POST /api/internal/run-weekly` every Monday 02:00 UTC.

### Manual (Ops)
```bash
curl -X POST https://www.inpsyq.com/api/internal/run-weekly \
  -H "X-CRON-SECRET: $INTERNAL_CRON_SECRET" \
  -d '{"mode": "FULL"}'
```

## Modes

| Mode | Use Case |
|------|----------|
| `FULL` | Standard weekly run. Do everything. |
| `PIPELINE_ONLY` | Re-compute numbers but DO NOT generate text (saves $$$). |
| `INTERPRETATION_ONLY` | Re-generate text from existing numbers (prompt tuning). |

## Failure Handling

- **Atomic Interpretation**: Text generation fails -> Transaction rollback.
- **Resilience**: One team failing does NOT stop others.
- **Alerting**: Failure logs to `weekly_runs`, webhook sent to Slack.

## Monitoring

Check `/api/internal/diag/weekly-runs` for run history and failure rates.
