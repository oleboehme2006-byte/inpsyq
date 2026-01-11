/**
 * Public Origin Module
 * 
 * Single source of truth for the public site URL used in emails and links.
 * Enforces canonical domain in production to prevent preview domain leakage.
 */

import { getAppEnv, isProduction, isStaging } from '@/lib/env/appEnv';

const PRODUCTION_ORIGIN = 'https://www.inpsyq.com';
const STAGING_ORIGIN = 'https://inpsyq-staging.vercel.app';

export interface PublicOriginResult {
    origin: string;
    enforced: boolean;
    source: 'AUTH_BASE_URL' | 'NEXT_PUBLIC_SITE_URL' | 'headers' | 'default';
}

/**
 * Get the canonical public origin for constructing URLs in emails.
 * 
 * Priority:
 * 1. AUTH_BASE_URL (required in production)
 * 2. NEXT_PUBLIC_SITE_URL (fallback)
 * 3. Request headers (dev fallback)
 * 
 * In production, this MUST return https://www.inpsyq.com
 */
export function getPublicOrigin(reqHeaders?: Headers): PublicOriginResult {
    // Priority 1: AUTH_BASE_URL (explicit configuration)
    const authBaseUrl = process.env.AUTH_BASE_URL;
    if (authBaseUrl) {
        const origin = authBaseUrl.replace(/\/$/, ''); // Remove trailing slash

        // Validate in production
        if (isProduction() && origin !== PRODUCTION_ORIGIN) {
            console.error(`[PublicOrigin] CRITICAL: AUTH_BASE_URL (${origin}) does not match production origin`);
            // Still enforce production origin for safety
            return { origin: PRODUCTION_ORIGIN, enforced: true, source: 'AUTH_BASE_URL' };
        }

        return { origin, enforced: false, source: 'AUTH_BASE_URL' };
    }

    // Priority 2: NEXT_PUBLIC_SITE_URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
        const origin = siteUrl.replace(/\/$/, '');

        if (isProduction() && origin !== PRODUCTION_ORIGIN) {
            console.error(`[PublicOrigin] CRITICAL: NEXT_PUBLIC_SITE_URL does not match production origin`);
            return { origin: PRODUCTION_ORIGIN, enforced: true, source: 'NEXT_PUBLIC_SITE_URL' };
        }

        return { origin, enforced: false, source: 'NEXT_PUBLIC_SITE_URL' };
    }

    // Priority 3: Request headers (for development)
    if (reqHeaders) {
        const proto = reqHeaders.get('x-forwarded-proto') || 'http';
        const host = reqHeaders.get('host');

        if (host) {
            const derivedOrigin = `${proto}://${host}`;

            // Production enforcement: never allow non-canonical origin
            if (isProduction()) {
                console.warn(`[PublicOrigin] Production without AUTH_BASE_URL, enforcing canonical`);
                return { origin: PRODUCTION_ORIGIN, enforced: true, source: 'headers' };
            }

            return { origin: derivedOrigin, enforced: false, source: 'headers' };
        }
    }

    // Default fallbacks by environment
    if (isProduction()) {
        console.warn(`[PublicOrigin] Production without explicit config, using canonical origin`);
        return { origin: PRODUCTION_ORIGIN, enforced: true, source: 'default' };
    }

    if (isStaging()) {
        return { origin: STAGING_ORIGIN, enforced: false, source: 'default' };
    }

    // Development default
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
 * Throws if misconfigured.
 */
export function assertPublicOriginValid(): void {
    if (!isProduction()) return;

    const result = getPublicOrigin();
    if (result.origin !== PRODUCTION_ORIGIN) {
        throw new Error(`Production origin misconfigured: expected ${PRODUCTION_ORIGIN}, got ${result.origin}`);
    }
}
