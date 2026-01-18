# Core Algorithms

## Aggregation Engine (`lib/aggregation/`)

### Temporal Series
Aggregates weekly data points into temporal series to detect trends, volatility, and regimes.

#### Components
- **Trend**: Directional movement (UP, DOWN, FLAT) based on linear regression slope
- **Volatility**: Magnitude of change (HIGH, LOW) based on standard deviation
- **Regime**: Stability classification (STABLE, UNSTABLE, TRANSITION)

#### Rules
- **Trend**: `slope > 0.1` → UP, `slope < -0.1` → DOWN, else FLAT
- **Volatility**: `std_dev > 0.2` → HIGH, else LOW
- **Regime**: 
  - 3+ consistent weeks → STABLE
  - Alternating vol/trend → UNSTABLE

---

## Attribution Engine (`lib/attribution/`)

Determines causal drivers for team states, distinguishing between Internal (team dynamics) and External (dependencies) factors.

### Source Dominance Rules (`sourceRules.ts`)

| Condition | Classification | Logic |
|-----------|----------------|-------|
| `Ext ≥ 0.60` AND `Int < 0.35` | **EXTERNAL** | External factors overwhelmingly dominate. Internal factors are suppressed. |
| `Int ≥ 0.60` AND `Ext < 0.35` | **INTERNAL** | Internal dynamics overwhelm external noise. |
| Else | **MIXED** | Complex interplay. Both returned (capped: Int=3, Ext=2). |

### Contribution Bands

| Score | Classification | Action |
|-------|----------------|--------|
| `≥ 0.60` | **MAJOR** | Always included. Primary driver. |
| `≥ 0.35` | **MODERATE** | Included if space permits. |
| `< 0.35` | **MINOR** | Pruned unless no other drivers exist. |

### Propagation Risk (`propagation.ts`)

Assess risk of strain spreading to other teams.

| Risk Level | Trigger Condition |
|------------|-------------------|
| **HIGH** | `D3` (High Dependence) + `LOW` Control + Worsening Trend |
| **ELEVATED** | ≥2 `D2+` Dependencies OR Mixed Source + High Volatility |
| **LOW** | All other cases |

---

## Data Quality

### Weekly Quality Metrics (`DataQualityWeekly`)

| Metric | Definition | Threshold (Good) |
|--------|------------|------------------|
| `completion_rate` | % of active members responding | `> 70%` |
| `response_time_ms` | Median time to complete | `> 30s` (detects click-through) |
| `missing_items` | count of skipped optional items | `< 2` |

### Adaptive Item Selection
Survey engine selects items based on:
1. **Uncertainty**: Items with high variance in prior weeks
2. **Rotational**: Core construct coverage
3. **Follow-up**: Items triggered by specific low scores
