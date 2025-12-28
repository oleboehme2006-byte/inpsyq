# Phase 9: Weekly Interpretation Layer

## Overview

Token-efficient, cached interpretations from Phase 6 weekly products.

## Architecture

```
Phase 6 Weekly Products
        ↓
Phase 7 Dashboard Readers
        ↓
Interpretation Input (strict subset)
        ↓
Policy Evaluation → Generator → Validation
        ↓
weekly_interpretations table (cached)
        ↓
API endpoints → Dashboard panels
```

## Files

### Library (`lib/interpretation/`)
| File | Purpose |
|------|---------|
| `types.ts` | Sections structure, severity/impact types |
| `input.ts` | Input contract from weekly products |
| `policy.ts` | Action gating rules |
| `schema.ts` | Database migration |
| `hash.ts` | Idempotency hashing |
| `validate.ts` | Output validation |
| `generator.ts` | LLM + deterministic fallback |

### Service
| File | Purpose |
|------|---------|
| `services/interpretation/service.ts` | Cache + generation orchestration |

### API Routes
| Route | Guard |
|-------|-------|
| `/api/interpretation/team` | TEAMLEAD+ |
| `/api/interpretation/executive` | EXEC/ADMIN |
| `/api/internal/diag/interpretation` | Internal |

## Policy Rules

1. **External dominance** → no internal actions
2. **All stable/low** → monitor only (max 1 focus)
3. **No C2+/D2+** → no urgent actions

## Idempotency

- Cache keyed by `(org_id, team_id, week_start, input_hash)`
- Same hash → return cached (no regeneration)
- Hash changes → new row, flip `is_active`

## Validation

- Shape validation (word counts, item limits)
- Grounding validation (no invented entities)
- Numeric spam guard (max 6 numbers)
- Policy compliance
