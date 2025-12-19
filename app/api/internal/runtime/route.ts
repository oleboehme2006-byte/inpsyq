import { NextResponse } from 'next/server';
import { getRuntimeInfo } from '@/lib/runtime/sessionConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/runtime
 * Returns effective runtime configuration for debugging.
 * NO SECRETS exposed.
 */
export async function GET() {
    try {
        const info = getRuntimeInfo();

        return NextResponse.json({
            ok: true,
            runtime: info,
            timestamp: new Date().toISOString(),
        });
    } catch (e: any) {
        return NextResponse.json({
            ok: false,
            error: e.message,
        }, { status: 500 });
    }
}
