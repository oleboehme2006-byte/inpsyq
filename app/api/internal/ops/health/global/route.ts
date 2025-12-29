
import { NextRequest, NextResponse } from 'next/server';
import { getGlobalHealthSnapshot } from '@/services/ops/healthSnapshot';

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
    const weekOffset = parseInt(url.searchParams.get('week_offset') || '0', 10);

    try {
        const snapshot = await getGlobalHealthSnapshot(weekOffset);
        return NextResponse.json({ ok: true, snapshot });
    } catch (e: any) {
        console.error('[Internal/Ops] Global health check failed:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
