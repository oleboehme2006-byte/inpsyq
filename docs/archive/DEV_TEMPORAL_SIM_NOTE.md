# DEV_TEMPORAL_SIM_NOTE.md

## Week Start Derivation

**Table:** `org_aggregates_weekly`  
**Key:** `(org_id, team_id, week_start)`  
**Convention:** `week_start` is the **Monday (ISO week start)** at UTC midnight.

## How week_start is Used

1. **Simulation** → writes sessions with `started_at` timestamps
2. **Aggregation** → uses `date_trunc('week', started_at)` to discover weeks
3. **ProfileService** → computes employee profile for `(user_id, week_start)`
4. **AggregationService** → uses employee_profiles to compute org aggregate for `(org_id, team_id, week_start)`
5. **DecisionService** → queries ALL weeks from org_aggregates_weekly, returns `coverage_weeks = rows.length`
6. **Dashboard** → receives `meta.range_weeks = coverage_weeks`

## Key Insight

The `range_weeks` in dashboards directly equals the **number of rows** in `org_aggregates_weekly` for that team.

```sql
SELECT COUNT(*) as coverage_weeks
FROM org_aggregates_weekly
WHERE org_id = $1 AND team_id = $2
```

## Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| `range_weeks = 0` | No aggregates | Run `agg:dev` |
| `range_weeks = 1` | Only current week simulated | Use `--weeks 9` |
| Timezone mismatch | Dates computed in local TZ | Use UTC throughout |

## Computing Monday

```typescript
function getWeekMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
```
