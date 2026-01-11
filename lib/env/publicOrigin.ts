/**
 * Public Origin Module
 * 
 * Single source of truth for the public site URL used in emails and links.
 * 
 * PRODUCTION RULES (HARD FAIL):
 * - AUTH_BASE_URL MUST be set
 * - AUTH_BASE_URL MUST equal https://www.inpsyq.com
 * - No fallback to headers or VERCEL_URL
 * - Misconfiguration throws fatal error
 */

import { isProduction, isStaging } from '@/lib/env/appEnv';

const PRODUCTION_ORIGIN = 'https://www.inpsyq.com';
const STAGING_ORIGIN = 'https://inpsyq-staging.vercel.app';

export interface PublicOriginResult {
    origin: string;
    enforced: boolean;
    source: 'AUTH_BASE_URL' | 'NEXT_PUBLIC_SITE_URL' | 'headers' | 'default' | 'PRODUCTION_ENFORCED';
    error?: string;
}

/**
 * Get the canonical public origin for constructing URLs in emails.
 * 
 * PRODUCTION (STRICT):
 * - REQUIRES AUTH_BASE_URL=https://www.inpsyq.com
 * - Throws if missing or wrong
 * 
 * STAGING/PREVIEW:
 * - Emails are suppressed anyway, origin used for logging only
 * 
 * DEVELOPMENT:
 * - Falls back to headers or localhost
 */
export function getPublicOrigin(reqHeaders?: Headers): PublicOriginResult {
    const authBaseUrl = process.env.AUTH_BASE_URL;
    const vercelEnv = process.env.VERCEL_ENV;

    // =========================================================================
    // PRODUCTION: STRICT ENFORCEMENT
    // =========================================================================
    if (isProduction()) {
        // MUST have AUTH_BASE_URL in production
        if (!authBaseUrl) {
            console.error('[PublicOrigin] FATAL: AUTH_BASE_URL not set in production');
            // Return production origin but mark as error
            return {
                origin: PRODUCTION_ORIGIN,
                enforced: true,
                source: 'PRODUCTION_ENFORCED',
                error: 'AUTH_BASE_URL not set',
            };
        }

        const origin = authBaseUrl.replace(/\/$/, '');

        // MUST equal production origin
        if (origin !== PRODUCTION_ORIGIN) {
            console.error(`[PublicOrigin] FATAL: AUTH_BASE_URL (${origin}) !== ${PRODUCTION_ORIGIN}`);
            return {
                origin: PRODUCTION_ORIGIN,
                enforced: true,
                source: 'PRODUCTION_ENFORCED',
                error: `AUTH_BASE_URL mismatch: ${origin}`,
            };
        }

        return { origin, enforced: false, source: 'AUTH_BASE_URL' };
    }

    // =========================================================================
    // STAGING/PREVIEW: Emails suppressed, origin for logging only
    // =========================================================================
    if (isStaging() || vercelEnv === 'preview') {
        if (authBaseUrl) {
            return { origin: authBaseUrl.replace(/\/$/, ''), enforced: false, source: 'AUTH_BASE_URL' };
        }
        return { origin: STAGING_ORIGIN, enforced: false, source: 'default' };
    }

    // =========================================================================
    // DEVELOPMENT: Use AUTH_BASE_URL, headers, or localhost
    // =========================================================================
    if (authBaseUrl) {
        return { origin: authBaseUrl.replace(/\/$/, ''), enforced: false, source: 'AUTH_BASE_URL' };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
        return { origin: siteUrl.replace(/\/$/, ''), enforced: false, source: 'NEXT_PUBLIC_SITE_URL' };
    }

    if (reqHeaders) {
        const proto = reqHeaders.get('x-forwarded-proto') || 'http';
        const host = reqHeaders.get('host');
        if (host) {
            return { origin: `${proto}://${host}`, enforced: false, source: 'headers' };
        }
    }

    return { origin: 'http://localhost:3000', enforced: false, source: 'default' };
}

/**
 * Get just the origin string (convenience wrapper).
 */
export function getPublicOriginUrl(reqHeaders?: Headers): string {
    return getPublicOrigin(reqHeaders).origin;
}

/**
 * Validate that current origin configuration is correct for production.
 * Throws FATAL error if misconfigured.
 */
export function assertPublicOriginValid(): void {
    if (!isProduction()) return;

    const authBaseUrl = process.env.AUTH_BASE_URL;

    if (!authBaseUrl) {
        throw new Error('FATAL: AUTH_BASE_URL not set in production');
    }

    const origin = authBaseUrl.replace(/\/$/, '');
    if (origin !== PRODUCTION_ORIGIN) {
        throw new Error(`FATAL: AUTH_BASE_URL (${origin}) must equal ${PRODUCTION_ORIGIN}`);
    }
}

/**
 * Get diagnostic info about origin configuration.
 */
export function getOriginDiagnostics(): {
    configured: string | undefined;
    computed: PublicOriginResult;
    expected: string;
    valid: boolean;
    environment: {
        app_env: string | undefined;
        vercel_env: string | undefined;
        is_production: boolean;
        is_staging: boolean;
    };
} {
    const result = getPublicOrigin();
    const expected = isProduction() ? PRODUCTION_ORIGIN : (isStaging() ? STAGING_ORIGIN : 'any');
    const valid = !result.error && (!isProduction() || result.origin === PRODUCTION_ORIGIN);

    return {
        configured: process.env.AUTH_BASE_URL,
        computed: result,
        expected,
        valid,
        environment: {
            app_env: process.env.APP_ENV,
            vercel_env: process.env.VERCEL_ENV,
            is_production: isProduction(),
            is_staging: isStaging(),
        },
    };
}

