# Normative Separation Layer

## Overview
The "Normative Separation" layer ensures that InPsyq does not judge every team against a generic standard. It introduces **Norm Profiles** to distinguish between:
- **Healthy Deviation**: "This Design team is chaotic (Low Role Clarity), but that's normal for them."
- **Risk Deviation**: "This Accounting team is chaotic, which is dangerous."

## Architecture

### 1. Norm Profile
Defined in `services/norms/types.ts`.
A profile contains target Means and Sigmas for every construct.
Example (Tech Startup):
- *Autonomy*: High (0.7 ± 0.15)
- *Risk Tolerance*: High

### 2. Assessment Logic
`services/norms/service.ts` calculates a **Z-Score** for each measurement.
- **|Z| < 1**: Normal (Aligned).
- **1 < |Z| < 2**: Healthy Deviation (Cultural flavor).
- **|Z| > 2**: Risk Signal (Requires attention).
- **|Z| > 3**: Extreme Anomaly.

## Usage
- **Measurement Pipeline**: After aggregation, raw scores are passed through `NormService.assessDeviation`.
- **Decision Engine**: Only deviations with Severity >= `risk_deviation` trigger "Problem" alerts. `healthy_deviation` is noted as "Culture".

## Configuration
Currently defaults to `Global Tech Benchmark`. Future upgrades will allow Admin UI configuration of Organization-specific per-team profiles.
