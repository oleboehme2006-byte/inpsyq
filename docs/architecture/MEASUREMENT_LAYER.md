# Measurement Layer

## Overview

The measurement layer handles weekly psychometric data collection from employees.

```
Employee → Survey UI → Responses → Quality Assessment → Storage
```

---

## Session Lifecycle

### States

| State | Description |
|-------|-------------|
| `PENDING` | Session created, not started |
| `IN_PROGRESS` | Employee actively responding |
| `COMPLETED` | All required items answered |
| `ABANDONED` | Session expired without completion |

### Flow

```
1. Weekly job creates PENDING sessions for all employees
2. Employee opens survey → IN_PROGRESS
3. Employee submits → COMPLETED (or timeout → ABANDONED)
4. Quality metrics computed
```

### Uniqueness Constraint

```sql
UNIQUE(user_id, week_start)
```

**Each user can have exactly ONE session per week globally.** This constraint spans all organizations.

---

## Implementation

### Session Management

```
lib/measurement/session.ts
```

| Function | Purpose |
|----------|---------|
| `createSession()` | Initialize new session |
| `startSession()` | Transition to IN_PROGRESS |
| `completeSession()` | Validate and finalize |
| `getSessionForWeek()` | Lookup by user and week |

### Response Handling

```
lib/measurement/response.ts
```

| Function | Purpose |
|----------|---------|
| `recordResponse()` | Store single item response |
| `getResponses()` | Fetch all responses for session |
| `validateResponse()` | Enforce item constraints |

---

## Quality Metrics

### Computed Metrics

```
lib/measurement/quality.ts
```

| Metric | Formula | Purpose |
|--------|---------|---------|
| `completion_rate` | answered / required items | Data completeness |
| `response_time_ms` | completed_at - started_at | Engagement proxy |
| `missing_items` | Count of unanswered required | Gap indicator |
| `confidence_proxy` | Composite of above | Overall quality score |

### Quality Thresholds

| Quality | Completion Rate | Response Time |
|---------|-----------------|---------------|
| High | ≥ 95% | 30s - 5min |
| Medium | 70-95% | 5min - 15min |
| Low | < 70% | < 30s or > 15min |

Very fast responses (< 30s for full survey) indicate random clicking.
Very slow responses (> 15min) indicate distraction or abandonment.

---

## Database Schema

```sql
measurement_sessions (
  session_id   UUID PRIMARY KEY,
  user_id      UUID NOT NULL,
  org_id       UUID NOT NULL,
  team_id      UUID NOT NULL,
  week_start   DATE NOT NULL,
  status       TEXT NOT NULL,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  UNIQUE(user_id, week_start)  -- Global constraint
)

measurement_responses (
  response_id   UUID PRIMARY KEY,
  session_id    UUID NOT NULL,
  user_id       UUID NOT NULL,
  item_id       TEXT NOT NULL,
  numeric_value NUMERIC,
  text_value    TEXT
)

measurement_quality (
  session_id       UUID PRIMARY KEY,
  completion_rate  NUMERIC,
  response_time_ms INTEGER,
  missing_items    INTEGER,
  confidence_proxy NUMERIC
)
```

---

## Week Handling

### ISO Week Convention

```
lib/measurement/week.ts
```

- Weeks start on **Monday**
- Week denoted by start date (YYYY-MM-DD format)
- `getWeekStart()`: Get Monday of given date
- `getCurrentWeek()`: Monday of current week

### Example

```
Date: 2024-01-18 (Thursday)
Week Start: 2024-01-15 (Monday)
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/measure/start` | POST | Begin session |
| `/api/measure/respond` | POST | Submit response |
| `/api/measure/complete` | POST | Finalize session |
| `/api/measure/status` | GET | Session status |

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `SESSION_EXISTS` | Duplicate session for week | Return existing session |
| `SESSION_EXPIRED` | Past completion window | Mark abandoned |
| `INVALID_ITEM` | Item ID not in registry | Reject response |
| `VALUE_OUT_OF_RANGE` | Response outside scale | Reject response |
