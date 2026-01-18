# System Architecture Overview

InPsyq is a psychological measurement and interpretation platform for organizational health. It transforms employee survey responses into actionable insights for team leads and executives.

## Design Philosophy

- **Causally Cautious**: Better to say "I don't know" than to confidently hallucinate
- **Temporally Aware**: Distinguishes baseline from signal using historical context
- **Norm-Sensitive**: Compares scores to industry/cultural norms
- **Value-Configurable**: Aligns recommendations with organizational culture

## Architecture Layers

### 1. Measurement Layer
Transforms raw employee interactions (choice, text) into psychometrically valid signals.

- **Constructs**: 14 rigid psychological dimensions
- **Evidence**: Structured records with direction, strength, confidence
- **Aggregation**: Weighted averaging with uncertainty propagation
- **Governance**: Rate limiting, conflict detection, quality scoring

See: [Measurement Layer](measurement-layer.md)

### 2. Interpretation Layer
Provides context for LLM inference.

- **Temporal Context**: Trend, volatility, baseline comparison
- **Norm Profiles**: Industry/culture-specific benchmarks
- **Causality Labels**: Correlational, weak causal, strong causal

### 3. Ontology Layer
Hard-coded DAG of organizational psychology theory.

**Node Types:**
- **First Order (Inputs)**: Role Clarity, Autonomy, Workload, Fairness — actionable levers
- **Second Order (States)**: Psychological Safety, Trust, Meaning — emergent from inputs
- **Outcomes**: Engagement, Retention — results

**Edge Types:**
- `contributes_to`: Positive linear influence
- `inhibits`: Negative influence
- `moderates`: Changes relationships between variables
- `amplifies`: Multiplicative positive effect

### 4. Decision Layer
Deterministic, rule-based engine for decision support without LLM inference.

**Outputs:**
- **Criticality**: Healthy / At Risk / Critical
- **Trend**: Improving / Stable / Declining
- **Drivers**: Ranked psychological factors causing state
- **Influence Scope**: Systemic / Leadership / Team / Individual
- **Actions**: Concrete recommendations

See: [Dashboard Layer](dashboard-layer.md)

### 5. Governance Layer
Final safety net for data quality and anomaly detection.

**Blocking Flags:**
- `INSUFFICIENT_DATA`: Session count < 3
- `HIGH_UNCERTAINTY`: Global sigma > 0.4
- `EXTREME_ANOMALY`: Z-score > 3.0

Blocking flags require human intervention or more data.

## Data Flow

```
User Input → Evidence → Aggregation → Norm Assessment → Causality Check → Governance → Dashboard
```

## Key Invariants

| Invariant | Description |
|-----------|-------------|
| Actions target First Order | Recommendations must target actionable structural inputs |
| Latent states are inferred | Cannot directly assign Psychological Safety |
| Evidence is atomic | Each piece of evidence is independent and auditable |
| Sigma propagates | Uncertainty flows through all aggregations |

## Service Map

```
services/
├── measurement/        # Evidence extraction, aggregation
├── interpretation/     # LLM context injection
├── ontology/           # Construct graph (DAG)
├── causality/          # Causal link classification
├── norms/              # Norm profiles and comparison
├── values/             # Organizational value weights
├── decision/           # Rule-based decision engine
├── governance/         # Safety flags and blocking
├── dashboard/          # Read services for UI
└── email/              # Magic link transport
```

## Related Documentation

- [Measurement Layer](measurement-layer.md)
- [Dashboard Layer](dashboard-layer.md)
- [Authentication & Admin](auth-and-admin.md)
- [Data Model](data-model.md)
