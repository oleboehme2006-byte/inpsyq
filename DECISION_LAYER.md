# InPsyq Decision Interpretation Layer

## Overview
The Decision Interpretation Layer (`/services/decision`) is a deterministic, rule-based engine that sits on top of the Frozen Core. It transforms raw weekly aggregates into executive-grade decision support data without requiring LLM inference.

It answers 5 key questions:
1. **Criticality**: Is the team Healthy, At Risk, or Critical?
2. **Trend**: Is the situation improving or deteriorating?
3. **Drivers**: What psychological factors are causing this state?
4. **Influence**: Are these drivers structural (systemic) or actionable (leadership/team)?
5. **Action**: What should be done *right now*?

## Architecture
```
services/decision/
├── types.ts            # Strict Output Contract (DecisionSnapshot)
├── constants.ts        # Thresholds & Templates
├── stateEvaluator.ts   # Logic: Metrics -> Health Score -> Label
├── trendEvaluator.ts   # Logic: History -> Slope -> Direction
├── driverAttribution.ts# Logic: Parameters -> Ranked Risks
├── actionEngine.ts     # Logic: State + Drivers -> Recommendation
└── decisionService.ts  # Orchestrator
```

## 1. State Classification
State is derived from a weighted "Health Score" (0-1) calculated from:
- **WRP** (Work-Recovery Pace)
- **OUC** (Org Unit Compatibility)
- **TFP** (Team Friction Pressure - Inverted)
- **Strain** (Inverted)
- **Withdrawal** (Inverted)

**Thresholds:**
- **CRITICAL**: Health < 0.4
- **AT RISK**: Health < 0.7
- **HEALTHY**: Health >= 0.7

## 2. Trend Analysis
Uses Linear Regression (Slope) on the Health Score over the available history.
- **IMPROVING**: Slope > +0.02
- **DECLINING**: Slope < -0.02
- **STABLE**: Between -0.02 and +0.02

## 3. Driver Attribution
Parameters are analyzed for "Deviation from Ideal".
- **Impact**: abs(Ideal - Actual).
- **Influence Scope**: Mapped in `constants.ts`.
    - **SYSTEMIC**: Load, Market Conditions (Hard to change).
    - **LEADERSHIP**: Trust, Autonomy, Safety (Actionable).
    - **TEAM**: Cohesion, peer trust (Actionable).
    - **INDIVIDUAL**: Meaning, Cognitive Dissonance (Coach-able).

## 4. Action Recommendation
Rule-based matching:
1. If `HEALTHY` & `STABLE/IMPROVING` -> **MAINTAIN_COURSE**.
2. If `CRITICAL/AT_RISK`:
   - Identify Top **Actionable** Driver (Risk).
   - Match to Template (e.g., Low Safety -> `INTERVENTION_SAFETY`).
   - If no actionable driver exists (e.g., only High Load), trigger `INTERVENTION_LOAD`.

## Extension Guide
To add new actions or drivers:
1. Update `constants.ts`: Add new mapping to `PARAM_INFLUENCE` or `ACTION_TEMPLATES`.
2. Update `actionEngine.ts`: Add condition to map the parameter to the template.
3. **Do not modify** the logic in `stateEvaluator.ts` unless the Core Metrics definition changes.
