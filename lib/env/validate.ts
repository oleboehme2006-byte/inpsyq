/**
 * Environment Validation Module
 * 
 * Centralized schema validation for required environment variables.
 * Ensures the application fails fast if critical configuration is missing.
 */

export interface EnvValidationResult {
    ok: boolean;
    missing: string[];
    mode: string;
}

const REQUIRED_VARS = [
    'DATABASE_URL',
    'INTERNAL_ADMIN_SECRET',
    'INTERNAL_CRON_SECRET'
];

const OPTIONAL_VARS = [
    'SLACK_WEBHOOK_URL',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_DASHBOARD_DEV_MOCKS'
];

export function validateEnv(): EnvValidationResult {
    const missing: string[] = [];

    REQUIRED_VARS.forEach(key => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    return {
        ok: missing.length === 0,
        missing,
        mode: process.env.NODE_ENV || 'unknown'
    };
}

/**
 * Throws if environment is invalid.
 * Use during app initialization (if possible) or critical paths.
 */
export function assertEnv(): void {
    const result = validateEnv();
    if (!result.ok) {
        throw new Error(`[FATAL] Missing environment variables: ${result.missing.join(', ')}`);
    }
}
