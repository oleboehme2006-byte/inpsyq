# Attribution Engine

## Overview

The attribution engine performs causal analysis to determine **why** index scores are at their current levels. It decomposes drivers into internal and external categories.

```
Aggregated Scores → Driver Analysis → Source Classification → Propagation Risk
```

---

## Core Concepts

### Internal Drivers

Factors **within team control**:
- Cognitive load
- Emotional load
- Role conflict
- Autonomy friction
- Social safety
- Alignment clarity

### External Dependencies

Factors **outside team control**:
- Market conditions
- Organizational restructuring
- Leadership decisions
- Resource constraints
- Regulatory changes

---

## Source Dominance Rules

Attribution classifies the **primary source** of index movement:

| Classification | Condition |
|----------------|-----------|
| `EXTERNAL` | External mass ≥ 60% AND internal mass < 35% |
| `INTERNAL` | Internal mass ≥ 60% AND external mass < 35% |
| `MIXED` | Neither dominates |

### Implications

- **EXTERNAL**: Internal actions suppressed (no point addressing symptoms)
- **INTERNAL**: Full driver recommendations generated
- **MIXED**: Limited internal actions (cap: 3) + limited external (cap: 2)

### Implementation

```
lib/attribution/sourceRules.ts
```

---

## Contribution Scoring

Each driver receives a **contribution score** (0.0 - 1.0):

| Band | Score | Meaning |
|------|-------|---------|
| `MAJOR` | ≥ 0.60 | Primary contributor |
| `MODERATE` | 0.35 - 0.59 | Significant factor |
| `MINOR` | < 0.35 | Weak influence |

### Pruning

`MINOR` contributors are excluded from outputs unless:
- No MAJOR or MODERATE contributors exist
- Required for minimum output

### Implementation

```
lib/attribution/internal.ts
lib/attribution/external.ts
```

---

## Propagation Risk

Propagation risk estimates the **likelihood of issue spreading** across teams or indices.

| Level | Conditions |
|-------|------------|
| `HIGH` | D3 severity + LOW controllability + WORSENING trend |
| `ELEVATED` | ≥2 D2+ drivers OR mixed source + high volatility |
| `LOW` | All other cases |

### Use Cases

- `HIGH`: Triggers executive escalation
- `ELEVATED`: Flags for monitoring
- `LOW`: Standard handling

### Implementation

```
lib/attribution/propagation.ts
```

---

## Attribution Input

```typescript
interface AttributionInputs {
  teamId: string;
  weekStart: string;
  indexScores: Record<IndexId, number>;
  driverSeverities: Record<DriverFamilyId, SeverityLevel>;
  externalImpacts: ExternalDependency[];
  temporal: {
    trend: TrendIndicator;
    volatility: VolatilityLevel;
    regime: RegimeState;
  };
}
```

### Implementation

```
lib/attribution/input.ts
lib/attribution/types.ts
```

---

## Attribution Output

```typescript
interface AttributionResult {
  source: 'INTERNAL' | 'EXTERNAL' | 'MIXED';
  
  internalDrivers: {
    driverId: DriverFamilyId;
    contribution: number;
    band: 'MAJOR' | 'MODERATE' | 'MINOR';
    affectedIndices: IndexId[];
  }[];
  
  externalDependencies: {
    dependencyId: string;
    impact: number;
    controllability: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  
  propagationRisk: 'HIGH' | 'ELEVATED' | 'LOW';
  
  actionGate: {
    allowInternalActions: boolean;
    maxInternalActions: number;
    allowExternalEscalation: boolean;
  };
}
```

---

## Main Entry Point

```typescript
import { computeAttribution } from '@/lib/attribution/attributionEngine';

const result = computeAttribution(inputs);
```

### Implementation

```
lib/attribution/attributionEngine.ts
```

---

## Action Gating

The attribution result controls what actions can be recommended:

| Source | Internal Actions | External Actions |
|--------|------------------|------------------|
| INTERNAL | Up to 5 | None |
| EXTERNAL | None (blocked) | Escalation only |
| MIXED | Up to 3 | Up to 2 |

### Rationale

When issues are externally driven, recommending internal changes:
1. Wastes team effort
2. Creates false accountability
3. May cause learned helplessness

The system protects against this by gating action recommendations.

---

## Example

**Scenario**: High strain, D3 cognitive load, organization restructuring underway

**Analysis**:
- Internal: cognitive_load at D3 (MAJOR contributor)
- External: restructuring (HIGH impact, LOW controllability)
- Source: MIXED (both significant)

**Result**:
```json
{
  "source": "MIXED",
  "internalDrivers": [
    { "driverId": "cognitive_load", "contribution": 0.55, "band": "MODERATE" }
  ],
  "externalDependencies": [
    { "dependencyId": "org_restructure", "impact": 0.50, "controllability": "LOW" }
  ],
  "propagationRisk": "ELEVATED",
  "actionGate": {
    "allowInternalActions": true,
    "maxInternalActions": 3,
    "allowExternalEscalation": true
  }
}
```
