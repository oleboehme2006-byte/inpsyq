# Dashboard Layer

The dashboard layer provides deterministic, executive-grade decision support data for team leads and executives.

## Architecture

```
Weekly Aggregates → Read Services → API Routes → Dashboard UI
```

### Data Flow

```
org_aggregates_weekly (DB)
       ↓
teamReader / executiveReader (Cache)
       ↓
API routes (RBAC guarded)
       ↓
Dashboard Components
```

## Dashboards

### Teamlead Dashboard
**Route**: `/admin/teamlead`  
**API**: `/api/admin/team-dashboard`  
**Guard**: TEAMLEAD or ADMIN role

Answers 5 critical questions:
1. **State**: How critical is the situation? (Healthy / At Risk / Critical)
2. **Trend**: Is it getting better or worse?
3. **Drivers**: What are the root causes?
4. **Influence**: What is within our control?
5. **Action**: What should we do now?

**Components**:
- `StateCard`: Health Score & Severity
- `TrendSection`: 9-week history with semantic axis
- `DriverInfluenceTable`: Ranked risks grouped by scope
- `ActionCard`: Primary recommendation with checklist

### Executive Dashboard
**Route**: `/admin/executive`  
**API**: `/api/admin/executive-dashboard`  
**Guard**: EXECUTIVE or ADMIN role

**Displays**:
- Org-level state card
- Risk distribution (critical/at_risk/healthy counts)
- Team portfolio table with severity bars
- Systemic drivers panel
- Governance summary with coverage %

## Decision Service

The `DecisionService` transforms raw aggregates into structured decision snapshots:

### State Classification
Health Score calculated from:
- WRP (Work-Recovery Pace)
- OUC (Org Unit Compatibility)
- TFP (Team Friction Pressure - inverted)
- Strain (inverted)
- Withdrawal (inverted)

**Thresholds**:
- CRITICAL: Health < 0.4
- AT_RISK: Health < 0.7
- HEALTHY: Health >= 0.7

### Trend Analysis
Linear regression on health score over available history:
- IMPROVING: Slope > +0.02
- DECLINING: Slope < -0.02
- STABLE: Between -0.02 and +0.02

### Driver Attribution
Parameters analyzed for deviation from ideal:
- **Impact**: abs(Ideal - Actual)
- **Influence Scope**: SYSTEMIC / LEADERSHIP / TEAM / INDIVIDUAL

### Action Recommendation
Rule-based matching:
1. HEALTHY & STABLE → `MAINTAIN_COURSE`
2. CRITICAL/AT_RISK → Match top actionable driver to template

## Performance Targets

| Endpoint | Target |
|----------|--------|
| team-dashboard (cached) | < 500ms |
| team-dashboard (uncached) | < 900ms |
| executive-dashboard (cached) | < 1s |
| executive-dashboard (uncached) | < 2s |

## Caching Strategy

- In-memory cache with TTL
- Invalidates on `input_hash` change
- Cache key: `{org_id}:{team_id}:{week_start}`

## Verification

```bash
# API verification
ORG_ID=<uuid> TEAM_ID=<uuid> npx tsx scripts/verification/dashboard.verify.ts

# Manual UI verification
# 1. Navigate to http://localhost:3001/admin/teamlead
# 2. Enter org/team IDs
# 3. Verify all 5 blocks render correctly
```

## File References

- `services/dashboard/cache.ts` — In-memory cache
- `services/dashboard/teamReader.ts` — Team dashboard data
- `services/dashboard/executiveReader.ts` — Executive aggregator
- `services/decision/decisionService.ts` — Orchestrator
- `services/decision/stateEvaluator.ts` — Health score logic
- `services/decision/trendEvaluator.ts` — Trend analysis
- `services/decision/driverAttribution.ts` — Risk ranking
- `services/decision/actionEngine.ts` — Recommendation matching
