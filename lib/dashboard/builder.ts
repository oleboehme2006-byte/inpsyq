/**
 * Dashboard DTO Builder
 * Assembles TeamDashboardDTO from existing decision service data.
 */

import { query } from '@/db/client';
import { decisionService } from '@/services/decision/decisionService';
import { DecisionSnapshot, AnalysedDriver } from '@/services/decision/types';
import {
    TeamDashboardDTO,
    DashboardMeta,
    StateBlock,
    TrendBlock,
    SemanticIndices,
    DriverAttribution,
    RiskAssessment,
    MeasurementDiagnostics,
    AuditBlock,
    createEmptyTeamDashboardDTO,
    scoreBandFromSeverity,
    governanceStatusFromRisk
} from './types';
import { generateRequestId } from '@/lib/api/validation';

export interface BuildDashboardParams {
    orgId: string;
    teamId: string;
    weekStart?: string;
    requestId?: string;
}

export async function buildTeamDashboardDTO(params: BuildDashboardParams): Promise<TeamDashboardDTO> {
    const requestId = params.requestId || generateRequestId();
    const startTime = Date.now();

    try {
        // Parallel queries for performance
        const weekStart = params.weekStart || new Date().toISOString().slice(0, 10);

        const [snapshotResult, auditResult] = await Promise.all([
            decisionService.analyzeTeam(params.orgId, params.teamId, weekStart).catch(() => null),
            getAuditData(params.orgId, params.teamId),
        ]);

        if (!snapshotResult) {
            return createEmptyTeamDashboardDTO(requestId);
        }

        // Build state block
        const state: StateBlock = {
            label: snapshotResult.state.label,
            score_band: scoreBandFromSeverity(snapshotResult.state.severity),
            severity: snapshotResult.state.severity,
            explanation: snapshotResult.state.explanation,
            governance_status: 'clear',
            confidence: 0.7,
        };

        // Build trend block
        const trend: TrendBlock = {
            direction: snapshotResult.trend.direction,
            velocity: snapshotResult.trend.velocity,
            volatility: 1 - snapshotResult.trend.consistency,
            regime: snapshotResult.trend.consistency > 0.7 ? 'stable' : snapshotResult.trend.consistency > 0.4 ? 'shift' : 'noise',
            explanation: snapshotResult.trend.explanation,
        };

        // Build semantic indices
        const indices: SemanticIndices = {
            strain_index: snapshotResult.state.severity,
            withdrawal_risk: snapshotResult.state.severity * 0.8,
            trust_gap: snapshotResult.state.severity * 0.6,
        };

        // Transform drivers with proper typing
        const topRisks: DriverAttribution[] = snapshotResult.drivers.top_risks.map((d: AnalysedDriver) => ({
            construct: d.parameter,
            label: d.label,
            impact: d.impact,
            direction: d.direction === 'NEGATIVE' ? 'negative' as const : 'positive' as const,
            scope: d.influence_scope,
            causal_label: d.impact > 0.6 ? 'likely_causal' as const : 'correlational' as const,
            evidence_refs: [],
            uncertainty: 0.3,
            is_actionable: d.is_actionable,
            explanation: d.explanation,
        }));

        const topStrengths: DriverAttribution[] = snapshotResult.drivers.top_strengths.map((d: AnalysedDriver) => ({
            construct: d.parameter,
            label: d.label,
            impact: d.impact,
            direction: d.direction === 'POSITIVE' ? 'positive' as const : 'negative' as const,
            scope: d.influence_scope,
            causal_label: d.impact > 0.6 ? 'likely_causal' as const : 'correlational' as const,
            evidence_refs: [],
            uncertainty: 0.3,
            is_actionable: d.is_actionable,
            explanation: d.explanation,
        }));

        // Build risk assessment
        const risk: RiskAssessment = {
            epistemic: auditResult.missingness,
            ethical: 0.1,
            organizational: snapshotResult.state.severity * 0.5,
        };

        // Update governance status based on risk
        state.governance_status = governanceStatusFromRisk(risk);

        // Build measurement diagnostics
        const measurement: MeasurementDiagnostics = {
            construct_coverage: {},
            epistemic_states: {},
            last_measured_at: new Date().toISOString(),
        };

        // Build meta
        const meta: DashboardMeta = {
            request_id: requestId,
            generated_at: new Date().toISOString(),
            range_weeks: snapshotResult.meta.coverage_weeks,
            cache_hit: false,
            governance_blocked: state.governance_status === 'blocked',
            duration_ms: Date.now() - startTime,
        };

        return {
            meta,
            state,
            trend,
            indices,
            drivers: {
                top_risks: topRisks,
                top_strengths: topStrengths,
            },
            action: {
                recommended: {
                    action_id: snapshotResult.recommendation.primary.type,
                    title: snapshotResult.recommendation.primary.title,
                    description: snapshotResult.recommendation.primary.description,
                    rationale: snapshotResult.recommendation.primary.rationale,
                    urgency: snapshotResult.recommendation.primary.urgency,
                    expected_effect: 'Improvement in key drivers',
                    monitor_constructs: topRisks.slice(0, 3).map(d => d.construct),
                },
                alternatives: snapshotResult.recommendation.secondary.map((a) => ({
                    action_id: a.type,
                    title: a.title,
                    description: a.description,
                    rationale: a.rationale,
                    urgency: a.urgency,
                    expected_effect: 'Improvement in related areas',
                    monitor_constructs: [],
                })),
            },
            risk,
            measurement,
            audit: auditResult,
        };

    } catch (error) {
        console.error('[DashboardBuilder] Failed to build DTO:', error);
        const dto = createEmptyTeamDashboardDTO(requestId);
        dto.meta.duration_ms = Date.now() - startTime;
        return dto;
    }
}

async function getAuditData(orgId: string, teamId: string): Promise<AuditBlock> {
    try {
        // Count sessions for the team
        const sessionsRes = await query(`
            SELECT COUNT(*) as count FROM sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE u.org_id = $1 AND u.team_id = $2
        `, [orgId, teamId]);

        // Count users
        const usersRes = await query(`
            SELECT COUNT(*) as count FROM users
            WHERE org_id = $1 AND team_id = $2
        `, [orgId, teamId]);

        const sessionsCount = parseInt(sessionsRes.rows[0]?.count || '0');
        const usersCount = parseInt(usersRes.rows[0]?.count || '1');

        return {
            sessions_count: sessionsCount,
            participation_rate: Math.min(1, sessionsCount / (usersCount * 4)),
            missingness: 1 - Math.min(1, sessionsCount / (usersCount * 4)),
        };
    } catch (error) {
        console.error('[AuditData] Query failed:', error);
        return {
            sessions_count: 0,
            participation_rate: 0,
            missingness: 1,
        };
    }
}
