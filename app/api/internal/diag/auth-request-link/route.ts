/**
 * Auth Request-Link Diagnostics
 * 
 * GET /api/internal/diag/auth-request-link
 * 
 * Returns environment and configuration for debugging magic link issues.
 * Guarded by INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOriginDiagnostics, getPublicOrigin } from '@/lib/env/publicOrigin';
import { getEffectiveEmailProvider, shouldSuppressEmail } from '@/services/email/transport';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashValue(value: string | undefined): string | undefined {
    if (!value) return undefined;
    return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export async function GET(req: NextRequest) {
    const secret = process.env.INTERNAL_ADMIN_SECRET;
    const authHeader = req.headers.get('Authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!secret || providedSecret !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const originDiag = getOriginDiagnostics();
    const suppressCheck = shouldSuppressEmail();
    const hostHeader = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto');

    return NextResponse.json({
        ok: true,
        timestamp: new Date().toISOString(),

        // Environment
        environment: {
            app_env: process.env.APP_ENV,
            node_env: process.env.NODE_ENV,
            vercel_env: process.env.VERCEL_ENV,
            vercel_url_hash: hashValue(process.env.VERCEL_URL),
            is_production: originDiag.environment.is_production,
            is_staging: originDiag.environment.is_staging,
        },

        // Request context
        request: {
            host_hash: hashValue(hostHeader || ''),
            proto,
        },

        // Origin configuration
        origin: {
            configured: originDiag.configured,
            computed: originDiag.computed.origin,
            source: originDiag.computed.source,
            enforced: originDiag.computed.enforced,
            error: originDiag.computed.error,
            expected: originDiag.expected,
            valid: originDiag.valid,
        },

        // Email configuration
        email: {
            provider_configured: process.env.EMAIL_PROVIDER,
            provider_effective: getEffectiveEmailProvider(),
            suppressed: suppressCheck.suppress,
            suppressed_reason: suppressCheck.reason || undefined,
            resend_configured: !!process.env.RESEND_API_KEY,
        },

        // Build info
        build: {
            commit_sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8),
            deployment_id: process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 12),
        },
    });
}
