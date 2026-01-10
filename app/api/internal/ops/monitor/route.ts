/**
 * POST /api/internal/ops/monitor
 * 
 * Run monitoring checks and deliver alerts (if enabled).
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMonitoringChecks } from '@/services/ops/monitoring';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const result = await runMonitoringChecks({});

        return NextResponse.json({
            ok: true,
            result,
        });
    } catch (e: any) {
        console.error('[Ops] Monitoring failed:', e.message);
        return NextResponse.json(
            { ok: false, error: 'Monitoring check failed' },
            { status: 500 }
        );
    }
}
