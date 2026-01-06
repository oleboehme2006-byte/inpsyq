/**
 * DEMO DATA — Deterministic fixtures for public demo mode
 * 
 * This data is completely static and does not depend on any database.
 * Used by /demo pages to show realistic dashboard views.
 */

// ============================================================================
// Organization
// ============================================================================

export const demoOrg = {
    orgId: 'demo-org-001',
    orgName: 'Acme Industries',
    createdAt: '2025-06-01T00:00:00Z',
};

// ============================================================================
// Teams
// ============================================================================

export const demoTeams = [
    {
        teamId: 'demo-team-engineering',
        name: 'Engineering',
        memberCount: 8,
        healthScore: 0.82,
        trend: 'stable' as const,
    },
    {
        teamId: 'demo-team-product',
        name: 'Product',
        memberCount: 5,
        healthScore: 0.74,
        trend: 'up' as const,
    },
    {
        teamId: 'demo-team-design',
        name: 'Design',
        memberCount: 4,
        healthScore: 0.91,
        trend: 'up' as const,
    },
    {
        teamId: 'demo-team-sales',
        name: 'Sales',
        memberCount: 6,
        healthScore: 0.68,
        trend: 'down' as const,
    },
];

// ============================================================================
// Weekly Trend Data (8 weeks)
// ============================================================================

export const demoWeeklyTrends = {
    engineering: [0.72, 0.74, 0.76, 0.78, 0.80, 0.79, 0.81, 0.82],
    product: [0.68, 0.70, 0.71, 0.70, 0.72, 0.73, 0.73, 0.74],
    design: [0.85, 0.86, 0.88, 0.87, 0.89, 0.90, 0.90, 0.91],
    sales: [0.75, 0.74, 0.72, 0.71, 0.70, 0.69, 0.68, 0.68],
};

export const demoWeekLabels = [
    '2025-12-02',
    '2025-12-09',
    '2025-12-16',
    '2025-12-23',
    '2025-12-30',
    '2026-01-06',
    '2026-01-13',
    '2026-01-20',
];

// ============================================================================
// Watchlist Items
// ============================================================================

export const demoWatchlist = [
    {
        id: 'watch-1',
        teamName: 'Sales',
        signal: 'Workload Pressure',
        severity: 'high' as const,
        trend: 'increasing',
        weeksActive: 3,
    },
    {
        id: 'watch-2',
        teamName: 'Engineering',
        signal: 'Communication Friction',
        severity: 'medium' as const,
        trend: 'stable',
        weeksActive: 2,
    },
    {
        id: 'watch-3',
        teamName: 'Product',
        signal: 'Resource Constraints',
        severity: 'low' as const,
        trend: 'decreasing',
        weeksActive: 1,
    },
];

// ============================================================================
// Interpretation Text Blocks
// ============================================================================

export const demoInterpretations = {
    executive: {
        summary: `Overall organizational health remains strong at 78%, with Design leading at 91% and positive momentum. Engineering shows steady improvement over the past 8 weeks. Sales requires attention due to declining trend—recommend 1:1 check-ins with team lead to understand workload distribution.`,
        recommendations: [
            'Prioritize Sales team support—consider temporary resource allocation',
            'Engineering trajectory is healthy—maintain current approach',
            'Design team excellence could inform best practices for others',
        ],
    },
    team: {
        engineering: {
            summary: `The Engineering team shows consistent improvement with health score now at 82%. Collaboration metrics are strong, and recent sprint velocity indicates sustainable pace. Minor friction in cross-team communication noted but trending downward.`,
            drivers: [
                { name: 'Collaboration', score: 0.85, trend: 'up' },
                { name: 'Workload', score: 0.78, trend: 'stable' },
                { name: 'Recognition', score: 0.80, trend: 'up' },
                { name: 'Communication', score: 0.72, trend: 'up' },
            ],
        },
        sales: {
            summary: `The Sales team health has declined to 68% over the past 4 weeks. Workload pressure is the primary driver, with team members reporting increased client demands without corresponding resource adjustments. Recommend immediate workload review.`,
            drivers: [
                { name: 'Workload', score: 0.55, trend: 'down' },
                { name: 'Recognition', score: 0.72, trend: 'stable' },
                { name: 'Collaboration', score: 0.70, trend: 'stable' },
                { name: 'Communication', score: 0.68, trend: 'down' },
            ],
        },
    },
};

// ============================================================================
// Demo Team Detail View
// ============================================================================

export const demoTeamDetail = {
    teamId: 'demo-team-engineering',
    teamName: 'Engineering',
    weekStart: '2026-01-20',
    healthScore: 0.82,
    trend: 'up' as const,
    memberCount: 8,
    responseRate: 0.875, // 7/8
    drivers: [
        { name: 'Collaboration', score: 0.85, change: 0.02 },
        { name: 'Workload Balance', score: 0.78, change: 0.01 },
        { name: 'Recognition', score: 0.80, change: 0.03 },
        { name: 'Communication', score: 0.72, change: 0.04 },
        { name: 'Growth', score: 0.76, change: 0.00 },
    ],
    weeklyHistory: [
        { weekStart: '2025-12-02', score: 0.72 },
        { weekStart: '2025-12-09', score: 0.74 },
        { weekStart: '2025-12-16', score: 0.76 },
        { weekStart: '2025-12-23', score: 0.78 },
        { weekStart: '2025-12-30', score: 0.80 },
        { weekStart: '2026-01-06', score: 0.79 },
        { weekStart: '2026-01-13', score: 0.81 },
        { weekStart: '2026-01-20', score: 0.82 },
    ],
    interpretation: demoInterpretations.team.engineering.summary,
};
