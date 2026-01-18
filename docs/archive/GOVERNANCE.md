# Governance Layer

## Overview
The Governance Layer is the final safety net. It analyzes the "Meta-State" of the measurement (Uncertainty, Data Volume, Anomaly Severity) and attaches **Flags**.

## Flags

### 1. Insufficient Data
- **Trigger**: Session N < 3.
- **Effect**: Warning label on dashboard. Actions are hidden or marked "Hypothetical".

### 2. High Uncertainty
- **Trigger**: Global Sigma > 0.4.
- **Effect**: **BLOCKING**. The system refuses to render specific prescriptive advice. Displays "Gathering Evidence" state.

### 3. Extreme Anomaly
- **Trigger**: Normalized Z-Score > 3.0.
- **Effect**: **BLOCKING**. Potentially erroneous outlier or crisis. Requires manual Team Lead override to view standard dash.

## Human-in-the-Loop
Blocking flags cannot be cleared by the LLM. They require human intervention or more data.
