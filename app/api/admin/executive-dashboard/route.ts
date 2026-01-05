import { NextRequest, NextResponse } from 'next/server';
import { isValidUUID, generateRequestId, createValidationError } from '@/lib/api/validation';
import { requestLogger } from '@/lib/api/requestLogger';
import { buildTeamDashboardDTO } from '@/lib/dashboard/builder';
import { query } from '@/db/client';
import {
    ExecutiveDashboardDTO,
    TeamSummary,
    SystemicDriverCluster,
    DashboardMeta,
    StateBlock,
    TrendBlock,
    SemanticIndices,
    AuditBlock,
    scoreBandFromSeverity
} from '@/lib/dashboard/types';
import { requireAdminStrict } from '@/lib/access/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/executive-dashboard?org_id=xxx
 * Returns ExecutiveDashboardDTO for portfolio-level executive view.
 * ADMIN only.
 */
export async function GET(req: NextRequest) {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        // ADMIN only
        const guardResult = await requireAdminStrict(req);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        const orgId = req.nextUrl.searchParams.get('org_id') || guardResult.value.orgId;

        // Validate UUID
        if (!isValidUUID(orgId)) {
            return NextResponse.json(
                createValidationError('org_id', 'org_id must be a valid UUID', requestId),
                { status: 400 }
            );
        }

        // Get all teams for this org
        const teamsRes = await query(`SELECT team_id, name FROM teams WHERE org_id = $1`, [orgId]);
        const teams = teamsRes.rows;

        if (teams.length === 0) {
            return NextResponse.json({
                error: 'No teams found',
                code: 'NO_TEAMS',
                request_id: requestId,
            }, { status: 404 });
        }

        // Build DTOs for each team in parallel
        const teamDTOs = await Promise.all(
            teams.map(t => buildTeamDashboardDTO({
                orgId,
                teamId: t.team_id,
                requestId,
            }))
        );

        // Build team summaries
        const teamSummaries: TeamSummary[] = teams.map((t, i) => ({
            team_id: t.team_id,
            team_name: t.name || `Team ${i + 1}`,
            state_label: teamDTOs[i].state.label,
            score_band: teamDTOs[i].state.score_band,
            severity: teamDTOs[i].state.severity,
            trend_direction: teamDTOs[i].trend.direction,
            velocity: teamDTOs[i].trend.velocity,
            governance_status: teamDTOs[i].state.governance_status,
        }));

        // Calculate rankings (higher severity × worse velocity = higher rank number = worse)
        const rankings = teamSummaries
            .map((t, i) => ({
                team_id: t.team_id,
                composite_score: t.severity * (t.trend_direction === 'DETERIORATING' ? 1.5 : t.trend_direction === 'STABLE' ? 1.0 : 0.7),
            }))
            .sort((a, b) => b.composite_score - a.composite_score)
            .map((r, i) => ({ ...r, rank: i + 1 }));

        // Aggregate org-level state
        const avgSeverity = teamSummaries.reduce((sum, t) => sum + t.severity, 0) / teamSummaries.length;
        const orgState: StateBlock = {
            label: avgSeverity > 0.6 ? 'CRITICAL' : avgSeverity > 0.4 ? 'AT_RISK' : 'HEALTHY',
            score_band: scoreBandFromSeverity(avgSeverity),
            severity: avgSeverity,
            explanation: `Organization-level aggregate across ${teamSummaries.length} teams`,
            governance_status: 'clear',
            confidence: 0.6,
        };

        // Aggregate trend
        const directions = teamSummaries.map(t => t.trend_direction);
        const deteriorating = directions.filter(d => d === 'DETERIORATING').length;
        const orgTrend: TrendBlock = {
            direction: deteriorating > teamSummaries.length / 2 ? 'DETERIORATING' : 'STABLE',
            velocity: teamSummaries.reduce((sum, t) => sum + Math.abs(t.velocity), 0) / teamSummaries.length,
            volatility: 0.5,
            regime: 'stable',
        };

        // Aggregate indices
        const orgIndices: SemanticIndices = {
            strain_index: teamDTOs.reduce((sum, d) => sum + d.indices.strain_index, 0) / teamDTOs.length,
            withdrawal_risk: teamDTOs.reduce((sum, d) => sum + d.indices.withdrawal_risk, 0) / teamDTOs.length,
            trust_gap: teamDTOs.reduce((sum, d) => sum + d.indices.trust_gap, 0) / teamDTOs.length,
        };

        // Risk distribution
        const riskDistribution = {
            critical: teamSummaries.filter(t => t.state_label === 'CRITICAL').length,
            at_risk: teamSummaries.filter(t => t.state_label === 'AT_RISK').length,
            healthy: teamSummaries.filter(t => t.state_label === 'HEALTHY').length,
        };

        // Find systemic drivers (appear across multiple teams)
        const driverCounts: Record<string, { count: number; teams: string[]; impact: number }> = {};
        teamDTOs.forEach((dto, i) => {
            dto.drivers.top_risks.forEach(d => {
                if (!driverCounts[d.construct]) {
                    driverCounts[d.construct] = { count: 0, teams: [], impact: 0 };
                }
                driverCounts[d.construct].count++;
                driverCounts[d.construct].teams.push(teams[i].team_id);
                driverCounts[d.construct].impact += d.impact;
            });
        });

        const systemicDrivers: SystemicDriverCluster[] = Object.entries(driverCounts)
            .filter(([_, v]) => v.count > 1)
            .map(([construct, v]) => ({
                construct,
                label: construct.replace(/_/g, ' '),
                affected_teams: v.teams,
                aggregate_impact: v.impact / v.count,
                scope: (v.count > teamSummaries.length / 2 ? 'organization' : 'department') as 'organization' | 'department' | 'localized',
            }))
            .sort((a, b) => b.aggregate_impact - a.aggregate_impact)
            .slice(0, 5);

        // Aggregate audit
        const orgAudit: AuditBlock = {
            sessions_count: teamDTOs.reduce((sum, d) => sum + d.audit.sessions_count, 0),
            participation_rate: teamDTOs.reduce((sum, d) => sum + d.audit.participation_rate, 0) / teamDTOs.length,
            missingness: teamDTOs.reduce((sum, d) => sum + d.audit.missingness, 0) / teamDTOs.length,
        };

        // Build meta
        const meta: DashboardMeta = {
            request_id: requestId,
            generated_at: new Date().toISOString(),
            range_weeks: Math.max(...teamDTOs.map(d => d.meta.range_weeks)),
            cache_hit: false,
            governance_blocked: teamSummaries.some(t => t.governance_status === 'blocked'),
            duration_ms: Date.now() - startTime,
        };

        const dto: ExecutiveDashboardDTO = {
            meta,
            org_id: orgId,
            teams: teamSummaries,
            team_ranking: rankings,
            org_state: orgState,
            org_trend: orgTrend,
            org_indices: orgIndices,
            risk_distribution: riskDistribution,
            systemic_drivers: systemicDrivers,
            interventions: [], // TODO: aggregate from team recommendations
            governance_summary: {
                blocked_teams: teamSummaries.filter(t => t.governance_status === 'blocked').map(t => t.team_id),
                review_needed_teams: teamSummaries.filter(t => t.governance_status === 'review_needed').map(t => t.team_id),
                coverage_rate: 1 - orgAudit.missingness,
            },
            audit: orgAudit,
        };

        // Log request
        requestLogger.log({
            request_id: requestId,
            route: '/api/admin/executive-dashboard',
            method: 'GET',
            duration_ms: Date.now() - startTime,
            status: 200,
            item_count: teamSummaries.length,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json(dto);

    } catch (error: any) {
        console.error('[API] /admin/executive-dashboard Failed:', error.message);

        return NextResponse.json({
            error: 'Internal Server Error',
            code: 'INTERNAL_ERROR',
            request_id: requestId,
        }, { status: 500 });
    }
}
