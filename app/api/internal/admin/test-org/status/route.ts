/**
 * GET /api/internal/admin/test-org/status
 * 
 * Returns status of Test Organization data.
 * Requires INTERNAL_ADMIN_SECRET.
 * 
 * Response contract:
 * - Success: { ok: true, data: { exists, orgId, teamCount, employeeCount, weekCount, sessionCount, interpretationCount } }
 * - Error: { ok: false, error: { code, message } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTestOrgStatus } from '@/lib/admin/seedTestOrg';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing authorization' } },
            { status: 401 }
        );
    }

    try {
        const status = await getTestOrgStatus();

        return NextResponse.json({
            ok: true,
            data: status,
        });

    } catch (e: any) {
        console.error('[API] test-org/status failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'STATUS_FAILED', message: e.message } },
            { status: 500 }
        );
    }
}

