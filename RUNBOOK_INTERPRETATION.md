# RUNBOOK: Interpretation Layer

## Prerequisites

```bash
# Ensure weekly products exist
npm run pipeline:dev:rebuild

# Env vars
DATABASE_URL=...
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run interpretations:dev:rebuild` | Generate interpretations for fixture teams |
| `npm run verify:phase9` | Verify policy, validation, schema |

---

## API Examples

### Team Interpretation
```bash
curl -s "http://localhost:3001/api/interpretation/team?org_id=11111111-1111-4111-8111-111111111111&team_id=22222222-2222-4222-8222-222222222201" \
  -H "X-DEV-USER-ID: 33333333-3333-4333-8333-0000000000001" | jq
```

### Executive Interpretation
```bash
curl -s "http://localhost:3001/api/interpretation/executive?org_id=11111111-1111-4111-8111-111111111111" \
  -H "X-DEV-USER-ID: 33333333-3333-4333-8333-0000000000001" | jq
```

### Diagnostics
```bash
curl -s "http://localhost:3001/api/internal/diag/interpretation?org_id=11111111-1111-4111-8111-111111111111" \
  -H "X-DEV-USER-ID: 33333333-3333-4333-8333-0000000000001" | jq
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `NO_WEEKLY_PRODUCT` | No Phase 6 data | Run `npm run pipeline:dev:rebuild` |
| `INTERPRETATION_VALIDATION_FAILED` | Output failed validation | Check error details |
| Cache always misses | input_hash changing | Verify weekly product stability |

---

## Cache Behavior

- First call: generates + caches
- Repeat call (same hash): returns cached
- Data changes (new hash): regenerates + updates

Check cache status:
```bash
curl ... /api/internal/diag/interpretation | jq '.stats'
```
