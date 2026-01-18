# Teamlead Dashboard - Verification & Usage

## Overview
The Teamlead Dashboard (`/admin/teamlead`) is a deterministic, executive-grade UI sitting on top of the Decision Interpretation Layer. It answers 5 critical questions for leadership without AI inference:

1. **State**: How critical is the situation?
2. **Trend**: Is it getting better or worse?
3. **Drivers**: What are the root causes?
4. **Influence**: What is within our control?
5. **Action**: What should we do now?

## Architecture
- **Route**: `/admin/teamlead`
- **Data Source**: `/api/admin/decision` (Wraps `DecisionService`)
- **Key Components**:
    - `StateCard`: Health Score & Severity.
    - `TrendSection`: 9-week history with Semantic Axis (Optimal -> Critical).
    - `DriverInfluenceTable`: Ranked risks grouped by Scope (Leadership, Team, Systemic).
    - `ActionCard`: Primary recommendation with checklist.

## Verification Instructions

### 1. Seed Data
Ensure you have data in the database.
```bash
# In terminal
curl -X POST http://localhost:3001/api/seed
```
*Note: Save the `org_id` and `team_id` from the output.*

### 2. Access Dashboard
Navigate to: [http://localhost:3001/admin/teamlead](http://localhost:3001/admin/teamlead)

### 3. Load Diagnostic
1. Enter **Organization ID** and **Team ID** from the seed output.
2. Select the most recent **Target Week** from the dropdown.
3. Click **Load Data**.

### 4. Verify Outputs
- **State**: Should show "HEALTHY", "AT_RISK", or "CRITICAL".
- **Trend**: Should show a chart with "Optimal/Good/Stable/Risk/Critical" Y-axis.
- **Drivers**: Should list items like "Cognitive Dissonance" or "Psych Safety".
- **Action**: Should show a card like "Maintain Course" or "Psychological Safety Reset".
- **Payloads**: Click "Inspect Payloads" at the bottom to verify the JSON structure matches `DecisionSnapshot`.

## Troubleshooting
- **No Data / NaN**: Ensure specific team/week has profiles. Run seed again if needed.
- **Error 500**: Check terminal logs for `DecisionService` errors (e.g., missing indices).
