import { NextRequest, NextResponse } from 'next/server';
import { requestLogger } from '@/lib/api/requestLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/diag/session?request_id=xxx
 * Retrieves diagnostic entry from in-memory ring buffer.
 */
export async function GET(req: NextRequest) {
    const requestId = req.nextUrl.searchParams.get('request_id');

    if (requestId) {
        const entry = requestLogger.getByRequestId(requestId);
        if (entry) {
            return NextResponse.json({ ok: true, entry });
        } else {
            return NextResponse.json({ ok: false, error: 'Not found', request_id: requestId }, { status: 404 });
        }
    }

    // Return recent entries if no request_id specified
    const recent = requestLogger.getRecent(20);
    return NextResponse.json({
        ok: true,
        count: recent.length,
        entries: recent,
    });
}
