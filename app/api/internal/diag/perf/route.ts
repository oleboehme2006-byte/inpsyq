/**
 * PERFORMANCE DIAGNOSTICS API
 * 
 * INTERNAL USE ONLY. Returns in-memory timing stats.
 */

import { NextResponse } from 'next/server';
import { getMetrics, resetMetrics } from '@/lib/diagnostics/timing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Basic auth check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow dev mode bypass if no secret set, but in prod verify this.
        // For consistent behavior we strictly require it or a specific dev header?
        // Let's stick to the pattern used in other internal routes.
        if (process.env.NODE_ENV !== 'development' || !process.env.CRON_SECRET) {
            // In dev without secret, maybe allow? Safer to require secret if env var exists.
            // If CRON_SECRET is set, use it.
            if (process.env.CRON_SECRET) {
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }
    }

    const metrics = getMetrics();
    return NextResponse.json({
        ok: true,
        metrics,
        timestamp: new Date().toISOString()
    });
}

export async function DELETE(req: Request) {
    resetMetrics();
    return NextResponse.json({ ok: true, message: 'Metrics reset' });
}
