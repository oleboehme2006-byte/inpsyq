/**
 * ENV VALIDATION — Fail-Fast Environment Check
 * 
 * Item 3.18: Validates required environment variables at startup.
 * Throws a clear, actionable error if any are missing.
 * 
 * Usage: import '@/lib/env' at the top of your entry point.
 */

interface EnvVar {
    name: string;
    required: boolean;
    description: string;
}

const ENV_SCHEMA: EnvVar[] = [
    // Database
    { name: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string (Neon)' },

    // Auth (Clerk)
    { name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', required: true, description: 'Clerk publishable key' },
    { name: 'CLERK_SECRET_KEY', required: true, description: 'Clerk secret key' },

    // LLM (optional in dev, required in prod with LLM_PROVIDER=openai)
    { name: 'OPENAI_API_KEY', required: false, description: 'OpenAI API key (required when LLM_PROVIDER=openai)' },

    // Email (optional in dev)
    { name: 'RESEND_API_KEY', required: false, description: 'Resend email API key' },

    // App
    { name: 'NEXT_PUBLIC_APP_URL', required: false, description: 'Base URL for the app (default: http://localhost:3000)' },
];

export interface EnvValidationResult {
    valid: boolean;
    missing: string[];
    warnings: string[];
}

export function validateEnv(): EnvValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const v of ENV_SCHEMA) {
        const value = process.env[v.name];
        if (!value || value.trim() === '') {
            if (v.required) {
                missing.push(`❌ MISSING: ${v.name} — ${v.description}`);
            } else {
                warnings.push(`⚠️  OPTIONAL: ${v.name} — ${v.description}`);
            }
        }
    }

    // Conditional: if LLM is enabled, OPENAI_API_KEY becomes required
    if (process.env.LLM_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
        missing.push('❌ MISSING: OPENAI_API_KEY — Required when LLM_PROVIDER=openai');
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings,
    };
}

/**
 * Validate and log. Call at startup.
 * Throws in production if required vars are missing.
 */
export function ensureEnv(): void {
    const result = validateEnv();

    if (result.warnings.length > 0 && process.env.NODE_ENV !== 'test') {
        console.log('[ENV] Warnings:');
        result.warnings.forEach(w => console.log(`  ${w}`));
    }

    if (!result.valid) {
        const msg = `\n[ENV] Missing required environment variables:\n${result.missing.map(m => `  ${m}`).join('\n')}\n`;

        if (process.env.NODE_ENV === 'production') {
            throw new Error(msg);
        } else {
            console.warn(msg);
        }
    }
}
