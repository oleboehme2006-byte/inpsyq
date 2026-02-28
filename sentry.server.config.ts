/**
 * Sentry server-side initialization (Node.js runtime).
 * Loaded via instrumentation.ts on server startup.
 * Set SENTRY_DSN in Vercel environment variables (non-public, server only).
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: 0.1,

    debug: false,

    enabled: !!process.env.SENTRY_DSN,
});
