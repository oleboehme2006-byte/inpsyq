/**
 * POST /api/internal/admin/test-org/ensure
 * 
 * Creates/ensures Test Organization and Admin user.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureTestOrgAndAdmin } from '@/lib/admin/seedTestOrg';

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
        const email = body.email || 'oleboehme2006@gmail.com';

        const result = await ensureTestOrgAndAdmin(email);

        console.log(`[AUDIT] test-org/ensure called from ${req.headers.get('x-forwarded-for') || 'unknown'}`);

        return NextResponse.json({
            ok: true,
            orgId: result.orgId,
            userId: result.userId,
            teamIds: result.teamIds,
        });

    } catch (e: any) {
        console.error('[API] test-org/ensure failed:', e.message);
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}
