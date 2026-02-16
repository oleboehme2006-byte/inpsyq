import { query } from '@/db/client';
import { startOfWeek, subWeeks, format } from 'date-fns';

export async function getTeamName(teamId: string, orgId: string): Promise<string | null> {
    const res = await query(
        `SELECT name FROM teams WHERE team_id = $1 AND org_id = $2`,
        [teamId, orgId]
    );
    return res.rows[0]?.name || null;
}

export interface TeamDriver {
    id: string;
    label: string;
    score: number;
    influence: 'Positive' | 'Neutral' | 'Negative';
    trend: 'up' | 'down' | 'stable';
    details: {
        mechanism: string;
        causality: string;
        effects: string;
        recommendation: string;
    };
}

export interface TeamAction {
    id: string;
    title: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    details: {
        context: string;
        rationale: string;
        effects: string;
        criticality: 'HIGH' | 'AT RISK' | 'LOW';
        recommendation: string;
    };
}

export interface TeamDashboardData {
    meta: {
        teamId: string;
        teamName: string;
        latestWeek: string;
        computeVersion?: string;
        lastInterpretationAt?: string;
        weeksAvailable: number;
    };
    series: Array<{
        date: string;
        fullDate: string;
        strain: number;
        withdrawal: number;
        trust: number;
        engagement: number;
        confidence: number;
    }>;
    kpiSeeds: {
        strain: number;
        withdrawal: number;
        trust: number;
        engagement: number;
    };
    drivers: TeamDriver[];
    actions: TeamAction[];
    briefing: string[];
    governance: {
        coverage: number;
        dataQuality: number;
        temporalStability: number;
        signalConfidence: number;
        totalSessions: number;
        lastUpdated: string;
    };
    latestIndices: { // Optional for compatibility if needed
        strain: { value: number; qualitative: string };
        withdrawalRisk: { value: number; qualitative: string };
        trustGap: { value: number; qualitative: string };
        engagement: { value: number; qualitative: string };
    };
    attribution: {
        primarySource: 'INTERNAL' | 'EXTERNAL' | 'MIXED' | null;
        internalDrivers: any[];
        externalDependencies: any[];
        propagationRisk: any;
    };
    quality: {
        coverage: number;
        confidence: number;
        missingWeeks: number;
    };
    trend: {
        regime: string;
        volatility: number;
        direction: 'STABLE' | 'UP' | 'DOWN';
    };
}

export async function getTeamDashboardData(
    orgId: string,
    teamId: string,
    weeks: number = 9
): Promise<TeamDashboardData | null> {
    // 1. Validate Organization & Team Access
    // In a real reader, we'd check if team belongs to org. Assuming caller does this or RLS.

    // 2. Fetch Team Info
    const teamRes = await query(
        `SELECT name FROM teams WHERE team_id = $1 AND org_id = $2`,
        [teamId, orgId]
    );

    // If team doesn't exist, return null
    if (teamRes.rows.length === 0) return null;
    const teamName = teamRes.rows[0].name;

    // 3. Fetch Weekly Stats Series
    const statsRes = await query(
        `SELECT week_start, indices
         FROM org_aggregates_weekly
         WHERE team_id = $1 AND org_id = $2
         ORDER BY week_start ASC
         LIMIT $3`,
        [teamId, orgId, weeks]
    );

    const series = statsRes.rows.map(row => {
        const indices = row.indices || {};
        return {
            date: format(new Date(row.week_start), 'MMM d'),
            fullDate: new Date(row.week_start).toISOString(),
            strain: Number(indices.strain) || 0,
            withdrawal: Number(indices.withdrawal_risk) || 0,
            trust: Number(indices.trust_gap) || 0,
            engagement: Number(indices.engagement) || 0,
            confidence: Number(indices.confidence) || 0
        };
    });

    // 4. Get Latest Snapshot
    const last = series[series.length - 1];

    if (!last) {
        return {
            meta: {
                teamId,
                teamName,
                latestWeek: new Date().toISOString(),
                weeksAvailable: 0
            },
            series: [],
            kpiSeeds: { strain: 0, withdrawal: 0, trust: 0, engagement: 0 },
            drivers: [],
            actions: [],
            briefing: ["No data available yet."],
            governance: {
                coverage: 0,
                dataQuality: 0,
                temporalStability: 0,
                signalConfidence: 0,
                totalSessions: 0,
                lastUpdated: new Date().toISOString()
            },
            attribution: {
                primarySource: null,
                internalDrivers: [],
                externalDependencies: [],
                propagationRisk: null
            },
            quality: {
                coverage: 0,
                confidence: 0,
                missingWeeks: 0
            },
            trend: {
                regime: 'NOISE',
                volatility: 0,
                direction: 'STABLE'
            },
            latestIndices: {
                strain: { value: 0, qualitative: 'N/A' },
                withdrawalRisk: { value: 0, qualitative: 'N/A' },
                trustGap: { value: 0, qualitative: 'N/A' },
                engagement: { value: 0, qualitative: 'N/A' }
            }
        };
    }

    // 5. Construct TeamDashboardData
    // For now, mocking aggregated sections (Drivers/Actions) until aggregated tables are ready
    // The previous implementation had mock data here but we want to return structure.

    return {
        meta: {
            teamId,
            teamName,
            latestWeek: last.fullDate,
            computeVersion: 'v1',
            weeksAvailable: series.length
        },
        series,
        kpiSeeds: {
            strain: last.strain,
            withdrawal: last.withdrawal,
            trust: last.trust,
            engagement: last.engagement
        },
        drivers: [], // Placeholder for real driver aggregation
        actions: [], // Placeholder for real action recommendations
        briefing: ["Data pipeline connected. Trends are now based on actual weekly submissions."],
        governance: {
            coverage: 1.0,
            dataQuality: 0.95,
            temporalStability: 0.8,
            signalConfidence: last.confidence,
            totalSessions: 0,
            lastUpdated: last.fullDate
        },
        latestIndices: {
            strain: { value: last.strain, qualitative: 'N/A' },
            withdrawalRisk: { value: last.withdrawal, qualitative: 'N/A' },
            trustGap: { value: last.trust, qualitative: 'N/A' },
            engagement: { value: last.engagement, qualitative: 'N/A' }
        },
        attribution: {
            primarySource: 'INTERNAL',
            internalDrivers: [],
            externalDependencies: [],
            propagationRisk: null
        },
        quality: {
            coverage: 1.0,
            confidence: last.confidence,
            missingWeeks: 0
        },
        trend: {
            regime: 'STABLE',
            volatility: 0.1,
            direction: 'STABLE'
        }
    };
}
