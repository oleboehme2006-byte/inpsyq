// @ts-check
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // instrumentation.ts is stable in Next.js 14.2+ — no flag needed
};

module.exports = withSentryConfig(nextConfig, {
    // Suppress Sentry CLI output during builds
    silent: !process.env.CI,

    // Org and project are read from SENTRY_ORG / SENTRY_PROJECT env vars
    // set in the Vercel dashboard. Source-map upload is skipped when these
    // are absent (local dev), so builds always succeed without a Sentry account.
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Upload a larger set of source maps to Sentry for better stack traces
    widenClientFileUpload: true,

    // Hide Sentry source-map comment from client bundles
    hideSourceMaps: true,

    // Automatically instrument route handlers and server components
    autoInstrumentServerFunctions: true,

    // Tree-shake Sentry logger statements from client bundle
    disableLogger: true,
});
