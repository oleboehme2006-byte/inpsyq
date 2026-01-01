import { NextResponse } from 'next/server';
import { getRuntimeInfo } from '@/lib/runtime/sessionConfig';
import { validateEnv } from '@/lib/env/validate';

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
        const envStatus = validateEnv();

        return NextResponse.json({
            ok: true,
            runtime: info,
            env: envStatus,
            instance_id: process.env.INPSYQ_PREFLIGHT_INSTANCE_ID || null,
            timestamp: new Date().toISOString(),
        });
    } catch (e: any) {
        return NextResponse.json({
            ok: false,
            error: e.message,
            env: validateEnv(), // Try to return env status even on error
        }, { status: 500 });
    }
}
