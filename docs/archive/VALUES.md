# Values & Action Engine

## Overview
The "Values" layer ensures InPsyq doesn't give "Silicon Valley" advice to a "Traditional Bank".
The "Action Engine" consumes these values to tier recommendations.

## Value Profile
Defined in `services/values/profile.ts`:
- **Autonomy Preference**
- **Risk Appetite**
- **Feedback Directness**
- **Hierarchy Tolerance**

## Action Tiers

### 1. Safe Defaults
- Universal best practices (e.g., "Clarify Roles").
- Low risk, high transferability.
- Always shown.

### 2. Contextual Variants
- Highly value-dependent.
- *Example*: For Autonomy...
  - **High Autonomy Org**: "Implement self-set working hours."
  - **Low Autonomy Org**: "Clarify delegation boundaries."
- The engine computes a `value_alignment_score`. Mismatched actions are hidden or deprioritized.

### 3. Explorative
- Novel interventions for high-maturity teams.
- *Example*: "Job Crafting Workshop".

## Configuration
Admins set the `ValueProfile`. Defaults to "Tech Startup" parameters.
