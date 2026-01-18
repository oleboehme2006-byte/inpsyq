# Scoring & Aggregation

## Overview

The scoring and aggregation layer transforms raw responses into index scores, builds temporal series, and detects trends.

```
Responses → Scoring → Team Aggregation → Temporal Series → Trend Detection
```

---

## Response Scoring

### Normalization

Raw Likert responses (1-5) are normalized to a 0-100 scale:

```
normalized = (raw - min) / (max - min) * 100
```

For `HIGHER_IS_WORSE` items, the scale is inverted:
```
normalized = 100 - ((raw - min) / (max - min) * 100)
```

### Index Computation

Each index score is the **mean of its associated normalized items**:

```
strain = mean(workload_volume, mental_exhaustion, role_clarity)
```

### Implementation

```
lib/scoring/types.ts
lib/scoring/driverSeverity.ts
```

---

## Driver Severity

### Severity Levels

| Level | Threshold | Meaning |
|-------|-----------|---------|
| `D0` | < 30 | Healthy |
| `D1` | 30-49 | Watch |
| `D2` | 50-69 | Concern |
| `D3` | ≥ 70 | Critical |

### Computation

Driver severity is computed from associated item scores:

```typescript
function getDriverSeverity(driverId: string, responses: Response[]): SeverityLevel
```

### Implementation

```
lib/scoring/driverSeverity.ts
lib/scoring/dependencyImpact.ts
```

---

## Team Aggregation

### Weekly Index Point

For each team and week, compute aggregate scores:

```typescript
interface WeeklyIndexPoint {
  teamId: string;
  weekStart: string;
  indices: {
    strain: { value: number; n: number };
    withdrawal_risk: { value: number; n: number };
    trust_gap: { value: number; n: number };
    engagement: { value: number; n: number };
  };
  participation: number;  // % of team who completed
  quality: number;        // Mean quality score
}
```

### Aggregation Rules

1. **Minimum sample**: ≥ 3 responses required for valid aggregate
2. **Outlier handling**: None (all valid responses included)
3. **Missing data**: Index marked as `null` if insufficient responses

### Implementation

```
lib/aggregation/buildSeries.ts
lib/aggregation/buildOrgSeries.ts
```

---

## Temporal Series

### Series Structure

```typescript
interface TeamSeriesResult {
  teamId: string;
  weeks: WeeklyIndexPoint[];
  temporal: {
    trend: TrendIndicator;
    volatility: VolatilityLevel;
    regime: RegimeState;
  };
}
```

### Trend Detection

Trend is computed using **linear regression slope** over the series:

| Trend | Slope Threshold |
|-------|-----------------|
| `IMPROVING` | slope < -0.05 (for worse-is-higher) |
| `STABLE` | \|slope\| < 0.05 |
| `WORSENING` | slope > 0.05 |

For `engagement` (higher-is-better), thresholds are inverted.

### Volatility

Volatility measures **week-to-week variance**:

| Level | Std Dev |
|-------|---------|
| `LOW` | < 5 |
| `MODERATE` | 5-15 |
| `HIGH` | > 15 |

### Regime Detection

Regime identifies **sustained state patterns**:

| Regime | Definition |
|--------|------------|
| `STABLE_HEALTHY` | ≥ 3 consecutive NORMAL weeks |
| `STABLE_RISK` | ≥ 3 consecutive RISK weeks |
| `TRANSITION` | Recent change between states |
| `VOLATILE` | No consistent pattern |

### Implementation

```
lib/aggregation/temporal.ts
lib/aggregation/types.ts
lib/aggregation/week.ts
```

---

## Organization Aggregation

### Org-Level Scores

Organization scores are computed from **team aggregates**:

```typescript
orgScore = weightedMean(teamScores, teamSizes)
```

Teams are weighted by their size (number of respondents).

### Cross-Team Patterns

The org series also identifies:
- Teams with divergent trends
- Highest/lowest performing teams
- Propagation risk across teams

### Implementation

```
lib/aggregation/buildOrgSeries.ts
```

---

## Data Flow

```
measurement_responses
        ↓
   Normalization (lib/scoring/)
        ↓
   Team Aggregation (lib/aggregation/)
        ↓
   Temporal Analysis
        ↓
   Storage (org_aggregates_weekly table)
        ↓
   Dashboard/Attribution consumption
```

---

## Performance

### Caching

Aggregated results are cached:
- Cache key: `(org_id, team_id, week_start, input_hash)`
- TTL: Until new responses arrive
- Invalidation: On any new response in the scope

### Computation Cost

| Operation | Complexity |
|-----------|------------|
| Single team week | O(n) where n = team size |
| Org series (12 weeks) | O(t × w) where t = teams, w = weeks |

Typical org with 10 teams × 12 weeks: < 100ms.
