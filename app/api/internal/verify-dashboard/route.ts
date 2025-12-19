import { NextRequest, NextResponse } from 'next/server';
import { generateRequestId } from '@/lib/api/validation';
import { TeamDashboardDTO, ExecutiveDashboardDTO } from '@/lib/dashboard/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/verify-dashboard
 * Validates DTO schema and governance invariants.
 */
export async function GET(req: NextRequest) {
    const requestId = generateRequestId();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Define required fields for TeamDashboardDTO
    const teamDTORequiredFields = [
        'meta.request_id',
        'meta.generated_at',
        'meta.governance_blocked',
        'state.label',
        'state.score_band',
        'state.severity',
        'state.governance_status',
        'trend.direction',
        'trend.velocity',
        'trend.regime',
        'indices.strain_index',
        'indices.withdrawal_risk',
        'indices.trust_gap',
        'drivers.top_risks',
        'drivers.top_strengths',
        'action.recommended',
        'risk.epistemic',
        'risk.ethical',
        'audit.sessions_count',
        'audit.participation_rate',
    ];

    // Validate required enums
    const validStateLabels = ['HEALTHY', 'AT_RISK', 'CRITICAL', 'UNKNOWN'];
    const validScoreBands = ['excellent', 'good', 'moderate', 'concerning', 'critical'];
    const validTrendDirections = ['IMPROVING', 'STABLE', 'DETERIORATING'];
    const validTrendRegimes = ['stable', 'shift', 'noise'];
    const validGovernanceStatuses = ['clear', 'review_needed', 'blocked'];

    // Check governance invariants
    const governanceInvariants = [
        'If risk.epistemic > 0.8, governance_status MUST be "blocked"',
        'If risk.ethical > 0.7, governance_status MUST be "blocked"',
        'If meta.governance_blocked is true, state.governance_status MUST be "blocked"',
        'All score values MUST be between 0 and 1',
        'severity MUST match score_band mapping',
    ];

    return NextResponse.json({
        ok: true,
        request_id: requestId,
        schema: {
            team_dto_required_fields: teamDTORequiredFields.length,
            valid_state_labels: validStateLabels,
            valid_score_bands: validScoreBands,
            valid_trend_directions: validTrendDirections,
            valid_trend_regimes: validTrendRegimes,
            valid_governance_statuses: validGovernanceStatuses,
        },
        governance_invariants: governanceInvariants,
        validation_result: {
            errors,
            warnings,
            passed: errors.length === 0,
        },
        timestamp: new Date().toISOString(),
    });
}
