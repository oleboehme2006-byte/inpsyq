/**
 * Public Origin — Determine canonical public origin for email links
 * 
 * Used for generating magic links and other public-facing URLs.
 */

export interface PublicOriginResult {
    origin: string;
    isProduction: boolean;
}

/**
 * Get the canonical public origin for links.
 * 
 * Priority:
 * 1. AUTH_BASE_URL (if set)
 * 2. NEXT_PUBLIC_SITE_URL (if set)
 * 3. VERCEL_URL (preview/branch deployments)
 * 4. localhost fallback
 */
export function getPublicOrigin(): PublicOriginResult {
    // Explicit auth origin (highest priority)
    if (process.env.AUTH_BASE_URL) {
        return {
            origin: process.env.AUTH_BASE_URL.replace(/\/$/, ''),
            isProduction: process.env.AUTH_BASE_URL.includes('inpsyq.com'),
        };
    }

    // Site URL (commonly used in Next.js)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return {
            origin: process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
            isProduction: process.env.NEXT_PUBLIC_SITE_URL.includes('inpsyq.com'),
        };
    }

    // Vercel deployments
    if (process.env.VERCEL_URL) {
        return {
            origin: `https://${process.env.VERCEL_URL}`,
            isProduction: false, // VERCEL_URL is usually preview/branch
        };
    }

    // Production URL fallback
    if (process.env.NODE_ENV === 'production') {
        return {
            origin: 'https://www.inpsyq.com',
            isProduction: true,
        };
    }

    // Development fallback
    return {
        origin: 'http://localhost:3000',
        isProduction: false,
    };
}
