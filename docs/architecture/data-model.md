# Data Model

This document describes the database schema, key invariants, and data consistency rules.

## Core Tables

### Organizations & Users

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `orgs` | `org_id` | Organizations |
| `users` | `user_id` | User accounts |
| `teams` | `team_id` | Teams within orgs |
| `memberships` | `membership_id` | User-org-team-role mapping |

### Authentication

| Table | Purpose |
|-------|---------|
| `login_tokens` | Magic link tokens with expiry |
| `sessions` | Active user sessions |

### Measurement

| Table | Purpose |
|-------|---------|
| `measurement_sessions` | Weekly measurement sessions per user |
| `measurement_responses` | Individual question responses |
| `measurement_quality` | Quality metrics per session |

### Aggregation & Interpretation

| Table | Purpose |
|-------|---------|
| `org_aggregates_weekly` | Weekly aggregated metrics |
| `weekly_interpretations` | LLM-generated interpretations |

## Key Constraints

### Unique Constraints

| Table | Constraint | Purpose |
|-------|------------|---------|
| `measurement_sessions` | `(user_id, week_start)` | One session per user per week |
| `weekly_interpretations` | `(org_id, team_id, week_start, is_active)` | One active interpretation |

### Foreign Keys

- `teams.org_id` → `orgs.org_id`
- `memberships.user_id` → `users.user_id`
- `memberships.org_id` → `orgs.org_id`
- `memberships.team_id` → `teams.team_id`
- `measurement_sessions.org_id` → `orgs.org_id`

## Data Invariants

### Measurement Sessions

1. **One per user per week**: Global unique constraint on `(user_id, week_start)`
2. **Status progression**: `PENDING` → `IN_PROGRESS` → `COMPLETED`
3. **Immutable after completion**: Completed sessions cannot be modified

### Interpretations

1. **One active per scope**: Only one `is_active=true` per org/team/week
2. **Versioned**: Old interpretations retained with `is_active=false`
3. **Input hash**: Tracks input data version for cache invalidation

### Week Start Format

- Always Monday 00:00:00 UTC
- Format: `YYYY-MM-DD` (ISO date string)
- Consistent across all tables

## Test Organization

**Dedicated ID**: `99999999-9999-4999-8999-999999999999`

**Fixture IDs (never use for test org)**:
- `11111111-1111-4111-8111-111111111111`
- `22222222-2222-4222-8222-222222222222`
- `33333333-3333-4333-8333-333333333333`

## Canonical Counts (Test Org)

| Entity | Count |
|--------|-------|
| Teams | 3 (Alpha, Beta, Gamma) |
| Employees | 15 (5 per team) |
| Weeks | 6+ |
| Sessions | ~90 |

## Schema Evolution

Schema changes follow these rules:
1. Additive changes preferred
2. New columns with defaults
3. Migration scripts in `scripts/`
4. Backward compatibility required

## Verification

```bash
# Schema verification
npx tsx scripts/verification/schema.verify.ts

# Test org status
npx tsx scripts/verification/test-org.verify.ts
```
