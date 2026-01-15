/**
 * Public Origin — Determine canonical public origin for email links
 * 
 * Used for generating magic links and other public-facing URLs.
 * Strict enforcement in production.
 */

export interface PublicOriginResult {
    origin: string;
    isProduction: boolean;
    source: 'AUTH_BASE_URL' | 'NEXT_PUBLIC_SITE_URL' | 'VERCEL_URL' | 'FALLBACK_PROD' | 'FALLBACK_DEV';
    enforced: boolean;
    error?: string;
}

/**
 * Get the canonical public origin for links.
 * 
 * Priority:
 * 1. AUTH_BASE_URL (Highest priority, REQUIRED in production)
 * 2. NEXT_PUBLIC_SITE_URL (Common manual override)
 * 3. VERCEL_URL (Preview/branch deployments only)
 * 4. Fallbacks (Dev: localhost, Prod: inpsyq.com)
 */
export function getPublicOrigin(headers?: Headers): PublicOriginResult {
    // 1. Explicit auth origin (highest priority)
    if (process.env.AUTH_BASE_URL) {
        return {
            origin: process.env.AUTH_BASE_URL.replace(/\/$/, ''),
            isProduction: process.env.AUTH_BASE_URL.includes('inpsyq.com'),
            source: 'AUTH_BASE_URL',
            enforced: true,
        };
    }

    // 2. Site URL
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return {
            origin: process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
            isProduction: process.env.NEXT_PUBLIC_SITE_URL.includes('inpsyq.com'),
            source: 'NEXT_PUBLIC_SITE_URL',
            enforced: false,
        };
    }

    // 3. Vercel deployments (preview/staging)
    if (process.env.VERCEL_URL) {
        return {
            origin: `https://${process.env.VERCEL_URL}`,
            isProduction: false,
            source: 'VERCEL_URL',
            enforced: false,
        };
    }

    // 4. Production URL fallback (if NODE_ENV=production but no vars set)
    // In strict production, this is actually an error state, but we return a safe default
    // so we don't crash at module load time. Validation will catch it.
    if (process.env.NODE_ENV === 'production') {
        return {
            origin: 'https://www.inpsyq.com',
            isProduction: true,
            source: 'FALLBACK_PROD',
            enforced: false,
            error: 'AUTH_BASE_URL not set in production',
        };
    }

    // 5. Development fallback
    return {
        origin: 'http://localhost:3000',
        isProduction: false,
        source: 'FALLBACK_DEV',
        enforced: false,
    };
}

/**
 * Helper to get just the origin string.
 */
export function getPublicOriginUrl(): string {
    return getPublicOrigin().origin;
}

/**
 * Assert that the origin configuration is valid for production.
 * Throws if critical misconfiguration detected.
 */
export function assertPublicOriginValid(): void {
    const info = getPublicOrigin();

    // In production (Vercel Prod env), we strictly require AUTH_BASE_URL
    const isVercelProd = process.env.VERCEL_ENV === 'production';

    if (isVercelProd) {
        if (info.source !== 'AUTH_BASE_URL') {
            throw new Error(`ORIGIN_MISCONFIGURED: AUTH_BASE_URL is required in production. Got ${info.source}`);
        }
        if (info.origin !== 'https://www.inpsyq.com') {
            throw new Error(`ORIGIN_MISCONFIGURED: Production origin must be https://www.inpsyq.com. Got ${info.origin}`);
        }
    }
}

/**
 * Get detailed diagnostics for admin/debug endpoints.
 */
export function getOriginDiagnostics() {
    const computed = getPublicOrigin();

    return {
        configured: {
            AUTH_BASE_URL: process.env.AUTH_BASE_URL,
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
            VERCEL_URL: process.env.VERCEL_URL,
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_ENV: process.env.VERCEL_ENV,
        },
        computed,
        expected: process.env.NODE_ENV === 'production' ? 'https://www.inpsyq.com' : 'http://localhost:3000',
        valid: !computed.error && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV !== 'production' || computed.source === 'AUTH_BASE_URL'),
        environment: {
            is_production: process.env.NODE_ENV === 'production',
            is_staging: process.env.APP_ENV === 'staging',
            is_vercel_production: process.env.VERCEL_ENV === 'production',
        }
    };
}
