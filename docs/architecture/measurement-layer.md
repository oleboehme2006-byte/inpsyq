# Measurement Layer

The measurement layer transforms raw employee interactions into psychometrically valid parameter signals.

## Architecture

```
User Input → Normalization → Evidence Extraction → Aggregation → Parameter Mapping → Inference
```

## Key Concepts

### ItemSpec & Option Codes
Every question includes an `ItemSpec`. For choice questions, each option has pre-determined coding:

```typescript
{
  construct: 'role_clarity',
  direction: 1,
  strength: 0.9
}
```

### Evidence Record
The atomic unit of measurement:

| Field | Type | Description |
|-------|------|-------------|
| `construct` | string | Psychological construct (e.g., `psychological_safety`) |
| `direction` | +1/-1 | Positive or negative evidence |
| `strength` | 0-1 | Magnitude of evidence |
| `confidence` | 0-1 | Certainty of measurement |
| `type` | enum | `affect`, `cognition`, `behavior_intent` |

### Uncertainty (Sigma)
Sigma varies by source quality:
- **Slider**: σ = 0.1 (most reliable)
- **Choice**: σ = 0.2
- **Text**: σ = 0.3 (least reliable)

Conflicting evidence inflates sigma to prevent false certainty.

## Aggregation

`Evidence[]` → `ConstructMeasurement`:
- **Mean**: Weighted average of evidence strength
- **Sigma**: Combined uncertainty measure

## Parameter Mapping

`ConstructMeasurement` → `EncodedSignal`:
- **Booster**: Cold start (n < 3) allows faster updates
- **Governor**: Established signals capped at 0.15 delta per step
- **Saturation**: Signals dampen approaching extremes

## Consistency Patterns

The consistency classifier detects meta-patterns:

| Pattern | Definition | Implication |
|---------|------------|-------------|
| Impression Management | All positive, avg strength > 0.9 | Lower trust in signals |
| Emotional Ambivalence | Strong +/- for same construct | High sigma, bi-modal state |
| Coherent | Expected variance | Normal processing |

## Session Planning

Sessions are adaptive based on global uncertainty:
- **Exploration** (new users): Up to 12 questions
- **Maintenance** (stable users): ~6 questions

Ensures coverage of at least 5 distinct constructs per session.

## Item Bank Validation

All LLM-generated questions validated against:
- **Clarity**: Length checks, no double-barreled items
- **Construct Validity**: Matches defined taxonomy

## Verification

```bash
npx tsx scripts/verification/measurement.verify.ts
```

## File References

- `services/measurement/measurement.ts` — Aggregation logic
- `services/measurement/param_map.ts` — Parameter mapping
- `services/measurement/item_bank.ts` — Item validation
- `services/measurement/constructs.ts` — 14 rigid dimensions
