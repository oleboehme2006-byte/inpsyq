# UI Handoff — Phase 1: Dashboard Data Wiring

**Author:** Claude Code
**Phase:** 1 — Dashboard Logic (Teamlead/Executive)
**Status:** Data wiring complete. Visual styling deferred to Antigravity.

---

## What Changed

All synthetic `Math.sin/cos` data generation has been replaced with real data flowing from `org_aggregates_weekly` through the service layer into the client components. The components now have two clearly defined paths: **real data** (production) and **demo fallback** (DEMO_MODE / empty state).

---

## ExecutiveClientWrapper

**File:** `components/dashboard/executive/ExecutiveClientWrapper.tsx`

### State

| Hook/State | Type | Description |
|------------|------|-------------|
| `selectedKpi` | `'strain' \| 'withdrawal' \| 'trust-gap' \| 'engagement'` | Which KPI card is active. Controls which metric the main chart displays. Set via KPICard `onClick`. |
| `mounted` | `boolean` | Hydration guard. Component returns `null` until client-side mount. Used to prevent SSR/client mismatch on the chart. |

### Derived Data (useMemo)

| Memo | Source (production) | Source (demo fallback) |
|------|---------------------|------------------------|
| `graphData` | `initialData.series` — `TeamSeriesPoint[]` from `org_aggregates_weekly` (12 weekly averages across all teams, 0-100 scale) | Synthetic `Math.sin/cos` 12-point series |
| `kpis` | `initialData.kpis` — `ExecutiveKPI[]` from server with real week-over-week delta trends | Derived from last two `graphData` points |

### Props Passed Down

| Component | Prop | Data Source |
|-----------|------|-------------|
| `KPICard` | `id, label, value, trendValue, color, isActive, onClick` | `kpis` memo |
| `EngagementIndexGraph` | `metric={selectedKpi}, data={graphData}` | `selectedKpi` state + `graphData` memo |
| `TeamPortfolioTable` | `teams={initialData.teams}` | Server data (`ExecutiveTeam[]`) |
| `DriversWatchlistSection` | `drivers, watchlist` | Server data |
| `Briefing` | `paragraphs` | Server data (LLM or deterministic) |
| `DataGovernance` | `coverage, dataQuality, totalSessions, lastUpdated` | `initialData.governance` |

### Data Interface

```typescript
// Comes from services/dashboard/executiveReader.ts
interface ExecutiveDashboardData {
    orgName: string;
    kpis: ExecutiveKPI[];          // Real: 4 cards with actual trend deltas
    teams: ExecutiveTeam[];        // Real: per-team latest-week snapshot
    drivers: ExecutiveDriver[];    // Real: systemic driver analysis (max 3)
    watchlist: ExecutiveWatchlistItem[];  // Real: risk predictions (max 3)
    briefingParagraphs: string[];  // Real: LLM or deterministic HTML strings
    series: TeamSeriesPoint[];     // Real: 12-week org-level time series
    governance: ExecutiveGovernance;
}

// Each graph data point (matches EngagementIndexGraph expectations)
interface TeamSeriesPoint {
    date: string;               // 'MMM d' display format
    fullDate: string;           // ISO string for X-axis
    strain: number;             // 0-100
    withdrawal: number;         // 0-100
    trust: number;              // 0-100
    engagement: number;         // 0-100
    confidence: number;         // CI width in percentage points (5 = good data, 15 = sparse)
    strainRange: [number, number];
    withdrawalRange: [number, number];
    trustRange: [number, number];
    engagementRange: [number, number];
}
```

---

## TeamPortfolioTable

**File:** `components/dashboard/executive/TeamPortfolioTable.tsx`

### Props

```typescript
interface TeamPortfolioTableProps {
    teams: ExecutiveTeam[];
}
```

### Behavior

- **Real data:** Uses `teams` prop directly. Links route to `/team/${team.teamId}` (UUID).
- **Demo fallback:** When `teams` is empty, resolves to `executiveMockData.teams`. Links use `/team/${name.toLowerCase()}` for mock slugs.
- Sorts teams: `Critical → At Risk → Healthy`.
- Status bar proportions are computed from real team counts.

### `ExecutiveTeam` Shape

