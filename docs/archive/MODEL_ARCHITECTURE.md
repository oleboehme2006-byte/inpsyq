# Model Architecture: Truthfulness Under Uncertainty

## Philosophy
InPsyq is designed to be **causally cautious, temporally aware, norm-sensitive, and value-configurable**.
We adhere to the principle: *It is better to say "I don't know" than to confidently hallucinate.*

## The Stack

### 1. Measurement Layer (The Senses)
- **Constructs**: 14 Rigid dimensions (`services/measurement/constructs.ts`).
- **Evidence**: `Evidence[]` objects extracted from Text/Choice.
- **Invariance**: Sigma varies by source quality.
- **Consistency**: Conflicting evidence inflates Sigma.

### 2. Interpretation Context (The Memory)
- **Service**: `services/interpretation/context.ts`
- **Role**: Injects history (Trend, Volatility) into LLM prompts.
- **Goal**: Distinguish "Baseline" from "Signal".

### 3. Ontology (The Theory)
- **Service**: `services/ontology/`
- **Role**: Hard-coded DAG of Organizational Psychology.
- **Goal**: Prevents inventing causal links. Ensures logic flows Driviers -> States -> Outcomes.

### 4. Norms (The Cultural Lens)
- **Service**: `services/norms/`
- **Role**: Compares scores to `NormProfile` (e.g. "Tech Startup").
- **Goal**: Distinguishes "Healthy Deviation" from "Risk".

### 5. Causality (The Judge)
- **Service**: `services/causality/`
- **Role**: Labels links as "Correlational", "Weak Causal", or "Strong Causal".
- **Goal**: Prevents overclaiming.

### 6. Values (The Conscience)
- **Service**: `services/values/`
- **Role**: Configures weights (e.g. Autonomy Preference).
- **Goal**: Aligns recommendations with Org Culture.

### 7. Actions (The Output)
- **Service**: `services/actions/`
- **Role**: Tires advice into Safe, Contextual, Explorative.
- **Goal**: Safety.

### 8. Governance (The Safety Net)
- **Service**: `services/governance/`
- **Role**: Attaches Blocking Flags for High Uncertainty/Low Data.
- **Goal**: Prevents automated harm.

## Data Flow
`Input` -> `Evidence` -> `Aggregation` -> `Norm Assessment` -> `Causality Check` -> `Value Filter` -> `Governance Check` -> `Decision`

## Frozen Core
The logic above wraps the **Frozen Core** (`inferenceService`, `param_map`). The Core remains the deterministic math engine; these layers provide the Context and Safety around it.
