/**
 * GET /api/internal/diag/build
 * 
 * Returns build/deployment info for debugging.
 * Protected by INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Build-time constants
const BUILD_TIME = new Date().toISOString();

export async function GET(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    return NextResponse.json({
        ok: true,
        build: {
            git_sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
            git_ref: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
            build_time: BUILD_TIME,
            app_env: process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
            node_env: process.env.NODE_ENV || 'unknown',
            vercel_env: process.env.VERCEL_ENV || 'unknown',
        },
    });
}
