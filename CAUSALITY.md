# Causal Confidence Scoring

## Overview
The "Causal Confidence" layer prevents the system from overclaiming. It moves InPsyq from "X causes Y" to "X is clearly the driver of Y (Strong Causal)" vs "X and Y are happening together (Correlational)".

## Architecture
`services/causality/service.ts` evaluates links based on 3 factors:
1.  **Ontological Alignment**: Is there a theoretical edge in the Construct Graph? (+0.4)
2.  **Signal Magnitude**: Is the driver signal strong enough to push the system? (+0.2)
3.  **Temporal Persistence**: Is the driver stable, or just noise? (+0.2)

## Scores
- **Score < 0.4**: Correlational (Co-occurrence without clear mechanism).
- **Score 0.4 - 0.7**: Weak Causal (Likely related, but potential confounders).
- **Score > 0.7**: Strong Causal (High confidence driver).

## Usage
- **Briefs**: "We are *confident* that Low Autonomy is driving Turnover" (Strong) vs "Turnover and Low Meaning are observed" (Correlational).
- **Actions**: Strong Causal links unlock "Fix X to improve Y" recommendations.
