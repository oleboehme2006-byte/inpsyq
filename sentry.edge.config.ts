/**
 * Sentry edge runtime initialization.
 * Loaded via instrumentation.ts when NEXT_RUNTIME === 'edge'.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: 0.1,

    debug: false,

    enabled: !!process.env.SENTRY_DSN,
});
