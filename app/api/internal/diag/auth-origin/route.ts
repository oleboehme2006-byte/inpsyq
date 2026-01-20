/**
 * GET /api/internal/diag/auth-origin
 * 
 * Diagnostic endpoint to verify auth origin configuration.
 * Returns computed origin, email provider, and environment settings.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPublicOrigin, assertPublicOriginValid } from '@/lib/env/publicOrigin';
import { getAppEnv, isProduction, isStaging } from '@/lib/env/appEnv';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

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

    // Get origin info
    const originResult = getPublicOrigin(req.headers);

    // Check if preview should disable email
    const vercelEnv = process.env.VERCEL_ENV || 'unknown';
    const isPreview = vercelEnv === 'preview';
    const emailPreviewDisabled = isPreview || isStaging();

    // Hash sensitive values
    const authBaseUrl = process.env.AUTH_BASE_URL || '';
    const authBaseUrlHash = authBaseUrl
        ? createHash('sha256').update(authBaseUrl).digest('hex').slice(0, 16)
        : 'not-set';

    // Determine effective email provider
    let emailProviderEffective = process.env.EMAIL_PROVIDER || 'disabled';
    if (emailPreviewDisabled) {
        emailProviderEffective = 'disabled';
    }

    // Validate origin
    let originValid = true;
    let originError: string | undefined;
    try {
        assertPublicOriginValid();
    } catch (e: any) {
        originValid = false;
        originError = e.message;
    }

    return NextResponse.json({
        ok: true,
        auth: {
            computed_origin: originResult.origin,
            origin_source: originResult.source,
            origin_enforced: originResult.enforced,
            origin_valid: originValid,
            origin_error: originError,
            auth_base_url_hash: authBaseUrlHash,
            secret_configured: !!expected,
        },
        environment: {
            app_env: getAppEnv(),
            node_env: process.env.NODE_ENV || 'unknown',
            vercel_env: vercelEnv,
            is_production: isProduction(),
            is_staging: isStaging(),
            is_preview: isPreview,
        },
        email: {
            provider_configured: process.env.EMAIL_PROVIDER || 'not-set',
            provider_effective: emailProviderEffective,
            preview_email_disabled: emailPreviewDisabled,
        },
    });
}