```typescript
interface ExecutiveTeam {
    teamId: string;          // UUID — used for routing to team dashboard
    name: string;
    status: 'Critical' | 'At Risk' | 'Healthy';
    members: number;         // From quality.sampleSize (proxy; not total headcount)
    strain: number;          // 0-100
    withdrawal: number;      // 0-100
    trust: number;           // 0-100
    engagement: number;      // 0-100
    coverage: number;        // 0-100 (participationRate × 100)
}
```

**Styling hook:** Bold thresholds are baked into the component (strain >60, withdrawal >50, etc.) — these use semantic Tailwind classes (`text-strain`, `text-withdrawal`, `text-engagement`). Antigravity can adjust colors by modifying those CSS variable values in the theme.

---

## TeamClientWrapper

**File:** `components/dashboard/team/TeamClientWrapper.tsx`
*(No changes made — already had the correct real-data path)*

### State

| Hook/State | Type | Description |
|------------|------|-------------|
| `selectedKpi` | `'strain' \| 'withdrawal' \| 'trust-gap' \| 'engagement'` | Active KPI, controls chart metric |
| `mounted` | `boolean` | Hydration guard |

### Data Path

```
teamReader.ts:getTeamDashboardData(orgId, teamId)
  → TeamDashboardEntry.series: TeamSeriesPoint[]  ← real 12-week series (now correctly scaled 0-100)
  → TeamDashboardEntry.drivers: TeamDriver[]
  → TeamDashboardEntry.actions: TeamAction[]
  → TeamDashboardEntry.briefing: string[]
  → TeamDashboardEntry.governance: TeamGovernance
```

If `initialData.series` is present → real chart. If absent → falls back to `kpiSeeds` synthetic generation (demo only).

---

## DataGovernance

**File:** `components/dashboard/executive/DataGovernance.tsx`

Now receives live props from `initialData.governance`:

| Prop | Source | Notes |
|------|--------|-------|
| `coverage` | `avg participationRate × 100` across teams | |
| `dataQuality` | `coverage × 0.9` (proxy) | Can be upgraded to use `quality.coherence` when available |
| `totalSessions` | `SUM(quality.sampleSize)` across teams | Proxy for total sessions; not total employees |
| `lastUpdated` | `latest week_start` formatted | |
| `temporalStability` | *(not yet wired — defaults to 81)* | Available in `buildTeamIndexSeries()` quality output |
| `signalConfidence` | *(not yet wired — defaults to 75)* | Available in `buildTeamIndexSeries()` quality output |

---

## Series Data Contract (Shared by Both Dashboards)

The `EngagementIndexGraph` component reads data like this:

```typescript
// For metric='strain', it reads:
dataPoint.strain          // main line value (0-100)
dataPoint.strainRange     // [low, high] confidence band
dataPoint.fullDate        // X-axis label
```

The metric key maps as:
- `'trust-gap'` in UI state → `trust` key in data point
- `'withdrawal'` in UI state → `withdrawal` key in data point

**Important:** The chart Y-axis is 0-100. All series values from `org_aggregates_weekly` are stored as 0-1 in the DB and **must be multiplied by 100** before being passed to any chart component. This conversion happens in `teamReader.ts` and `executiveReader.ts`.

---

## Styling Notes for Antigravity

### Color Tokens in Use

```
text-strain      → CSS var for high-risk metric color (used: strain KPI, critical status)
text-withdrawal  → CSS var for medium-risk metric color
text-trust-gap   → CSS var for trust gap metric
text-engagement  → CSS var for positive metric (used: healthy status, engagement KPI)
text-text-primary, text-text-secondary, text-text-tertiary → text hierarchy
text-accent-primary → hover/active accent color
bg-[#050505]     → component background
border-white/10  → border opacity
```

### KPI Card Active State

`isActive={selectedKpi === kpi.id}` toggles a visual highlight on the card. The component handles its own active ring/glow — Antigravity can polish the ring intensity.

### Chart Metric State

`selectedKpi` drives which area chart is rendered. Clicking any KPI card updates `selectedKpi`. The chart transition (crossfade/morph) is handled inside `EngagementIndexGraph`.

### Demo vs Production Visual Cues

No visual distinction exists between demo and production data currently. Antigravity may want to add a subtle "LIVE DATA" / "DEMO" badge if desired — the boolean `initialData.series.length > 0` is the correct signal.
