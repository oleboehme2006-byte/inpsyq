/**
 * DASHBOARD CLIENT — Shared Fetch Helper for Dashboard APIs
 * 
 * Handles:
 * - Building URLs with org_id/team_id
 * - Attaching dev headers (X-DEV-USER-ID)
 * - Typed responses and error handling
 * - Client-side caching (5 min)
 */

// ============================================================================
// Environment
// ============================================================================

const DEV_MODE = typeof window !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : process.env.NODE_ENV === 'development';

const USE_DEV_MOCKS = DEV_MODE && process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS === 'true';

// Default dev user for API calls (first admin user from fixtures)
const DEV_USER_ID = '33333333-3333-4333-8333-0000000000001';

// Default dev fixtures
export const DEV_ORG_ID = '11111111-1111-4111-8111-111111111111';
export const DEV_TEAM_IDS = [
    '22222222-2222-4222-8222-222222222201', // Engineering
    '22222222-2222-4222-8222-222222222202', // Sales
];

// ============================================================================
// Types
// ============================================================================

export type FetchResult<T> =
    | { ok: true; data: T }
    | { ok: false; status: number; code: string; message: string };

// ============================================================================
// Core Fetch Helper
// ============================================================================

export async function fetchDashboardApi<T>(
    path: string,
    params: Record<string, string>
): Promise<FetchResult<T>> {
    // Build URL
    const url = new URL(path, window.location.origin);
    for (const [key, value] of Object.entries(params)) {
        if (value) url.searchParams.set(key, value);
    }

    // Headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add dev header in dev mode
    if (DEV_MODE) {
        headers['X-DEV-USER-ID'] = DEV_USER_ID;
    }

    try {
        const res = await fetch(url.toString(), {
            method: 'GET',
            headers,
            cache: 'no-store', // No caching for fresh data on reload
        });

        const json = await res.json();

        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                code: json.code || 'API_ERROR',
                message: json.error || 'API request failed',
            };
        }

        return { ok: true, data: json };
    } catch (error: any) {
        return {
            ok: false,
            status: 0,
            code: 'NETWORK_ERROR',
            message: error.message || 'Network error',
        };
    }
}

// ============================================================================
// Dashboard API Helpers
// ============================================================================

export async function fetchExecutiveDashboard(orgId: string) {
    return fetchDashboardApi('/api/dashboard/executive', { org_id: orgId });
}

export async function fetchTeamDashboard(orgId: string, teamId: string) {
    return fetchDashboardApi('/api/dashboard/team', { org_id: orgId, team_id: teamId });
}

export async function fetchExecutiveInterpretation(orgId: string) {
    return fetchDashboardApi('/api/interpretation/executive', { org_id: orgId });
}

export async function fetchTeamInterpretation(orgId: string, teamId: string) {
    return fetchDashboardApi('/api/interpretation/team', { org_id: orgId, team_id: teamId });
}

// ============================================================================
// ID Resolution (for dev mode)
// ============================================================================

/**
 * Get org ID from localStorage or fallback to dev fixture.
 */
export function getOrgId(): string {
    if (typeof window === 'undefined') return DEV_ORG_ID;

    // Check localStorage first
    const stored = localStorage.getItem('inpsyq_org_id');
    if (stored) return stored;

    // Fallback to dev fixture in dev mode
    if (DEV_MODE) {
        return DEV_ORG_ID;
    }

    return '';
}

/**
 * Get team ID from localStorage or fallback to dev fixture.
 */
export function getTeamId(): string {
    if (typeof window === 'undefined') return DEV_TEAM_IDS[0];

    const stored = localStorage.getItem('inpsyq_team_id');
    if (stored) return stored;

    if (DEV_MODE) {
        return DEV_TEAM_IDS[0];
    }

    return '';
}

// ============================================================================
// Mock Flag Check
// ============================================================================

export function shouldUseMocks(): boolean {
    return USE_DEV_MOCKS;
}
