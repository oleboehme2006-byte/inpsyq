# Counterfactual Reasoning Layer

## Overview
InPsyq can now ask "What if?". The Counterfactual Engine allows users to simulate interventions before acting.
*Example*: "What if we increase Autonomy?" -> "Engagement likely Increases (Confidence 0.8), but Risk of Chaos might Increase (Weak)."

## Architecture
`services/counterfactuals/engine.ts` uses the `Ontology` to propagate changes.

### Logic
1.  **Input**: Intervention (Node + Direction).
2.  **Traversal**: Follow outgoing edges in the DAG.
3.  **Polarity Logic**:
    - `Increase` + `Contributes To` -> `Increase`
    - `Increase` + `Inhibits` -> `Decrease`
    - `Decrease` + `Inhibits` -> `Increase`
4.  **Confidence Decay**: Confidence multiplies `0.9` per hop. Multi-step predictions are inherently less certain.

## Epistemic Safety
- **Hypothetical Only**: Results are labeled as `predicted_effects`.
- **Bounded**: Simulations stop at Depth 3 to prevent "Butterfly Effect" hallucinations.
- **Governance**: Low confidence predictions are flagged.
