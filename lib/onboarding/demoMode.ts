/**
 * Demo Mode Detection
 * 
 * Detects whether the application is running in demo/onboarding mode.
 * Demo mode adds contextual explanations but never alters data.
 * 
 * Detection priority:
 * 1. Query parameter: ?demo=true
 * 2. Environment variable: DEMO_MODE=true
 * 3. User role: has 'DEMO' or 'ONBOARDING' role
 */

export interface DemoModeContext {
    isDemo: boolean;
    source: 'query' | 'env' | 'role' | 'none';
    showHints: boolean;
}

/**
 * Check if demo mode is enabled via query parameter.
 * Safe for SSR - returns false if window is not defined.
 */
export function isDemoFromQuery(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'true';
}

/**
 * Check if demo mode is enabled via environment variable.
 */
export function isDemoFromEnv(): boolean {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Check if user has demo role.
 */
export function isDemoFromRole(userRoles: string[] | undefined): boolean {
    if (!userRoles) return false;
    return userRoles.some(role =>
        role.toUpperCase() === 'DEMO' ||
        role.toUpperCase() === 'ONBOARDING'
    );
}

/**
 * Get full demo mode context.
 */
export function getDemoContext(userRoles?: string[]): DemoModeContext {
    // Check query first (most explicit)
    if (isDemoFromQuery()) {
        return { isDemo: true, source: 'query', showHints: true };
    }

    // Check env (deployment-level)
    if (isDemoFromEnv()) {
        return { isDemo: true, source: 'env', showHints: true };
    }

    // Check role (user-level)
    if (isDemoFromRole(userRoles)) {
        return { isDemo: true, source: 'role', showHints: true };
    }

    return { isDemo: false, source: 'none', showHints: false };
}

/**
 * Simple hook-like function for client components.
 * In a real React app, this would be a hook with useState/useEffect.
 */
export function useDemoMode(userRoles?: string[]): DemoModeContext {
    return getDemoContext(userRoles);
}
