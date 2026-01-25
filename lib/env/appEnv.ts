/**
 * Application Environment Abstraction
 * 
 * Provides explicit environment detection beyond NODE_ENV.
 * Supports: development, staging, production
 * 
 * Priority: APP_ENV env var > inferred from NODE_ENV
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * Get the current application environment.
 * Uses APP_ENV if set, otherwise infers from NODE_ENV.
 */
export function getAppEnv(): AppEnvironment {
    const appEnv = process.env.APP_ENV?.toLowerCase();

    if (appEnv === 'staging') return 'staging';
    if (appEnv === 'production' || appEnv === 'prod') return 'production';
    if (appEnv === 'development' || appEnv === 'dev') return 'development';

    // Fallback: infer from NODE_ENV
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    if (nodeEnv === 'production') return 'production';

    return 'development';
}

/**
 * Check if running in production.
 */
export function isProduction(): boolean {
    return getAppEnv() === 'production';
}

/**
 * Check if running in staging.
 */
export function isStaging(): boolean {
    return getAppEnv() === 'staging';
}

/**
 * Check if running in development.
 */
export function isDevelopment(): boolean {
    return getAppEnv() === 'development';
}

/**
 * Get client-side environment (uses NEXT_PUBLIC_APP_ENV).
 */
export function getClientAppEnv(): AppEnvironment {
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();

    if (appEnv === 'staging') return 'staging';
    if (appEnv === 'production' || appEnv === 'prod') return 'production';

    return 'development';
}

/**
 * Get environment label for display (e.g., alerts, UI).
 */
export function getEnvLabel(): string {
    const env = getAppEnv();
    if (env === 'staging') return '[STAGING]';
    if (env === 'production') return '';
    return '[DEV]';
}

/**
 * Validate staging safety rules.
 * Returns array of violations (empty = safe).
 */
export function validateStagingSafety(): string[] {
    const violations: string[] = [];

    if (!isStaging()) return violations;

    // In staging, EMAIL_PROVIDER should be disabled
    const emailProvider = process.env.EMAIL_PROVIDER;
    if (emailProvider && emailProvider !== 'disabled') {
        violations.push('STAGING: EMAIL_PROVIDER should be "disabled"');
    }

    // Verify no PROD secrets are used (basic check on known patterns)
    // This is a soft check - naming convention
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('_prod') || dbUrl.includes('-prod')) {
        violations.push('STAGING: DATABASE_URL appears to be production');
    }

    return violations;
}

/**
 * Assert staging is safe. Throws if violations found.
 */
export function assertStagingSafe(): void {
    const violations = validateStagingSafety();
    if (violations.length > 0) {
        throw new Error(`Staging safety violations:\n${violations.join('\n')}`);
    }
}
