/**
 * EXECUTIVE READER — Executive Dashboard Data Service
 * 
 * Aggregates team-level data into an org-wide executive dashboard view.
 * Reads from org_aggregates_weekly, team data, and org-level interpretations.
 * Falls back to cross-team analysis when no org interpretation exists.
 */

import { query } from '@/db/client';
import { format } from 'date-fns';
import { WeeklyInterpretationSections, DriverDetailCard, ActionDetailCard } from '@/lib/interpretation/types';
import { DRIVER_CONTENT } from '@/lib/content/driverLibrary';
import { isValidDriverFamilyId } from '@/lib/semantics/driverRegistry';
import { identifySystemicDrivers, TeamAttribution, SystemicDriverCandidate } from '@/lib/interpretation/crossTeamAnalysis';
import { predictTeamRisks, RiskPrediction, SeriesPoint } from '@/lib/interpretation/riskPredictor';
import { TeamSeriesPoint } from '@/lib/mock/teamDashboardData';

// ============================================================================
// Types
// ============================================================================

export interface ExecutiveKPI {
    id: string;
    title: string;
    value: string;
    score: number;
    trend: string;
    trendValue: string;
    semanticColor: string;
    description: string;
}

export interface ExecutiveTeam {
    teamId: string;
    name: string;
    status: 'Critical' | 'At Risk' | 'Healthy';
    members: number;
    strain: number;
    withdrawal: number;
    trust: number;
    engagement: number;
    coverage: number;
}

export interface ExecutiveDriver {
    id: string;
    label: string;
    score: number;
    scope: string;
    trend: string;
    details: {
        mechanism: string;
        influence: string;
        recommendation: string;
    };
}

export interface ExecutiveWatchlistItem {
    id: string;
    team: string;
    value: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    details: {
        context: string;
        causality: string;
        effects: string;
        criticality: 'HIGH' | 'MID' | 'LOW';
        recommendation: string;
    };
}

export interface ExecutiveGovernance {
    coverage: number;
    dataQuality: number;
    totalSessions: number;
    lastUpdated: string;
}

export interface ExecutiveDashboardData {
    orgName: string;
    kpis: ExecutiveKPI[];
    teams: ExecutiveTeam[];
    drivers: ExecutiveDriver[];
    watchlist: ExecutiveWatchlistItem[];
    briefingParagraphs: string[];
    governance: ExecutiveGovernance;
    series: TeamSeriesPoint[];  // 12-week org-level aggregate series for chart rendering
}

// ============================================================================
// Main Reader
// ============================================================================

