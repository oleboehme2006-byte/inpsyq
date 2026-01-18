# Phase 3+4: Aggregation & Driver Attribution Engine

## Overview

Deterministic weekly aggregation and causal attribution infrastructure building on Phase 1+2 registries.

## Files

### Aggregation (`lib/aggregation/`)
- `types.ts` — Core types: WeeklyIndexPoint, TeamTemporalState, DataQualityWeekly
- `week.ts` — ISO week utilities (Monday-based)
- `temporal.ts` — Trend, volatility, regime computation
- `buildSeries.ts` — Team series builder
- `buildOrgSeries.ts` — Org series builder

### Attribution (`lib/attribution/`)
- `types.ts` — Attribution result types
- `input.ts` — Input contract (AttributionInputs)
- `internal.ts` — Internal driver processing
- `external.ts` — External dependency processing (templated explanations)
- `sourceRules.ts` — INTERNAL/EXTERNAL/MIXED dominance
- `propagation.ts` — Propagation risk computation
- `attributionEngine.ts` — Main entry `computeAttribution()`

## Deterministic Rules

### Source Dominance
```
externalMass ≥ 0.60 AND internalMass < 0.35 → EXTERNAL (internal=[])
internalMass ≥ 0.60 AND externalMass < 0.35 → INTERNAL
else → MIXED (cap internal=3, external=2)
```

### Contribution Bands
```
score ≥ 0.60 → MAJOR
score ≥ 0.35 → MODERATE
else → MINOR (pruned unless no others)
```

### Propagation Risk
```
D3 + LOW controllability + worsening → HIGH
≥2 D2+ OR mixed + high volatility → ELEVATED
else → LOW
```

## Verification

```bash
# Phase 1+2
npm run verify:phase12

# Phase 3+4
npm run verify:phase34
```

## Integration

Dashboards should consume:
- `TeamSeriesResult` from `buildTeamIndexSeries()`
- `AttributionResult` from `computeAttribution()`

Do **not invent text** — use the structured output directly.
