# Core Logic & Algorithms

## Overview

This document defines the precise mathematical and logical rules governing InPsyq's core engines. These rules are **deterministic** and **invariant**.

---

## 1. Measurement Engine

### Item Registry (`lib/measurement/itemRegistry.ts`)
The system uses a strictly typed, static item registry. Dynamic item creation is forbidden.

- **Scale Types**: `LIKERT_5` (1-5), `LIKERT_7` (1-7), `BINARY` (0/1), `NUMERIC_0_10` (0-10).
- **Validation**: All items are validated for semantic integrity (index/driver mapping) at module load time.

### Invariants
1. **Value Range**: Responses must be within `[minValue, maxValue]` of the defined scale.
2. **Integer Constraint**: Likert scales must be integers.
3. **Required Items**: Core items (e.g., `workload_volume`) cannot be skipped.

---

## 2. Aggregation Engine (`lib/aggregation/temporal.ts`)

### Metrics

#### Trend Direction
Computed from week-over-week delta ($\Delta$).
- `UP`: $\Delta > 0.02$
- `DOWN`: $\Delta < -0.02$
- `STABLE`: $|\Delta| \leq 0.02$

#### Volatility ($V$)
Standard deviation of the metric value over a rolling window.
- **Window**: 4 weeks
- **Formula**: $\sigma = \sqrt{\frac{\sum(x - \mu)^2}{N}}$

#### Stability
Composite metric of volatility and data completion.
- **HIGH**: $V \leq 0.05$ AND Missingness $< 10\%$
- **LOW**: $V \geq 0.15$ OR Missingness $\geq 30\%$
- **MED**: Otherwise

### Regime Classification

Determines the narrative arc of the data.

| Regime | Conditions | Meaning |
|--------|------------|---------|
| `NOISE` | Coverage < 3 weeks OR ($V < 0.05$ AND $\Delta_{last} < 0.02$) | Insufficient signal |
| `EMERGING` | Last 2 deltas same sign AND $|\Delta_{last}| \ge 0.03$ | New trend starting |
| `PERSISTENT` | Last 4 deltas same sign OR Risk sustained $\ge 2$ weeks | Established trend |

---

## 3. Attribution Engine (`lib/attribution/sourceRules.ts`)

Determines whether pressure is internal (drivers) or external (dependencies).

### Dominance Thresholds
- **Dominant Mass**: $0.60$
- **Negligible Mass**: $0.35$

### Source Logic

| Primary Source | Condition | Effect |
|----------------|-----------|--------|
| **EXTERNAL** | $Mass_{ext} \ge 0.60$ AND $Mass_{int} < 0.35$ | **Clears Internal**: Internal drivers ignored to prevent confusion. |
| **INTERNAL** | $Mass_{int} \ge 0.60$ AND $Mass_{ext} < 0.35$ | **Standard**: Internal drivers shown. |
| **MIXED** | All other cases | **Capped**: Max 3 internal, 2 external items shown. |

---

## 4. Interpretation Engine (LLM)

### Grounding Contract (`lib/interpretation/grounding.ts`)
LLM generation MUST be grounded in data.
- **Zero-Hype Policy**: If data is stable/positive, LLM cannot invent "concerns".
- **Existence Proof**: Every generated claim must reference a specific data point ID.
- **Fallback**: If grounding fails, system reverts to deterministic template strings.

### Cost Governance
- **Concurrency**: Max 2 parallel LLM calls.
- **Context Window**: Inputs strictly pruned to essential signal only.
