import { NextRequest, NextResponse } from 'next/server';
import { generateRequestId } from '@/lib/api/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DashboardDiagnostics {
    request_id: string;
    timestamp: string;
    dto_schema: {
        required_fields: string[];
        optional_fields: string[];
    };
    invariants: string[];
}

/**
 * GET /api/internal/diag/dashboard
 * Dashboard diagnostics and observability endpoint
 */
export async function GET(req: NextRequest) {
    const requestId = generateRequestId();

    const diagnostics: DashboardDiagnostics = {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        dto_schema: {
            required_fields: [
                'meta.request_id',
                'meta.generated_at',
                'meta.governance_blocked',
                'state.label',
                'state.score_band',
                'state.severity',
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
            ],
            optional_fields: [
                'indices.engagement_index',
                'indices.psychological_safety',
                'narrative.summary',
                'measurement.entropy',
                'measurement.saturation',
            ],
        },
        invariants: [
            'All numeric values must be 0-1 normalized',
            'Uncertainty must be visually encoded (not just numeric)',
            'No questions or items displayed',
            'No recommendations text displayed',
            'Motion respects prefers-reduced-motion',
            'Governance blocked = frosted overlay',
        ],
    };

    return NextResponse.json(diagnostics);
}
