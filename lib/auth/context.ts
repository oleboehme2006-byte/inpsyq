import { cookies } from 'next/headers';
import { query } from '@/db/client';
import { Role, isValidRole } from '@/lib/access/roles';
import { Membership, getMembershipsForUser, getMembershipForOrg } from '@/lib/access/tenancy';

let authImport: typeof import('@clerk/nextjs/server') | null = null;

async function getClerkAuth() {
    if (!authImport) {
        try {
            authImport = await import('@clerk/nextjs/server');
        } catch {
            return null;
        }
    }
    return authImport;
}

// ============================================================================
// Types
// ============================================================================

export interface AuthContext {
    userId: string;
    orgId: string;
    role: Role;
    teamId: string | null;  // Only set for TEAMLEAD
    memberships: Membership[];
}

export interface AuthContextResult {
    authenticated: boolean;
    context: AuthContext | null;
    error?: 'NO_SESSION' | 'NO_ORG_SELECTED' | 'INVALID_ORG' | 'INVARIANT_VIOLATION';
    redirectTo?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_COOKIE_NAME = 'inpsyq_session';
const SELECTED_ORG_COOKIE_NAME = 'inpsyq_selected_org';
const DEV_MODE = process.env.NODE_ENV === 'development';

// ============================================================================
// Main Resolver
// ============================================================================

/**
 * Resolve the full auth context.
 * 
 * Priority:
 * 1. Clerk auth() — production path (uses clerk_id)
 * 2. Dev cookie — development override
 * 3. Custom session cookie — legacy fallback
 */
export async function resolveAuthContext(): Promise<AuthContextResult> {
    const cookieStore = await cookies();

    let userId: string | null = null;

    // 1. Try Clerk auth() first (production path)
    const clerk = await getClerkAuth();
    if (clerk) {
        try {
            const { userId: clerkId } = await clerk.auth();
            if (clerkId) {
                // Look up internal user by clerk_id
                const clerkResult = await query(
                    `SELECT user_id FROM users WHERE clerk_id = $1`,
                    [clerkId]
                );
                if (clerkResult.rows.length > 0) {
                    userId = clerkResult.rows[0].user_id;
                }
            }
        } catch {
            // Clerk not available in this context (e.g., script), continue
        }
    }

    // 2. Dev mode: try dev cookie
    if (!userId && DEV_MODE) {
        const devUserId = cookieStore.get('inpsyq_dev_user')?.value;
        if (devUserId) {
            const userExists = await query(
                `SELECT user_id FROM users WHERE user_id = $1`,
                [devUserId]
            );
            if (userExists.rows.length > 0) {
                userId = devUserId;
            }
        }
    }

    // 3. Legacy fallback: custom session cookie
    if (!userId) {
        const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        if (sessionToken) {
            userId = await validateSessionToken(sessionToken);
        }
    }

    if (!userId) {
        return { authenticated: false, context: null, error: 'NO_SESSION', redirectTo: '/login' };
    }

    // 2. Get all memberships
    const memberships = await getMembershipsForUser(userId);

    if (memberships.length === 0) {
        // User has no org access - should not happen normally
        return { authenticated: true, context: null, error: 'INVALID_ORG', redirectTo: '/login' };
    }

    // 3. Resolve selected org
    let selectedOrgId = cookieStore.get(SELECTED_ORG_COOKIE_NAME)?.value;

    // If only one org, auto-select it
    if (memberships.length === 1) {
        selectedOrgId = memberships[0].orgId;
    }

    // If no org selected and multiple orgs, redirect to selector
    if (!selectedOrgId && memberships.length > 1) {
        return { authenticated: true, context: null, error: 'NO_ORG_SELECTED', redirectTo: '/org/select' };
    }

    // Validate selected org
    const membership = memberships.find(m => m.orgId === selectedOrgId);
    if (!membership) {
        return { authenticated: true, context: null, error: 'INVALID_ORG', redirectTo: '/org/select' };
    }

    // 4. Enforce invariants
    // TEAMLEAD must have exactly one team assignment
    if (membership.role === 'TEAMLEAD' && !membership.teamId) {
        console.error(`[AUTH] INVARIANT VIOLATION: TEAMLEAD ${userId} has no team assignment`);
        return { authenticated: true, context: null, error: 'INVARIANT_VIOLATION' };
    }

    return {
        authenticated: true,
        context: {
            userId,
            orgId: membership.orgId,
            role: membership.role,
            teamId: membership.teamId,
            memberships,
        },
    };
}

/**
 * Resolve auth context from Request object (for API routes).
 */
export async function resolveAuthContextFromRequest(req: Request): Promise<AuthContextResult> {
    const cookieHeader = req.headers.get('cookie') || '';

    // Parse cookies
    const getCookie = (name: string): string | undefined => {
        const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
        return match?.[1];
    };

    const sessionToken = getCookie(SESSION_COOKIE_NAME);
    const devUserId = DEV_MODE ? getCookie('inpsyq_dev_user') : undefined;
    const selectedOrgId = getCookie(SELECTED_ORG_COOKIE_NAME);

    let userId: string | null = null;

    // Try session cookie
    if (sessionToken) {
        userId = await validateSessionToken(sessionToken);
    }

    // Dev mode: try dev header or cookie
    if (!userId && DEV_MODE) {
        const devHeader = req.headers.get('x-dev-user-id');
        if (devHeader) {
            const userExists = await query(`SELECT user_id FROM users WHERE user_id = $1`, [devHeader]);
            if (userExists.rows.length > 0) userId = devHeader;
        } else if (devUserId) {
            const userExists = await query(`SELECT user_id FROM users WHERE user_id = $1`, [devUserId]);
            if (userExists.rows.length > 0) userId = devUserId;
        }
    }

    if (!userId) {
        return { authenticated: false, context: null, error: 'NO_SESSION' };
    }

    const memberships = await getMembershipsForUser(userId);

    if (memberships.length === 0) {
        return { authenticated: true, context: null, error: 'INVALID_ORG' };
    }

    let resolvedOrgId = selectedOrgId;
    if (memberships.length === 1) {
        resolvedOrgId = memberships[0].orgId;
    }

    if (!resolvedOrgId) {
        return { authenticated: true, context: null, error: 'NO_ORG_SELECTED' };
    }

    const membership = memberships.find(m => m.orgId === resolvedOrgId);
    if (!membership) {
        return { authenticated: true, context: null, error: 'INVALID_ORG' };
    }

    if (membership.role === 'TEAMLEAD' && !membership.teamId) {
        return { authenticated: true, context: null, error: 'INVARIANT_VIOLATION' };
    }

    return {
        authenticated: true,
        context: {
            userId,
            orgId: membership.orgId,
            role: membership.role,
            teamId: membership.teamId,
            memberships,
        },
    };
}

/**
 * Get the redirect path for a given role.
 */
export function getRedirectForRole(role: Role, teamId: string | null): string {
    switch (role) {
        case 'ADMIN':
            return '/admin';
        case 'EXECUTIVE':
            return '/executive';
        case 'TEAMLEAD':
            return teamId ? `/team/${teamId}` : '/team';
        case 'EMPLOYEE':
        default:
            return '/measure';
    }
}

/**
 * Get the selected org cookie name.
 */
export function getSelectedOrgCookieName(): string {
    return SELECTED_ORG_COOKIE_NAME;
}

// ============================================================================
// Helpers
// ============================================================================

async function validateSessionToken(token: string): Promise<string | null> {
    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const result = await query(
        `SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    // Update last_seen_at
    await query(`UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = $1`, [tokenHash]);

    return result.rows[0].user_id;
}
