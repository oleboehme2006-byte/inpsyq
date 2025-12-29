
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Security Check
    const authHeader = req.headers.get('x-internal-admin-secret');
    const secret = process.env.INTERNAL_ADMIN_SECRET;

    if (!secret || authHeader !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const orgId = url.searchParams.get('org_id');

    try {
        let result;
        if (orgId) {
            result = await query(`
                SELECT * FROM audit_events 
                WHERE org_id = $1 
                  AND (event_type LIKE '%FAIL%' OR event_type LIKE '%ERROR%')
                ORDER BY created_at DESC 
                LIMIT $2
            `, [orgId, limit]);
        } else {
            result = await query(`
                SELECT * FROM audit_events 
                WHERE event_type LIKE '%FAIL%' OR event_type LIKE '%ERROR%'
                ORDER BY created_at DESC 
                LIMIT $1
            `, [limit]);
        }

        return NextResponse.json({ ok: true, incidents: result.rows });
    } catch (e: any) {
        console.error('[Internal/Ops] Incidents check failed:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
