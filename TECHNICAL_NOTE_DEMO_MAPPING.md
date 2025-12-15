# Admin Demo Data & Visualization Mapping

## Overview
The Admin Demo Dashboard (`/admin/demo`) visualizes read-only data from the frozen backend core. 
This document details how raw API payloads are transformed into visualization-ready structures.

## 1. Raw API Payloads

### A. Profiles (`GET /api/admin/profiles`)
**Source Table:** `org_profiles_weekly`
**Structure:**
Standard DB rows, one per profile type per week.
```json
[
  {
    "week_start": "2023-11-01T...",
    "profile_type": "WRP", // or "OUC", "TFP"
    "activation_score": 0.45,
    "confidence": 0.88
  },
  ...
]
```

**Transformation:**
Data is pivoted by `week_start` into a unified object:
```typescript
{
  [week_start]: {
    WRP: { value: 0.45, confidence: 0.88 },
    OUC: { ... },
    TFP: { ... }
  }
}
```

### B. Audit (`GET /api/admin/audit/team-contributions`)
**Source Table:** `org_aggregates_weekly` (Subset)
**Structure:**
```json
{
  "parameter_contributions": {
     "emotional_load": {
        "team_mean": 0.65,
        "top_contributors": [...]
     },
     ...
  },
  "indices": { "strain": 0.2, ... }
}
```

**Transformation:**
- **Drivers Chart**: `parameter_contributions` keys are mapped to `team_mean` values. 
- **Sorting**: Descending by `team_mean` (or impact) to show primary drivers.

### C. Weekly History (`GET /api/admin/weekly`)
**Source Table:** `org_aggregates_weekly`
Used for the "Organizational Stability Indices" trend chart.
- `strain`
- `withdrawal`
- `trust_gap`

## 2. Visualization Logic

### Metric Gauges (Row 1)
- **Source**: Pivoted Profiles.
- **Zones**: Defined in `lib/visualization/mapping.ts`:
  - `WRP`: <0.3 (Critical), <0.6 (Strain), >0.6 (Sustainable)
  - `OUC`: <0.4 (Misaligned), <0.7 (Functional), >0.7 (Synergistic)
  - `TFP`: <0.3 (Fluid), <0.6 (Tension), >0.6 (High Friction)

### Trend Charts (Row 2)
- **Library**: Recharts (`LineChart`)
- **Data**: All available history from `/api/admin/weekly`.

### Driver Analysis (Row 3)
- **Source**: `parameter_contributions` from specific week audit.
- **Labels**: Mapped via `DRIVER_DESCRIPTIONS` constant.

## Troubleshooting
- **Missing Data (N/A)**:
  - If `WRP/OUC/TFP` are N/A: Check `org_profiles_weekly` table. The `profileService` might not have run for that week.
  - If Drivers are empty: Check `org_aggregates_weekly.contributions_breakdown`.
- **NaN / 0%**:
  - The UI now guards against this. If found, it likely means the backend returned `null` or invalid JSON. `Inspect Payloads` panel will confirm.
