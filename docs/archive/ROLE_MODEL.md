# Role & Power Asymmetry Model

## Overview
InPsyq acknowledges that organizations are hierarchies. A statement from an Intern does not carry the same *risk context* as a statement from a VP.

## Power Levels
1.  **Executive**: High Power, Low Suppression Risk.
2.  **Management**: Medium Power.
3.  **Individual Contributor**: Low Power, High Suppression Risk.

## Logic

### Suppression Risk
- **Hypothesis**: Low-power employees are more likely to filter negative feedback.
- **Effect**: If an IC gives a "Neutral" score on Psychological Safety, the system treats it as potentially "Negative" (inflated uncertainty or risk flag), because meaningful safety issues are often silenced.

### Signal Weighting
- **Trust in Leadership**: Signals from ICs are weighted HIGHER than signals from Managers. Self-rating of trust by leaders is discounted.
- **Role Clarity**: IC signal > Manager signal (Operational reality vs Theoretical design).

## Usage
The `RolePowerService` is queried during:
1.  **Risk Assessment**: Calculating "Organizational Risk".
2.  **Aggregation**: (Future) adjusting weighted means.
