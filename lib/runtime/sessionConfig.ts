/**
 * Canonical Session Configuration Resolver
 * Single source of truth for all session-related settings.
 * 
 * CRITICAL: This file defines PRODUCTION DEFAULTS.
 * - TARGET_COUNT_DEFAULT = 10 (not 6, not 12)
 * - ADAPTIVE_DEFAULT = false (adaptive does NOT reduce count)
 * - FORCE_COUNT_DEFAULT = true (always enforce target count via padding)
 */

// ========================
// DEFAULTS (Production-Safe)
// ========================

const TARGET_COUNT_DEFAULT = 10;
const ADAPTIVE_DEFAULT = false;  // IMPORTANT: false by default to prevent count reduction
const FORCE_COUNT_DEFAULT = true; // Always pad to target
const MIN_COUNT_DEFAULT = 6;
const MAX_COUNT_DEFAULT = 15;

// ========================
// ENV PARSING HELPERS
// ========================

function envBool(key: string, defaultValue: boolean): boolean {
    const val = process.env[key];
    if (val === undefined || val === '') return defaultValue;
    return val.toLowerCase() === 'true' || val === '1';
}

function envInt(key: string, defaultValue: number): number {
    const val = process.env[key];
    if (val === undefined || val === '') return defaultValue;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ========================
// CONFIG INTERFACE
// ========================

export interface SessionConfig {
    targetCount: number;
    adaptive: boolean;
    forceCount: boolean;
    minCount: number;
    maxCount: number;
    contextualSelectionEnabled: boolean;
}

// ========================
// RESOLVER
// ========================

export function getSessionConfig(overrides?: Partial<SessionConfig>): SessionConfig {
    const minCount = envInt('SESSION_MIN_COUNT', MIN_COUNT_DEFAULT);
    const maxCount = envInt('SESSION_MAX_COUNT', MAX_COUNT_DEFAULT);

    const rawTarget = envInt('SESSION_QUESTION_COUNT', TARGET_COUNT_DEFAULT);
    const targetCount = clamp(rawTarget, minCount, maxCount);

    const adaptive = envBool('SESSION_ADAPTIVE', ADAPTIVE_DEFAULT);
    const forceCount = envBool('SESSION_FORCE_COUNT', FORCE_COUNT_DEFAULT);
    const contextualSelectionEnabled = envBool('CONTEXTUAL_SELECTION_MODE', false);

    return {
        targetCount: overrides?.targetCount ?? targetCount,
        adaptive: overrides?.adaptive ?? adaptive,
        forceCount: overrides?.forceCount ?? forceCount,
        minCount: overrides?.minCount ?? minCount,
        maxCount: overrides?.maxCount ?? maxCount,
        contextualSelectionEnabled: overrides?.contextualSelectionEnabled ?? contextualSelectionEnabled,
    };
}

// ========================
// BUILD/RUNTIME INFO
// ========================

export interface RuntimeInfo {
    session: SessionConfig;
    build: {
        node_env: string;
        vercel_env?: string;
        git_sha?: string;
    };
    llm: {
        model: string;
        key_present: boolean;
    };
}

export function getRuntimeInfo(): RuntimeInfo {
    return {
        session: getSessionConfig(),
        build: {
            node_env: process.env.NODE_ENV || 'development',
            vercel_env: process.env.VERCEL_ENV,
            git_sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
        },
        llm: {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            key_present: !!process.env.OPENAI_API_KEY,
        },
    };
}
