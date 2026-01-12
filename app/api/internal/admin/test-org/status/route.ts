/**
 * GET /api/internal/admin/test-org/status
 * 
 * Returns status of Test Organization data.
 * Requires INTERNAL_ADMIN_SECRET.
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
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const status = await getTestOrgStatus();

        return NextResponse.json({
            ok: true,
            ...status,
        });

    } catch (e: any) {
        console.error('[API] test-org/status failed:', e.message);
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
