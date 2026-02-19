import { query } from '@/db/client';
import { TeamDashboardEntry, TeamDriver, TeamAction, TeamSeriesPoint } from '@/lib/mock/teamDashboardData';
import { DRIVER_CONTENT } from '@/lib/content/driverLibrary';
import { DriverFamilyId, isValidDriverFamilyId } from '@/lib/semantics/driverRegistry';
import { InternalDriverAttribution } from '@/lib/attribution/types';
import { WeeklyInterpretationSections, WeeklyInterpretationRecord } from '@/lib/interpretation/types';
import { format } from 'date-fns';
import { getQualitativeStateForIndex } from '@/lib/semantics/indexRegistry';
import { AttributionResult } from '@/lib/attribution/types';

/**
 * Fetch real dashboard data for a team.
 */
export type TeamDashboardData = TeamDashboardEntry;

export async function getTeamDashboardData(
    orgId: string,
    teamId: string,
    weeksHistory: number = 12
): Promise<TeamDashboardEntry | null> {
    // 1. Fetch Team Metadata (Name, etc.)
    const teamRes = await query(
        `SELECT name FROM teams WHERE team_id = $1 AND org_id = $2`,
        [teamId, orgId]
    );

    if (teamRes.rows.length === 0) return null;
    const teamName = teamRes.rows[0].name;

    // 2. Fetch Weekly Aggregates (Series Data)
    const aggregatesRes = await query(
        `SELECT week_start, indices, quality, attribution, team_state
         FROM org_aggregates_weekly
         WHERE org_id = $1 AND team_id = $2
         ORDER BY week_start DESC
         LIMIT $3`,
        [orgId, teamId, weeksHistory]
    );

    if (aggregatesRes.rows.length === 0) return null;

    // Sort ascending for graph
    const rows = aggregatesRes.rows.reverse();
    const latestRow = rows[rows.length - 1];

    // 3. Build Series
    const series: TeamSeriesPoint[] = rows.map(row => {
        const date = new Date(row.week_start);
        const indices = row.indices || {};
        const quality = row.quality || {};
        const confidence = (quality.sampleSize || 0) > 3 ? 5 : 15; // Simple confidence logic

        const point: TeamSeriesPoint = {
            date: format(date, 'MMM d'),
            fullDate: date.toISOString(),
            strain: indices.strain || 0,
            withdrawal: indices.withdrawal_risk || 0,
            trust: indices.trust_gap || 0,
            engagement: indices.engagement || 0,
            confidence: confidence, // Base confidence
            strainRange: [indices.strain - confidence, indices.strain + confidence],
            withdrawalRange: [indices.withdrawal_risk - confidence, indices.withdrawal_risk + confidence],
            trustRange: [indices.trust_gap - confidence, indices.trust_gap + confidence],
            engagementRange: [indices.engagement - confidence, indices.engagement + confidence],
        };
        return point;
    });

    // 4. Build Drivers (from latest attribution)
    const attributionResults = (latestRow.attribution as AttributionResult[]) || [];

    // Aggregation for UI Drivers (Deduped, Top 3)
    const allInternalDrivers: InternalDriverAttribution[] = attributionResults.flatMap(r => r.internal || []);
    const distinctDrivers = new Map<string, InternalDriverAttribution>();

    for (const d of allInternalDrivers) {
        if (!isValidDriverFamilyId(d.driverFamily)) continue;
        const existing = distinctDrivers.get(d.driverFamily);
        if (!existing || d.score > existing.score) {
            distinctDrivers.set(d.driverFamily, d);
        }
    }

    const drivers: TeamDriver[] = Array.from(distinctDrivers.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(d => {
            const content = DRIVER_CONTENT[d.driverFamily] || {
                label: d.driverFamily,
                mechanism: 'Mechanism not available',
                causality: 'Causality not available',
                effects: 'Effects not available',
                recommendation: 'Recommendation not available'
            };

            return {
                id: d.driverFamily,
                label: content.label || d.driverFamily,
                score: Math.round((d.score || 0) * 100),
                influence: 'Negative',
                trend: d.supportingSignals?.trend === 'worsening' ? 'up' : 'stable',
                details: {
                    mechanism: content.mechanism,
                    causality: content.causality,
                    effects: content.effects,
                    recommendation: content.recommendation
                } as any
            };
        });

    // 5. Fetch Interpretation (for Briefing & Actions)
    const interpRes = await query(
        `SELECT sections_json, created_at
         FROM weekly_interpretations
         WHERE org_id = $1 AND team_id = $2 AND is_active = true
         ORDER BY created_at DESC
         LIMIT 1`,
        [orgId, teamId]
    );

    let briefing: string[] = [];
    const actions: TeamAction[] = [];

    if (interpRes.rows.length > 0) {
        const sections = interpRes.rows[0].sections_json as WeeklyInterpretationSections;

        // Phase 9: Prefer rich briefingParagraphs
        if (sections.briefingParagraphs && sections.briefingParagraphs.length > 0) {
            briefing = sections.briefingParagraphs;
        } else {
            // Legacy fallback
            if (sections.executiveSummary) {
                briefing.push(sections.executiveSummary);
            }
            if (sections.confidenceAndLimits) {
                briefing.push(sections.confidenceAndLimits);
            }
        }

        // Phase 9: Prefer rich driverCards to override DRIVER_CONTENT
        if (sections.driverCards && sections.driverCards.length > 0) {
            // Override driver details with LLM-generated content
            for (const card of sections.driverCards) {
                const existingDriver = drivers.find(d => d.id === card.driverFamily);
                if (existingDriver) {
                    existingDriver.details = {
                        mechanism: card.mechanism,
                        causality: card.causality,
                        effects: card.effects,
                        recommendation: card.recommendation,
                    } as any;
                }
            }
        }

        // Phase 9: Prefer rich actionCards
        if (sections.actionCards && sections.actionCards.length > 0) {
            sections.actionCards.slice(0, 3).forEach((card, i) => {
                actions.push({
                    id: `action-${i}`,
                    title: card.title,
                    severity: card.severity,
                    message: card.message,
                    details: {
                        context: card.context,
                        rationale: card.rationale,
                        effects: card.effects,
                        criticality: card.criticality,
                        recommendation: card.recommendation,
                    }
                });
            });
        } else if (sections.recommendedFocus && Array.isArray(sections.recommendedFocus)) {
            // Legacy fallback: Map recommendedFocus to actions
            sections.recommendedFocus.slice(0, 3).forEach((focus, i) => {
                actions.push({
                    id: `action-${i}`,
                    title: `Focus Area ${i + 1}`,
                    severity: 'info',
                    message: focus,
                    details: {
                        context: 'Derived from weekly analysis.',
                        rationale: 'Strategic focus area.',
                        effects: 'Expected to improve team health.',
                        criticality: 'LOW',
                        recommendation: focus
                    }
                });
            });
        }
    } else {
        // Fallback Briefing
        briefing = ['No interpretation generated for this week. Data collection may be insufficient.'];
    }

    // 6. Governance (Mock-ish or Real)
    const governance = {
        coverage: Math.round(((latestRow.quality as any)?.participationRate || 0) * 100),
        dataQuality: Math.round(((latestRow.quality as any)?.coherence || 0) * 100),
        temporalStability: 85, // Placeholder
        signalConfidence: 80, // Placeholder
        totalSessions: (latestRow.quality as any)?.sampleSize || 0,
        lastUpdated: format(new Date(latestRow.week_start), 'MMM d, yyyy')
    };

    // 7. Status Mapping
    const statusMap = {
        'critical': 'Critical',
        'at_risk': 'At Risk',
        'healthy': 'Healthy'
    };
    const rawStatus = (latestRow.team_state as any)?.status || 'healthy';
    const status = (statusMap[rawStatus as keyof typeof statusMap] || 'Healthy') as any;

    // Phase 9: Build Interpretation-Ready Data
    const latestIndices: any = {};
    const keyMap: Record<string, string> = {
        'withdrawal_risk': 'withdrawalRisk',
        'trust_gap': 'trustGap',
    };

    if (latestRow.indices) {
        for (const [dbKey, value] of Object.entries(latestRow.indices as Record<string, number>)) {
            const key = keyMap[dbKey] || dbKey;
            try {
                latestIndices[key] = {
                    value,
                    qualitative: getQualitativeStateForIndex(dbKey as any, value)
                };
            } catch (e) {
                // Fallback for unknown keys
                latestIndices[key] = { value, qualitative: 'moderate' };
            }
        }
    }

    const attributionList = (latestRow.attribution as AttributionResult[]) || [];
    const attribution = {
        primarySource: attributionList[0]?.primarySource || 'INTERNAL',
        internalDrivers: attributionList.flatMap(r => r.internal || []),
        externalDependencies: attributionList.flatMap(r => r.external || []),
        propagationRisk: attributionList.find(r => r.propagationRisk)?.propagationRisk || null
    };

    const quality = latestRow.quality || {};
    const teamState = latestRow.team_state as any || {};
    const trend = {
        regime: teamState.regime || 'NOISE',
        volatility: 0.1,
        weeksCovered: teamState.coverageWeeks || 0
    };

    return {
        id: teamId,
        name: teamName,
        meta: {
            latestWeek: format(new Date(latestRow.week_start), 'yyyy-MM-dd'),
            computeVersion: 'v1'
        },
        latestIndices,
        quality,
        trend,
        attribution,
        members: (latestRow.quality as any)?.sampleSize || 0, // Should be total members, but we only have sample size here?
        status: status,
        kpiSeeds: { // Dummy seeds to satisfy interface if needed, but we prefer series
            strainBase: 0, strainGrowth: 0,
            withdrawalBase: 0, withdrawalGrowth: 0,
            trustBase: 0, trustGrowth: 0,
            engagementBase: 0, engagementGrowth: 0,
        },
        series,
        drivers,
        actions,
        briefing,
        governance
    };
}
