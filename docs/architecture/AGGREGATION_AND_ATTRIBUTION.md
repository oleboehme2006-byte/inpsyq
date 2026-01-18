# Aggregation & Attribution

## 1. Aggregation Engine (`lib/aggregation/`)

Transforms raw measurement sessions into reliable indices.

### Temporal Series
We do not look at single weeks in isolation. All data is processed as a time series using a lookback window (typically 6-12 weeks).

### Metrics Computed
- **Trend**: Directional velocity (+/- slope).
- **Volatility**: Standard deviation over window.
- **Regime**: Is the current state `STABLE`, `IMPROVING`, `WORSENING`, or `VOLATILE`?
- **Seasonality**: (Future) Cyclic adjustment.

### Aggregation Hierarchies
1. **Team Level**: Aggregates all members of a specific `team_id`.
2. **Org Level**: Aggregates all members of an `org_id` (regardless of team).

## 2. Attribution Engine (`lib/attribution/`)

Determines **WHY** a score changed. It assigns causality to either Internal Drivers or External Dependencies.

### Architecture

```
Inputs (Index Delta, Driver Scores, Dependency States)
    ↓
Source Dominance Logic
    ↓
Internal / External / Mixed
    ↓
Propagation Risk
```

### Source Dominance Rules
Located in `lib/attribution/sourceRules.ts`.

| Condition | Attribution |
|-----------|-------------|
| `ExternalMass >= 0.60` AND `InternalMass < 0.35` | **EXTERNAL** (Internal suppression) |
| `InternalMass >= 0.60` AND `ExternalMass < 0.35` | **INTERNAL** |
| Else | **MIXED** |

**Rationale**: If a major external event (e.g., "Market Crash") is active, fine-grained internal complaints ("coffee is bad") are noise and should be suppressed to avoid distraction.

### Propagation Risk
Located in `lib/attribution/propagation.ts`.

Calculates the likelihood of a localized issue spreading to other teams.
- **Factors**:
  - Severity of index drop
  - Driver "contagion" factor (e.g., `trust_gap` is highly contagious)
  - Team connectedness (graph centrality)

### Driver Families
- **Cognitive Load**: Workload, complexity.
- **Emotional Load**: Stress, conflict.
- **Social Safety**: Trust, psychological safety.
- **Autonomy Friction**: Bureaucracy, micromanagement.
- **Alignment Clarity**: Goal ambiguity.

## Verification

The attribution engine is a pure function.
- **Input**: `AttributionInputs` DTO
- **Output**: `AttributionResult` DTO

It is verified by unit tests in `scripts/archive/verify_phase34.ts` (logic preserved in `lib/attribution`).