export async function getExecutiveDashboardData(
    orgId: string
): Promise<ExecutiveDashboardData | null> {

    // 1. Fetch Org Info
    const orgRes = await query(
        `SELECT name FROM organizations WHERE org_id = $1`,
        [orgId]
    );
    if (orgRes.rows.length === 0) return null;
    const orgName = orgRes.rows[0].name;

    // 2. Fetch all team aggregates for the latest week
    const teamsRes = await query(
        `SELECT t.team_id, t.name,
                a.week_start, a.indices, a.quality, a.attribution, a.team_state
         FROM teams t
         LEFT JOIN LATERAL (
             SELECT week_start, indices, quality, attribution, team_state
             FROM org_aggregates_weekly
             WHERE org_id = $1 AND team_id = t.team_id
             ORDER BY week_start DESC
             LIMIT 1
         ) a ON true
         WHERE t.org_id = $1
         ORDER BY t.name`,
        [orgId]
    );

    if (teamsRes.rows.length === 0) return null;

    // 3. Build Teams array
    const teams: ExecutiveTeam[] = [];
    const teamAttributions: TeamAttribution[] = [];
    const teamSeriesMap = new Map<string, SeriesPoint[]>();

    for (const row of teamsRes.rows) {
        const indices = row.indices || {};
        const quality = row.quality || {};
        const teamState = row.team_state || {};
        const attribution = row.attribution || {};

        const strain = Math.round((indices.strain || 0) * 100);
        const withdrawal = Math.round((indices.withdrawal_risk || 0) * 100);
        const trust = Math.round((indices.trust_gap || 0) * 100);
        const engagement = Math.round((indices.engagement || 0) * 100);

        const statusMap: Record<string, 'Critical' | 'At Risk' | 'Healthy'> = {
            'critical': 'Critical',
            'at_risk': 'At Risk',
            'healthy': 'Healthy',
        };
        const status = statusMap[teamState.status || 'healthy'] || 'Healthy';

        teams.push({
            teamId: row.team_id,
            name: row.name,
            status,
            members: quality.sampleSize || 0,
            strain,
            withdrawal,
            trust,
            engagement,
            coverage: Math.round((quality.participationRate || 0) * 100),
        });

        // Collect attribution for cross-team analysis
        if (attribution.internal && Array.isArray(attribution.internal)) {
            teamAttributions.push({
                teamId: row.team_id,
                teamName: row.name,
                internalDrivers: attribution.internal.map((d: any) => ({
                    driverFamily: d.driverFamily,
                    score: d.score || 0,
                    severityLevel: d.severityLevel || 'C0',
                })),
            });
        }
    }

    // 4. Compute org-level KPIs (averages across teams, trends from series)
    // series is built later; pass an empty array here and will re-compute after series is ready

    // 5. Fetch historical series for risk prediction
    for (const row of teamsRes.rows) {
        const seriesRes = await query(
            `SELECT indices FROM org_aggregates_weekly
             WHERE org_id = $1 AND team_id = $2
             ORDER BY week_start DESC LIMIT 6`,
            [orgId, row.team_id]
        );

        if (seriesRes.rows.length >= 3) {
            const points: SeriesPoint[] = seriesRes.rows.reverse().map((r: any) => ({
                strain: r.indices?.strain || 0,
                withdrawal: r.indices?.withdrawal_risk || 0,
                trust: r.indices?.trust_gap || 0,
                engagement: r.indices?.engagement || 0,
            }));
            teamSeriesMap.set(row.name, points);
        }
    }

    // 5b. Fetch org-level 12-week aggregated series for the main chart
    const orgSeriesRes = await query(
        `SELECT
            week_start,
            AVG((indices->>'strain')::float)            AS strain,
            AVG((indices->>'withdrawal_risk')::float)   AS withdrawal,
            AVG((indices->>'trust_gap')::float)         AS trust,
            AVG((indices->>'engagement')::float)        AS engagement,
            AVG((quality->>'participationRate')::float) AS participation_rate,
            SUM((quality->>'sampleSize')::int)          AS sample_size
         FROM org_aggregates_weekly
         WHERE org_id = $1
         GROUP BY week_start
         ORDER BY week_start DESC
         LIMIT 12`,
        [orgId]
    );

    // Build series ascending (oldest → newest) and scale to 0-100 for chart
    const orgSeriesRows = [...orgSeriesRes.rows].reverse();
    const series: TeamSeriesPoint[] = orgSeriesRows.map(r => {
        const confidence = (r.sample_size || 0) > 3 ? 5 : 15;
        const strain     = Math.round((r.strain      || 0) * 100);
        const withdrawal = Math.round((r.withdrawal  || 0) * 100);
        const trust      = Math.round((r.trust       || 0) * 100);
        const engagement = Math.round((r.engagement  || 0) * 100);
        return {
            date:             format(new Date(r.week_start), 'MMM d'),
            fullDate:         new Date(r.week_start).toISOString(),
            strain,
            withdrawal,
            trust,
            engagement,
            confidence,
            strainRange:     [strain     - confidence, strain     + confidence] as [number, number],
            withdrawalRange: [withdrawal - confidence, withdrawal + confidence] as [number, number],
            trustRange:      [trust      - confidence, trust      + confidence] as [number, number],
            engagementRange: [engagement - confidence, engagement + confidence] as [number, number],
        };
    });

    // 4 (deferred). Compute KPIs now that series is available for real trend deltas
    const kpis = buildOrgKPIs(teams, series);

    // 6. Cross-Team Analysis: Identify Systemic Drivers
    const systemicCandidates = identifySystemicDrivers(teamAttributions);

    // 7. Risk Predictions for watchlist
    const allRisks: RiskPrediction[] = [];
    for (const [teamName, riskSeries] of teamSeriesMap.entries()) {
        const risks = predictTeamRisks(teamName, riskSeries);
        allRisks.push(...risks);
    }
    // Sort by severity
    allRisks.sort((a, b) => {
        const sevOrder = { critical: 0, warning: 1, info: 2 };
        return sevOrder[a.severity] - sevOrder[b.severity];
    });

    // 8. Fetch org-level interpretation
    const interpRes = await query(
        `SELECT sections_json, created_at
         FROM weekly_interpretations
         WHERE org_id = $1 AND team_id IS NULL AND is_active = true
         ORDER BY created_at DESC LIMIT 1`,
        [orgId]
    );

    let drivers: ExecutiveDriver[] = [];
    let watchlist: ExecutiveWatchlistItem[] = [];
    let briefingParagraphs: string[] = [];

    if (interpRes.rows.length > 0) {
        const sections = interpRes.rows[0].sections_json as WeeklyInterpretationSections;

        // Use LLM-generated driver cards if available
        if (sections.driverCards && sections.driverCards.length > 0) {
            drivers = mapDriverCardsToExecutive(sections.driverCards, systemicCandidates);
        }

        // Use LLM-generated action cards as watchlist items
        if (sections.actionCards && sections.actionCards.length > 0) {
            watchlist = mapActionCardsToWatchlist(sections.actionCards);
        }

        // Use LLM-generated briefing paragraphs
        if (sections.briefingParagraphs && sections.briefingParagraphs.length > 0) {
            briefingParagraphs = sections.briefingParagraphs;
        }
    }

    // Fallback: build from deterministic analysis if no LLM content
    if (drivers.length === 0) {
        drivers = buildDriversFromSystemicCandidates(systemicCandidates);
    }

    if (watchlist.length === 0) {
        watchlist = buildWatchlistFromRisks(allRisks);
    }

    if (briefingParagraphs.length === 0) {
        briefingParagraphs = buildDeterministicBriefing(teams, kpis, systemicCandidates);
    }

    // 9. Governance
    const latestWeek = teamsRes.rows[0]?.week_start;
    const totalSessions = teams.reduce((acc, t) => acc + t.members, 0);
    const avgCoverage = teams.length > 0
        ? Math.round(teams.reduce((a, t) => a + t.coverage, 0) / teams.length)
        : 0;

    const governance: ExecutiveGovernance = {
        coverage: avgCoverage,
        dataQuality: Math.round(avgCoverage * 0.9), // Proxy
        totalSessions,
        lastUpdated: latestWeek ? format(new Date(latestWeek), 'MMM d, yyyy') : 'Unknown',
    };

    return {
        orgName,
        kpis,
        teams,
        drivers: drivers.slice(0, 3),
        watchlist: watchlist.slice(0, 3),
        briefingParagraphs,
        governance,
        series,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildOrgKPIs(teams: ExecutiveTeam[], series: TeamSeriesPoint[]): ExecutiveKPI[] {
    if (teams.length === 0) return [];

    const avg = (key: keyof Pick<ExecutiveTeam, 'strain' | 'withdrawal' | 'trust' | 'engagement'>) =>
        Math.round(teams.reduce((a, t) => a + t[key], 0) / teams.length);

    const strain     = avg('strain');
    const withdrawal = avg('withdrawal');
    const trust      = avg('trust');
    const engagement = avg('engagement');

    // Compute week-over-week deltas from real series (last two points)
    const formatDelta = (delta: number) => delta >= 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;
    const trendDir    = (delta: number) => delta > 1 ? 'up' : delta < -1 ? 'down' : 'stable';

    let strainDelta = 0, withdrawalDelta = 0, trustDelta = 0, engagementDelta = 0;
    if (series.length >= 2) {
        const prev = series[series.length - 2];
        const last = series[series.length - 1];
        strainDelta     = last.strain     - prev.strain;
        withdrawalDelta = last.withdrawal - prev.withdrawal;
        trustDelta      = last.trust      - prev.trust;
        engagementDelta = last.engagement - prev.engagement;
    }

    return [
        {
            id: 'kpi-1',
            title: 'Strain Index',
            value: String(strain),
            score: strain,
            trend: trendDir(strainDelta),
            trendValue: formatDelta(strainDelta),
            semanticColor: 'strain',
            description: 'Workload & Pressure',
        },
        {
            id: 'kpi-2',
            title: 'Withdrawal Risk',
            value: String(withdrawal),
            score: withdrawal,
            trend: trendDir(withdrawalDelta),
            trendValue: formatDelta(withdrawalDelta),
            semanticColor: 'withdrawal',
            description: 'Disengagement Signs',
        },
        {
            id: 'kpi-3',
            title: 'Trust Gap',
            value: String(trust),
            score: trust,
            trend: trendDir(trustDelta),
            trendValue: formatDelta(trustDelta),
            semanticColor: 'trust-gap',
            description: 'Leadership Alignment',
        },
        {
            id: 'kpi-4',
            title: 'Engagement',
            value: String(engagement),
            score: engagement,
            trend: trendDir(engagementDelta),
            trendValue: formatDelta(engagementDelta),
            semanticColor: 'engagement',
            description: 'Active Participation',
        },
    ];
}

function mapDriverCardsToExecutive(
    cards: DriverDetailCard[],
    systemicCandidates: SystemicDriverCandidate[]
): ExecutiveDriver[] {
    return cards.slice(0, 3).map((card, i) => {
        // Find matching systemic candidate for scope/trend
        const candidate = systemicCandidates.find(c => c.driverFamily === card.driverFamily);

        return {
            id: `d${i + 1}`,
            label: card.label,
            score: candidate ? Math.round(candidate.averageScore * 100) : 50,
            scope: candidate?.scope || 'Organization',
            trend: candidate?.trend || 'stable',
            details: {
                mechanism: card.mechanism,
                influence: card.causality || card.effects, // Map causality to influence for executive view
                recommendation: card.recommendation,
            },
        };
    });
}

function mapActionCardsToWatchlist(
    cards: ActionDetailCard[]
): ExecutiveWatchlistItem[] {
    return cards.slice(0, 3).map((card, i) => ({
        id: `w${i + 1}`,
        team: card.title.replace('Address ', ''), // Best effort team name extraction
        value: '',
        severity: card.severity,
        message: card.message,
        details: {
            context: card.context,
            causality: card.rationale,
            effects: card.effects,
            criticality: card.criticality,
            recommendation: card.recommendation,
        },
    }));
}

function buildDriversFromSystemicCandidates(
    candidates: SystemicDriverCandidate[]
): ExecutiveDriver[] {
    return candidates.slice(0, 3).map((c, i) => {
        const content = isValidDriverFamilyId(c.driverFamily)
            ? DRIVER_CONTENT[c.driverFamily]
            : null;

        return {
            id: `d${i + 1}`,
            label: c.label,
            score: Math.round(c.averageScore * 100),
            scope: c.scope,
            trend: c.trend,
            details: {
                mechanism: content?.mechanism || `${c.label} has been identified as a systemic pattern affecting ${c.affectedTeams.length} teams.`,
                influence: content?.effects || `Affects ${c.affectedTeams.join(', ')} with ${c.averageSeverity} average severity.`,
                recommendation: content?.recommendation || `Cross-functional intervention targeting ${c.label.toLowerCase()} across affected units.`,
            },
        };
    });
}

function buildWatchlistFromRisks(
    risks: RiskPrediction[]
): ExecutiveWatchlistItem[] {
    return risks.slice(0, 3).map((r, i) => ({
        id: `w${i + 1}`,
        team: r.teamName,
        value: r.trendValue,
        severity: r.severity,
        message: r.triggerCondition,
        details: {
            context: `${r.teamName} is showing elevated ${r.riskType.replace('_', ' ')} signals based on ${r.timeHorizon} trend analysis.`,
            causality: `Triggered by sustained pattern: ${r.triggerCondition}.`,
            effects: `If unaddressed, probability of ${r.riskType.replace('_', ' ')} is estimated at ${Math.round(r.probability * 100)}% within ${r.timeHorizon}.`,
            criticality: r.severity === 'critical' ? 'HIGH' : r.severity === 'warning' ? 'MID' : 'LOW',
            recommendation: `Immediate review of ${r.teamName}'s workload and engagement signals recommended. Intervention window: ${r.timeHorizon}.`,
        },
    }));
}

function buildDeterministicBriefing(
    teams: ExecutiveTeam[],
    kpis: ExecutiveKPI[],
    systemicDrivers: SystemicDriverCandidate[]
): string[] {
    const strainKpi = kpis.find(k => k.id === 'kpi-1');
    const engagementKpi = kpis.find(k => k.id === 'kpi-4');

    const criticalTeams = teams.filter(t => t.status === 'Critical');
    const atRiskTeams = teams.filter(t => t.status === 'At Risk');
    const healthyTeams = teams.filter(t => t.status === 'Healthy');

    const criticalNames = criticalTeams.map(t => `<span class="text-white">${t.name}</span>`);
    const healthyNames = healthyTeams.map(t => `<span class="text-white">${t.name}</span>`);

    // Paragraph 1: Headline situation
    const para1 = `Organization-wide strain is at <span class="text-strain">${strainKpi?.value || '—'}%</span> with engagement at <span class="text-engagement">${engagementKpi?.value || '—'}%</span>. ${criticalTeams.length > 0 ? `${criticalNames.join(' and ')} ${criticalTeams.length === 1 ? 'is' : 'are'} flagged as critical, requiring immediate attention.` : 'No teams are currently in critical status.'} ${atRiskTeams.length > 0 ? `${atRiskTeams.length} team${atRiskTeams.length > 1 ? 's' : ''} ${atRiskTeams.length === 1 ? 'is' : 'are'} at risk.` : ''} ${healthyTeams.length > 0 ? `${healthyNames.join(', ')} ${healthyTeams.length === 1 ? 'remains' : 'remain'} within healthy parameters.` : ''}`;

    // Paragraph 2: Systemic context
    const driverText = systemicDrivers.length > 0
        ? `The primary systemic driver is <span class="text-white">${systemicDrivers[0].label}</span>, affecting ${systemicDrivers[0].affectedTeams.length} teams at the ${systemicDrivers[0].scope.toLowerCase()} level.`
        : 'No dominant systemic driver has been identified across teams.';

    const para2 = `${driverText} ${systemicDrivers.length > 1 ? `Secondary patterns include ${systemicDrivers.slice(1).map(d => `<span class="text-white">${d.label}</span>`).join(' and ')}.` : ''} The isolation of stressors to specific teams suggests surgical interventions are viable without risking broader cultural contagion.`;

    // Paragraph 3: Causal analysis (simplified deterministic)
    const avgCoverage = teams.length > 0 ? Math.round(teams.reduce((a, t) => a + t.coverage, 0) / teams.length) : 0;
    const para3 = `Data coverage across the organization stands at ${avgCoverage}%, providing ${avgCoverage >= 80 ? 'high' : avgCoverage >= 60 ? 'adequate' : 'limited'}-confidence interpretation. Historical patterns indicate that teams operating at elevated strain for extended periods face increased probability of attrition. The current observation window supports reliable trend detection across ${teams.length} monitored units.`;

    // Paragraph 4: Recommendation
    const para4 = `<span class="text-white font-medium">Recommendation:</span> ${criticalTeams.length > 0 ? `Immediate executive intervention is advised for ${criticalNames.join(' and ')} to rebalance resource allocation.` : 'Continue current monitoring cadence.'} ${systemicDrivers.length > 0 ? `Addressing ${systemicDrivers[0].label.toLowerCase()} at the organizational level could yield cross-team improvements.` : ''} Focus must shift from velocity to stability for any teams showing sustained elevated strain.`;

    return [para1, para2, para3, para4];
}
