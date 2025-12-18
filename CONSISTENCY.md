# Consistency Pattern Classifier

## Overview
Evidence is not just about the *score*, but the *pattern*. The Consistency Classifier detects "Meta-Patterns" that might indicate data quality issues or complex psychological states.

## Patterns

### 1. Impression Management
- **Definition**: "Faking Good". The user selects the highest possible positive option for every question.
- **Logic**: All Positive + Avg Strength > 0.9 (Perfect scores).
- **Implication**: Trust in these signals should be lowered.

### 2. Emotional Ambivalence
- **Definition**: Truly conflicted state. The user says "I love my team" (Social Support +1) but "I hate my team" (Social Support -1) in the same session.
- **Logic**: Strong Positive (>0.6) AND Strong Negative (>0.6) for the same construct.
- **Implication**: High sigma (Uncertainty). Not a "zero" mean, but a "bi-modal" state.

### 3. Coherent
- **Definition**: Expected variance.
- **Logic**: Default.

## Usage
- Run on the `Evidence[]` batch before aggregation.
- If `impression_management` detected -> Flag the session for Governance check.
