# Core Principles

The fundamental invariants and architectural decisions that define InPsyq.

## 1. Time is Discrete (The "Week")

InPsyq operates on a strictly discrete temporal model.

- **Atom**: One ISO week (Monday 00:00 UTC to Sunday 23:59 UTC).
- **Invariant**: A week is either `OPEN` (collecting data) or `CLOSED` (aggregated).
- **Implication**: There is no "real-time" fluctuation of aggregate scores. Scores change exactly once per week.

### Canonical Week Resolution
```typescript
import { getCanonicalWeek } from '@/lib/week';
// Always returns the Monday date string (YYYY-MM-DD)
```

## 2. Determinism (Input Hash → Output)

The entire pipeline (Aggregation → Attribution → Interpretation) is a pure function of its inputs.

- **Rule**: If the underlying survey data hasn't changed, the output *must not* change.
- **Mechanism**: Every pipeline stage computes an `input_hash` of its source data.
- **Benefit**:
  - Idempotency (safe to re-run pipeline 100 times)
  - Caching (skip expensive LLM calls if hash matches)
  - Debuggability (reproduce production bugs locally)

## 3. Global Uniqueness

- **User**: Identified by `user_id` (UUID). Unique globally.
- **Identity**: `email` is the unique identity claim.
- **Session**: A user can perform exactly **ONE** measurement session per week globally.
  - Constraint: `UNIQUE(user_id, week_start)`
  - Rationale: Prevents "gaming" the system or over-sampling.

## 4. Tenant Isolation

All queries MUST be scoped by `org_id`.

- **Hard Constraint**: Every database query touching `measurements`, `scores`, or `users` must include `WHERE org_id = ...`.
- **Exception**: Super-admin diagnostic tools (internal only).

## 5. "Zero-Hype" Interpretation

Our AI insights must be conservative, grounded, and suppress noise.

- **Grounding Contract**: Every claim made by the LLM must cite specific evidence (JSON path) in the input data.
- **External Dominance**: We attribute stress to external factors (market, restructuring) *first* before blaming internal culture.
- **Monitor Mode**: If data is stable, say nothing. Do not invent insights for the sake of volume.

## 6. One Dimension → One Visual Layer

Design principle for Data Visualization:
- **Index Value** → Position / Height
- **Volatility** → Uncertainty Band Width / Opacity
- **Severity** → Color (Red/Amber/Green)
- **Context** → Annotations

Never overload a visual channel (e.g., don't use color for both severity and category).
