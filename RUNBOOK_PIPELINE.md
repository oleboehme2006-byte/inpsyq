# RUNBOOK: Pipeline

## Overview

The pipeline produces weekly dashboard products from measurement data using Phase 3+4 deterministic logic.

## Prerequisites

```bash
# Env vars
DATABASE_URL=...   # Required
NODE_ENV=development

# Run simulation first
npm run sim:dev:ready
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run pipeline:dev:rebuild` | Rebuild weekly products for dev fixtures |
| `npm run verify:phase6:idempotency` | Verify idempotency (run twice, assert no duplicates) |
| `npm run verify:phase6:coverage` | Verify coverage (weeks, attribution, series) |

---

## Workflow

```bash
# 1. Seed & simulate
npm run seed:dev
npm run sim:dev
npm run agg:dev

# 2. Run pipeline
npm run pipeline:dev:rebuild

# 3. Verify
npm run verify:phase6:idempotency
npm run verify:phase6:coverage
```

---

## Diagnostics Endpoint

```bash
# Dev (with auth header)
curl -s "http://localhost:3001/api/internal/diag/pipeline?org_id=11111111-1111-4111-8111-111111111111" \
  -H "X-DEV-USER-ID: 33333333-3333-4333-8333-0000000000001" | jq

# Response
{
  "request_id": "...",
  "org_id": "...",
  "team_id": "all",
  "latest_week_start": "2024-12-23",
  "rows": [
    { "week_start": "2024-12-23", "compute_version": "v2.0.0", "input_hash": "abc123..." }
  ],
  "counts": { "weeks": 12 }
}
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `No weekly product rows` | Pipeline not run | Run `npm run pipeline:dev:rebuild` |
| `no_data` reason | No sessions for that week | Run `npm run sim:dev` first |
| `hash_match` reason | Idempotent skip (normal) | Data unchanged, nothing to do |
| Missing attribution | Driver validation failed | Check driver-index mapping |

---

## Idempotency

The pipeline uses SHA-256 hashing of canonical input data:
- Same inputs → same `input_hash`
- If hash matches existing row → skip heavy UPSERT
- Safe to re-run any time
