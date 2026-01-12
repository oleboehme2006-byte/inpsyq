/**
 * POST /api/internal/admin/test-org/seed
 * 
 * Seeds fake measurement data for Test Organization.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { seedTestOrgData, getTestOrgStatus } from '@/lib/admin/seedTestOrg';

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
        const body = await req.json().catch(() => ({}));
        const weeks = body.weeks || 6;
        const seed = body.seed || 42;

        // Get org ID
        const status = await getTestOrgStatus();
        if (!status.exists || !status.orgId) {
            return NextResponse.json(
                { ok: false, error: 'Test org does not exist. Call /ensure first.' },
                { status: 400 }
            );
        }

        const result = await seedTestOrgData(status.orgId, weeks, seed);

        console.log(`[AUDIT] test-org/seed called from ${req.headers.get('x-forwarded-for') || 'unknown'}`);

        return NextResponse.json({
            ok: true,
            ...result,
        });

    } catch (e: any) {
        console.error('[API] test-org/seed failed:', e.message);
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
