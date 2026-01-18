# Temporal Interpretation Context

## Overview
The InPsyq Model Integrity Upgrade ensures that LLM interpretation is not strictly session-isolated. It injects a "Temporal Context" into the prompt, allowing the model to distinguish between:
- **Baseline Behavior**: "This user is always critical of tools."
- **Novel Deviations**: "This user, usually positive, is suddenly exhausted."

## Architecture

### 1. Context Computation
`services/interpretation/context.ts` computes:
- **Rolling Baseline**: Weighted average of previous sessions.
- **Volatility (σ)**: Standard deviation of normalized scores.
- **Trend**: Directional velocity (increasing/decreasing/stable).

### 2. Injection
The `ResponseInterpreter` (`services/llm/interpreters.ts`) receives `InterpretationContext`.
The System Prompt is updated dynamically:
```text
Contextual Awareness:
The user has the following historical patterns:
- workload: Trend=increasing, Volatility=0.12
- autonomy: Trend=stable
```

### 3. Interpretation Logic
- If text aligns with history -> Higher Confidence.
- If text deviates significantly -> The model is primed to detect "Changes" or "Shocks".
- If user is historically volatile -> New extreme statements are treated with more skepticism (higher uncertainty).

## Privacy
No raw text history is ever re-injected. Only abstract statistical aggregates (`construct`, `trend`, `volatility`) are passed to the model context.
