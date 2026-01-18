# InPsyq Admin Demo: Semantic Scaling Logic

## Overview
The "Organizational Stability Indices" chart uses a **Semantic Scale** (0-100) to visualize latent metrics that otherwise have varying or non-intuitive raw ranges. This layer ensures executive usability without altering the underlying frozen core data.

## 1. Y-Axis Interpretation ("Stability Score")
The Y-axis represents **Stability/Health**, where:
- **100 (Top)**: Optimal state.
- **50 (Mid)**: Stable/Neutral.
- **0 (Bottom)**: Critical Risk.

Labels: `Optimal` | `Good` | `Stable` | `Risk` | `Critical`

## 2. Metric Normalization Logic
Raw metric values ($v_{raw}$) are normalized to a Stability Score ($S$) of 0-100.

### A. Strain & Withdrawal
(Lower is Better)
- **Concept**: 0.0 is perfect, 1.0 is failure.
- **Formula**: $S = (1 - clamp(v_{raw}, 0, 1)) \times 100$

### B. Trust Divergence (Gap)
(Cluster around 0 is Better)
- **Concept**: 0.0 is perfect alignment. Deviation (+/-) is instability.
- **Formula**: $S = (1 - clamp(|v_{raw}|, 0, 1)) \times 100$

## 3. Semantic Bands (Tooltips)
Tooltips display qualitative bands based on `lib/visualization/mapping.ts`:

### Strain
| Raw Range | Label | Color |
|---|---|---|
| 0.0 - 0.2 | Optimal | Green |
| 0.2 - 0.4 | Healthy | Blue |
| 0.4 - 0.6 | Elevated | Amber |
| > 0.6 | Critical | Red |

### Withdrawal
| Raw Range | Label | Color |
|---|---|---|
| 0.0 - 0.2 | Committed | Green |
| 0.2 - 0.4 | Stable | Blue |
| 0.4 - 0.6 | Drifting | Amber |
| > 0.6 | Disconnected | Red |

### Trust Gap
| Abs. Range | Label | Color |
|---|---|---|
| 0.0 - 0.1 | Balanced | Green |
| 0.1 - 0.3 | Aligned | Blue |
| 0.3 - 0.6 | Fractured | Amber |
| > 0.6 | Polarized | Red |

## Implementation
- **Source**: `components/admin/DemoDashboard.tsx`
- **Mapping**: `lib/visualization/mapping.ts`
- **Frontend Only**: No modification to backend payloads.
