
import { NextRequest, NextResponse } from 'next/server';
import { getOrgHealthSnapshot } from '@/services/ops/healthSnapshot';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Security Check
    const authHeader = req.headers.get('x-internal-admin-secret');
    const secret = process.env.INTERNAL_ADMIN_SECRET;

    if (!secret || authHeader !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Params
    const url = new URL(req.url);
    const orgId = url.searchParams.get('org_id');
    const weekOffset = parseInt(url.searchParams.get('week_offset') || '0', 10);

    if (!orgId) {
        return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });
    }

    try {
        const snapshot = await getOrgHealthSnapshot(orgId, weekOffset);
        return NextResponse.json({ ok: true, snapshot });
    } catch (e: any) {
        console.error('[Internal/Ops] Health check failed:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
