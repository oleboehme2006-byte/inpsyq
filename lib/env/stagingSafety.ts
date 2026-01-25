/**
 * Staging Safety Module
 * 
 * Hard fail gates for staging environment safety.
 * Ensures staging cannot accidentally affect production.
 */

import { getAppEnv, isStaging, getEnvLabel } from './appEnv';
import { createHash } from 'crypto';

export interface StagingSafetyResult {
    safe: boolean;
    violations: string[];
    checks: {
        appEnv: string;
        nodeEnv: string;
        nextPublicAppEnv: string;
        emailProvider: string;
        databaseHostHash: string;
        alertsDisabled: boolean;
    };
}

// Production DB patterns to deny
const PROD_DB_DENY_PATTERNS = [
    'ep-small-sea-ag0i6j4g', // Known prod cluster
    '-prod.',
    '_prod.',
    '.prod.',
];

/**
 * Validate staging safety with detailed checks.
 */
export function validateStagingSafetyDetailed(): StagingSafetyResult {
    const violations: string[] = [];
    const appEnv = getAppEnv();
    const nodeEnv = process.env.NODE_ENV || 'unknown';
    const nextPublicAppEnv = process.env.NEXT_PUBLIC_APP_ENV || 'unknown';
    const emailProvider = process.env.EMAIL_PROVIDER || 'unknown';
    const dbUrl = process.env.DATABASE_URL || '';
    const alertsDisabled = process.env.OPS_ALERTS_DISABLED === 'true';

    // Hash DB host for logging without leaking
    let databaseHostHash = 'none';
    try {
        const urlMatch = dbUrl.match(/@([^:\/]+)/);
        if (urlMatch) {
            databaseHostHash = createHash('sha256').update(urlMatch[1]).digest('hex').slice(0, 12);
        }
    } catch { /* ignore */ }

    // Only enforce if in staging
    if (appEnv === 'staging') {
        // Check 1: NODE_ENV must be production
        if (nodeEnv !== 'production') {
            violations.push(`NODE_ENV must be 'production' in staging, got '${nodeEnv}'`);
        }

        // Check 2: NEXT_PUBLIC_APP_ENV must be staging
        if (nextPublicAppEnv !== 'staging') {
            violations.push(`NEXT_PUBLIC_APP_ENV must be 'staging', got '${nextPublicAppEnv}'`);
        }

        // Check 3: EMAIL_PROVIDER must not be 'resend'
        if (emailProvider === 'resend') {
            violations.push('EMAIL_PROVIDER must not be resend in staging');
        }

        // Check 4: DATABASE_URL must not match production patterns
        for (const pattern of PROD_DB_DENY_PATTERNS) {
            if (dbUrl.includes(pattern)) {
                violations.push(`DATABASE_URL matches production pattern: ${pattern}`);
                break;
            }
        }

        // Check 5: DATABASE_URL should contain 'staging' or guard token
        const guardToken = process.env.STAGING_DB_GUARD_TOKEN;
        if (!dbUrl.includes('staging') && !guardToken) {
            violations.push('DATABASE_URL should contain "staging" or STAGING_DB_GUARD_TOKEN must be set');
        }
    }

    return {
        safe: violations.length === 0,
        violations,
        checks: {
            appEnv,
            nodeEnv,
            nextPublicAppEnv,
            emailProvider,
            databaseHostHash,
            alertsDisabled,
        },
    };
}

/**
 * Assert staging is safe. Throws with code STAGING_UNSAFE_CONFIG on violation.
 */
export function assertStagingSafeStrict(): void {
    const result = validateStagingSafetyDetailed();
    if (!result.safe) {
        const error = new Error(`STAGING_UNSAFE_CONFIG: ${result.violations.join('; ')}`);
        (error as any).code = 'STAGING_UNSAFE_CONFIG';
        throw error;
    }
}

/**
 * Check if Slack alerts should be suppressed.
 */
export function isAlertsDisabled(): boolean {
    return process.env.OPS_ALERTS_DISABLED === 'true';
}

/**
 * Get effective email provider for staging (forces disabled).
 */
export function getEffectiveEmailProvider(): string {
    const configured = process.env.EMAIL_PROVIDER || 'disabled';

    if (isStaging()) {
        // Force disabled in staging
        if (configured === 'resend') {
            console.warn('[STAGING] Forcing EMAIL_PROVIDER=disabled (was resend)');
            return 'disabled';
        }
    }

    return configured;
}

/**
 * Check if cron is allowed in staging.
 */
export function isCronAllowedInStaging(): boolean {
    return process.env.INTERNAL_CRON_ALLOW_STAGING === 'true';
}
