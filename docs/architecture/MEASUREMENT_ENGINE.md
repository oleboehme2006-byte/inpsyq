# Measurement Engine

## Overview

The Measurement Engine (`lib/measurement/`) is responsible for collecting high-fidelity psychometric data from users. It enforces strict validity constraints and manages the item bank.

## Item Registry

All valid measurement items are defined in code. **No database-driven item definitions.**

Location: `lib/measurement/itemRegistry.ts`

### Item Structure
| Field | Type | Description |
|-------|------|-------------|
| `itemId` | `string` | Immutable distinctive key (e.g., `workload_volume`) |
| `scaleType` | `ScaleType` | `LIKERT_5`, `LIKERT_7`, `BINARY`, `NUMERIC_0_10` |
| `direction` | `Direction` | `HIGHER_IS_BETTER` or `HIGHER_IS_WORSE` |
| `driverFamily`| `DriverFamilyId` | Causal family this item measures |
| `required` | `boolean` | If true, must be answered in every session |

### Scale Types
- **LIKERT_5**: 1 (Strongly Disagree) to 5 (Strongly Agree)
- **LIKERT_7**: 1 to 7
- **BINARY**: 0 or 1
- **NUMERIC_0_10**: 0 to 10 integer

## Validation

Input validation occurs at multiple layers:

1. **Runtime Type Check**: Payload matches schema.
2. **Registry Check**: `itemId` exists in `ITEM_REGISTRY`.
3. **Value Bounds Check**: Value matches `scaleType` min/max.
4. **Consistency Check**: `response_time_ms` > minimum threshold (e.g., 500ms per item).

## Adaptive Selection

(Future capability, currently static)
The engine supports delivering a subset of items based on previous response patterns.

## Data Model

### Measurement Session
Represents one user taking one survey in one week.
- State: `PENDING` → `IN_PROGRESS` → `COMPLETED`
- Constraint: One completed session per user/week.

### Measurement Response
Raw data point.
- `numeric_value`: Normalized value.
- `text_value`: Optional qualitative feedback.

### Quality Metrics
Stored in `measurement_quality`:
- `completion_rate`: % of items answered.
- `response_time_ms`: Total time.
- `confidence_proxy`: Heuristic based on response patterns (e.g., straight-lining detection).
