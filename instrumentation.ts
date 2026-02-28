/**
 * Next.js Instrumentation Hook (stable in Next.js 14.2+)
 *
 * This file is loaded once on server startup and wires Sentry into the
 * Node.js and Edge runtimes. The client-side init lives in
 * sentry.client.config.ts and is picked up by the Sentry webpack plugin.
 *
 * No changes needed here to add SENTRY_DSN — just set the env var in Vercel.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
    }
}
