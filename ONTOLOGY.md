# Construct Ontology & Causal Graph

## Overview
The InPsyq Model Integrity Upgrade introduces a formal **Construct Ontology** to ground LLM inferences in established organizational psychology theory. This prevents "hallucinated connections" and ensures that interpretations generally flow validly from Drivers -> States -> Outcomes.

## Architecture
The Ontology is a Directed Acyclic Graph (DAG) defined in `services/ontology/graph.ts`.

### Layers
1.  **First Order (Inputs)**: Tangible resources and demands the organization controls.
    - *Examples*: Role Clarity, Autonomy, Workload, Fairness.
    - *Actionable*: These are the primary levers for intervention.
2.  **Second Order (States)**: The psychological experience of the employee.
    - *Examples*: Psychological Safety, Emotional Load, Meaning, Trust.
    - *Mediators*: These explain *why* inputs lead to outcomes.
3.  **Outcomes**: The proximal result of the system.
    - *Examples*: Engagement (Vigor/Dedication).

### Edge Types
- **Contributes To**: Positive linear influence. (e.g., Autonomy -> Engagement)
- **Inhibits**: Negative influence. (e.g., Role Clarity -(inhibits)-> Cognitive Dissonance)
- **Moderates**: Changes the relationship between other variables (Context).
- **Amplifies**: Multiplicative positive effect.

## Usage
- **Aggregation**: Not used yet (Measurement is raw).
- **Interpretation**: The LLM is provided with "downstream effects" context. If a user complains about "Micromanagement" (Low Autonomy), the model knows to look for "Low Meaning" or "Low Engagement" as consequences.
- **Actions**: Recommendations target First Order nodes to fix Second Order problems.

## Graph Definition
See `services/ontology/graph.ts` for the authoritative edge list.
