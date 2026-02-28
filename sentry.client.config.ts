/**
 * Sentry client-side initialization.
 * Loaded automatically by @sentry/nextjs for browser bundles.
 * Set NEXT_PUBLIC_SENTRY_DSN in Vercel environment variables.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,

    // Disable Sentry debug output in production
    debug: false,

    // Only initialize when DSN is configured — no-op otherwise
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
