# Interpretation Layer

## Overview

The interpretation layer generates **natural language narratives** from structured psychometric data.

```
Aggregation → Input Contract → Policy Evaluation → LLM Generation → Validation → Cache
```

---

## Input Contract

The interpretation service receives a strict input subset:

```typescript
interface InterpretationInput {
  teamId: string | null;  // null for org-level
  weekStart: string;
  
  // From aggregation
  indexScores: Record<IndexId, number>;
  trends: Record<IndexId, TrendIndicator>;
  
  // From attribution
  source: 'INTERNAL' | 'EXTERNAL' | 'MIXED';
  internalDrivers: DriverSummary[];
  externalDependencies: ExternalSummary[];
  propagationRisk: 'HIGH' | 'ELEVATED' | 'LOW';
  
  // Action gate
  allowInternalActions: boolean;
  maxInternalActions: number;
}
```

### Implementation

```
lib/interpretation/input.ts
```

---

## Policy Rules

Policy rules determine **what can be said** based on data state:

| Rule | Condition | Effect |
|------|-----------|--------|
| External Dominance | source = EXTERNAL | No internal action recommendations |
| All Stable | All indices STABLE/NORMAL | Max 1 focus area, "monitor" only |
| No Critical | No D3 or CRITICAL | No "urgent" language |
| Low Participation | Participation < 50% | Add data quality caveat |

### Implementation

```
lib/interpretation/policy.ts
```

---

## Output Structure

```typescript
interface InterpretationSections {
  summary: string;           // 2-3 sentences, week overview
  highlights: string[];      // 2-4 positive observations
  concerns: string[];        // 0-3 areas needing attention
  recommendations: string[]; // 0-5 action items (gated by policy)
  
  metrics: {
    [indexId: string]: {
      value: number;
      trend: string;
      qualitativeState: string;
    };
  };
}
```

### Implementation

```
lib/interpretation/types.ts
```

---

## Generation

### LLM Integration

Primary generation uses OpenAI GPT-4:

```
services/interpretation/service.ts
```

- Structured prompt with semantic rules
- JSON mode for reliable parsing
- Temperature: 0.3 (low creativity, high consistency)

### Deterministic Fallback

If LLM fails or is unavailable:

```
lib/interpretation/generator.ts
```

- Rule-based template filling
- No creativity, pure data transformation
- Always available as backup

---

## Validation

### Grounding Validation

Generated text must only reference entities that exist in input:

```typescript
validateGrounding(sections: InterpretationSections, input: InterpretationInput): void
```

Checks:
- Driver names mentioned exist in input
- Index names mentioned exist in input
- No invented team members or projects

### Shape Validation

```typescript
validateShape(sections: InterpretationSections): void
```

Checks:
- Summary: 20-100 words
- Highlights: 2-4 items, each 5-20 words
- Concerns: 0-3 items
- Recommendations: Per policy max

### Numeric Spam Guard

Interpretations should not over-rely on numbers:

```typescript
validateNumericDensity(text: string): void
```

- Max 6 numeric values per section
- Prevents "score of 67.3, up 2.1 from 65.2..."

### Implementation

```
lib/interpretation/validate.ts
```

---

## Caching

### Idempotency

Interpretations are cached by input hash:

```
Cache Key: (org_id, team_id, week_start, input_hash)
```

If input hash matches existing active interpretation:
- Return cached version
- No regeneration

If input hash differs:
- Generate new interpretation
- Mark new as `is_active = true`
- Mark old as `is_active = false`

### Hash Computation

```
lib/interpretation/hash.ts
```

Input hash covers:
- All index scores (rounded to 1 decimal)
- All driver severities
- Source classification
- Temporal indicators

---

## Database Schema

```sql
weekly_interpretations (
  id             SERIAL PRIMARY KEY,
  org_id         UUID NOT NULL,
  team_id        UUID,              -- NULL for org-level
  week_start     DATE NOT NULL,
  input_hash     TEXT NOT NULL,
  model_id       TEXT NOT NULL,     -- e.g., "gpt-4-turbo"
  prompt_version TEXT NOT NULL,     -- e.g., "v2.3"
  sections_json  JSONB NOT NULL,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ
)
```

---

## API Endpoints

| Endpoint | Scope | Guard |
|----------|-------|-------|
| `/api/interpretation/team` | Single team | TEAMLEAD+ |
| `/api/interpretation/executive` | Org-wide | EXECUTIVE/ADMIN |

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `INSUFFICIENT_DATA` | Not enough responses | Return empty with caveat |
| `VALIDATION_FAILED` | Generated text invalid | Retry with fallback |
| `LLM_UNAVAILABLE` | API timeout/error | Use deterministic fallback |
