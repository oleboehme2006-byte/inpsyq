/**
 * GET /api/internal/diag/staging-wiring
 * 
 * Staging-only diagnostic endpoint for verifying environment wiring.
 * Returns environment configuration summary (no secrets).
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppEnv, getEnvLabel } from '@/lib/env/appEnv';
import { validateStagingSafetyDetailed, isAlertsDisabled, getEffectiveEmailProvider } from '@/lib/env/stagingSafety';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Only available in staging
    if (getAppEnv() !== 'staging') {
        return NextResponse.json(
            { error: 'Not available in this environment' },
            { status: 404 }
        );
    }

    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const safety = validateStagingSafetyDetailed();

    // Get domain from request
    const host = req.headers.get('host') || 'unknown';

    // Hash DB host for privacy
    const dbUrl = process.env.DATABASE_URL || '';
    let databaseHostHash = 'none';
    try {
        const urlMatch = dbUrl.match(/@([^:\/]+)/);
        if (urlMatch) {
            databaseHostHash = createHash('sha256').update(urlMatch[1]).digest('hex').slice(0, 16);
        }
    } catch { /* ignore */ }

    return NextResponse.json({
        ok: true,
        wiring: {
            app_env: getAppEnv(),
            node_env: process.env.NODE_ENV || 'unknown',
            next_public_app_env: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
            env_label: getEnvLabel(),
            database_host_hash: databaseHostHash,
            email_provider_configured: process.env.EMAIL_PROVIDER || 'not-set',
            email_provider_effective: getEffectiveEmailProvider(),
            alerts_disabled: isAlertsDisabled(),
            domain: host,
            safety: {
                passed: safety.safe,
                violations: safety.violations,
            },
        },
    });
}
