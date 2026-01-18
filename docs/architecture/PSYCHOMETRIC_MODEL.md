# Psychometric Model

## Overview

InPsyq uses a hierarchical psychometric model with three layers:

```
Measurement Items → Driver Families → Indices
```

This model provides the semantic foundation for all scoring, aggregation, and interpretation.

---

## Indices

Indices are the top-level psychological constructs. There are **4 canonical indices**:

| Index | Direction | Meaning |
|-------|-----------|---------|
| `strain` | Higher is worse | Mental/emotional load relative to capacity |
| `withdrawal_risk` | Higher is worse | Probability of disengagement or exit |
| `trust_gap` | Higher is worse | Discrepancy between expected and perceived trust |
| `engagement` | Higher is better | Vigor, dedication, and absorption in work |

### Index Thresholds

Each index has deterministic thresholds for qualitative states:

| State | Strain | Withdrawal Risk | Trust Gap | Engagement |
|-------|--------|-----------------|-----------|------------|
| Critical | ≥ 80 | ≥ 70 | ≥ 60 | ≤ 30 |
| Risk | ≥ 60 | ≥ 50 | ≥ 40 | ≤ 50 |
| Normal | < 60 | < 50 | < 40 | > 50 |

### Implementation

```
lib/semantics/indexRegistry.ts
```
- `INDEX_REGISTRY`: Canonical definitions
- `getIndexDefinition()`: Lookup by ID
- `getQualitativeStateForIndex()`: Value → state mapping
- Validates at module load (fail-fast)

---

## Driver Families

Driver families are **internal psychological mechanisms** that influence indices. There are **6 canonical drivers**:

| Driver | Affects | Mechanism |
|--------|---------|-----------|
| `cognitive_load` | strain | Mental processing demands |
| `emotional_load` | strain, withdrawal_risk | Affective exhaustion |
| `role_conflict` | strain, engagement | Incompatible expectations |
| `autonomy_friction` | withdrawal_risk, engagement | Blocked decision-making |
| `social_safety` | trust_gap, withdrawal_risk | Psychological safety in team |
| `alignment_clarity` | trust_gap, engagement | Purpose and strategy clarity |

### Driver-Index Assignment Rules

Each driver has **allowed** and **disallowed** index assignments:

```
cognitive_load  → strain ✓, withdrawal_risk ✗, trust_gap ✗, engagement ✗
emotional_load  → strain ✓, withdrawal_risk ✓, trust_gap ✗, engagement ✗
role_conflict   → strain ✓, withdrawal_risk ✗, trust_gap ✗, engagement ✓
...
```

These rules are enforced at runtime. Invalid assignment throws.

### Implementation

```
lib/semantics/driverRegistry.ts
```
- `DRIVER_REGISTRY`: Canonical definitions with psychological mechanisms
- `validateDriverIndexAssignment()`: Enforces allowed/disallowed rules
- `getDriversForIndex()`: Which drivers can affect an index

---

## Measurement Items

Measurement items are **individual survey questions**. There are **11 core items**:

| Item | Scale | Index | Driver |
|------|-------|-------|--------|
| `workload_volume` | Likert-5 | strain | cognitive_load |
| `mental_exhaustion` | Likert-5 | strain | emotional_load |
| `role_clarity` | Likert-5 | strain | role_conflict |
| `job_search_intent` | Likert-5 | withdrawal_risk | emotional_load |
| `effort_discretionary` | Likert-5 | withdrawal_risk | autonomy_friction |
| `leadership_trust` | Likert-5 | trust_gap | social_safety |
| `peer_support` | Likert-5 | trust_gap | social_safety |
| `communication_clarity` | Likert-5 | trust_gap | alignment_clarity |
| `work_meaning` | Likert-5 | engagement | alignment_clarity |
| `autonomy_level` | Likert-5 | engagement | autonomy_friction |

### Scale Types

| Type | Range | Use Case |
|------|-------|----------|
| `LIKERT_5` | 1-5 | Primary measurement scale |
| `LIKERT_7` | 1-7 | Higher granularity (reserved) |
| `BINARY` | 0-1 | Yes/no questions |
| `NUMERIC_0_10` | 0-10 | Continuous ratings |

### Directionality

Each item has a direction indicating psychological interpretation:
- `HIGHER_IS_BETTER`: Agreement indicates positive state
- `HIGHER_IS_WORSE`: Agreement indicates negative state

### Implementation

```
lib/measurement/itemRegistry.ts
```
- `ITEM_REGISTRY`: Canonical item definitions
- `getItem()`: Lookup by ID
- `validateItemValue()`: Range and type enforcement
- Cross-validates against index and driver registries

---

## Semantic Constraints

### Forbidden Descriptors

Each index has **forbidden descriptors** that must never appear in interpretations:

```
strain: "positive strain", "healthy strain", "good stress"
withdrawal_risk: "healthy withdrawal", "strategic withdrawal"
trust_gap: "productive skepticism", "good gap"
engagement: "excessive engagement", "toxic engagement"
```

### Linguistic Rules

```
lib/semantics/linguisticRules.ts
```
- Defines allowed qualitative labels per severity level
- Enforces clinical accuracy in generated text

---

## External Dependencies

In addition to internal drivers, the system tracks **external dependencies**:

```
lib/semantics/dependencyRegistry.ts
```

External dependencies represent organizational/environmental factors outside team control:
- Market conditions
- Organizational changes
- Resource constraints
- Leadership decisions

---

## Validation

All registries validate at module load:
1. Index thresholds are strictly ordered
2. Driver assignments don't conflict
3. Items link to valid indices and drivers
4. Scale bounds match scale types

If any validation fails, the module throws immediately (fail-fast design).
