/**
 * INTEGRITY DIAGNOSTICS API
 * 
 * Internal usage only. Returns audit stats.
 */

import { NextResponse } from 'next/server';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Basic auth check (replace with admin guard in real usage)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const stats = await query(`
            SELECT event_type, COUNT(*) as count, MAX(created_at) as last_seen
            FROM audit_events
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY event_type
        `);

        return NextResponse.json({
            ok: true,
            stats: stats.rows
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
