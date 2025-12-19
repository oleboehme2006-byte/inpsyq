# RUNBOOK: Dashboard Verification

## UI Verification Checklist

### Teamlead Dashboard
- **URL:** http://localhost:3001/admin/teamlead
- [ ] Page loads without errors
- [ ] DemoConfig panel shows org/team selection
- [ ] After loading data:
  - [ ] Block 1: State badge shows HEALTHY/AT_RISK/CRITICAL
  - [ ] Block 2: Trend shows direction with mini chart
  - [ ] Block 3: Drivers toggleable between Risks/Strengths
  - [ ] Block 4: Influence shows drivers grouped by scope
  - [ ] Block 5: Action shows primary recommendation
- [ ] Audit footer shows sessions, participation, weeks
- [ ] "Inspect DTO" button works (dev only)

### Executive Dashboard
- **URL:** http://localhost:3001/admin/executive
- [ ] Page loads without errors
- [ ] Org ID input works
- [ ] After loading:
  - [ ] Org state card displays
  - [ ] Risk distribution shows critical/at_risk/healthy counts
  - [ ] Team portfolio table with severity bars
  - [ ] Systemic drivers panel
  - [ ] Governance summary with coverage %
- [ ] "View →" links point to teamlead dashboard

---

## API Verification Commands

### 1. Get Team Dashboard DTO
```bash
ORG_ID="<your-org-uuid>"
TEAM_ID="<your-team-uuid>"
curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=$ORG_ID&team_id=$TEAM_ID" | jq '{
  state: .state.label,
  trend: .trend.direction,
  risks: .drivers.top_risks | length,
  action: .action.recommended.title,
  duration_ms: .meta.duration_ms
}'
```

### 2. Get Executive Dashboard DTO
```bash
ORG_ID="<your-org-uuid>"
curl -s "http://localhost:3001/api/admin/executive-dashboard?org_id=$ORG_ID" | jq '{
  teams: .teams | length,
  org_state: .org_state.label,
  critical: .risk_distribution.critical,
  systemic_drivers: .systemic_drivers | length
}'
```

### 3. Verify Dashboard Schema
```bash
curl -s http://localhost:3001/api/internal/verify-dashboard | jq '.schema'
```

---

## Performance Targets

| Endpoint | Target |
|----------|--------|
| team-dashboard (cached) | < 500ms |
| team-dashboard (uncached) | < 900ms |
| executive-dashboard (cached) | < 1s |
| executive-dashboard (uncached) | < 2s |

---

## Automated Verification

```bash
# With env vars
ORG_ID=<uuid> TEAM_ID=<uuid> npm run verify:dashboard
```

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "No data found" | Team has no aggregates | Run sessions first |
| Empty drivers | DecisionService returned empty | Check org_aggregates_weekly |
| Blocked governance | Risk thresholds exceeded | Review epistemic/ethical risk |
