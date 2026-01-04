/**
 * GUARDS — Request Guards for Access Control
 * 
 * Provides middleware-like functions to enforce access control on API routes.
 * Uses dev-mode X-DEV-USER-ID header in development.
 */

import { NextResponse } from 'next/server';
import { Role, hasPermission, Permission, isAtLeast } from './roles';
import { getMembershipForOrg, getMembershipForTeam, getMembershipsForUser, Membership } from './tenancy';
import { query } from '@/db/client';

// ============================================================================
// Types
// ============================================================================

export interface AuthenticatedUser {
    userId: string;
    membership?: Membership;
}

export interface AccessDeniedError {
    error: string;
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TENANT';
    requestId?: string;
}

export type GuardResult<T> =
    | { ok: true; value: T }
    | { ok: false; response: NextResponse<AccessDeniedError> };

// ============================================================================
// Authentication
// ============================================================================

const DEV_USER_HEADER = 'x-dev-user-id';
const DEV_MODE = process.env.NODE_ENV === 'development';
const SESSION_COOKIE_NAME = 'inpsyq_session';

/**
 * Get the authenticated user from the request.
 * 
 * In production: validates session cookie.
 * In development: also accepts X-DEV-USER-ID header or inpsyq_dev_user cookie.
 */
export async function getAuthenticatedUser(
    req: Request
): Promise<GuardResult<AuthenticatedUser>> {
    const cookieHeader = req.headers.get('cookie') || '';

    // 1. Try session cookie (production auth)
    const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (sessionMatch && sessionMatch[1]) {
        const sessionToken = sessionMatch[1];
        const session = await validateSessionToken(sessionToken);

        if (session) {
            return { ok: true, value: { userId: session.userId } };
        }
    }

    // 2. Dev mode: accept X-DEV-USER-ID header or inpsyq_dev_user cookie
    if (DEV_MODE) {
        let devUserId: string | null = null;

        // Try Header
        devUserId = req.headers.get(DEV_USER_HEADER);

        // Try Dev Cookie
        if (!devUserId) {
            const match = cookieHeader.match(/inpsyq_dev_user=([^;]+)/);
            if (match && match[1]) {
                devUserId = match[1];
            }
        }

        if (devUserId) {
            // Validate UUID format
            if (!isValidUUID(devUserId)) {
                return {
                    ok: false,
                    response: NextResponse.json(
                        { error: 'Invalid user ID format', code: 'UNAUTHORIZED' },
                        { status: 401 }
                    ),
                };
            }

            // Verify user exists
            const userResult = await query(
                `SELECT user_id FROM users WHERE user_id = $1`,
                [devUserId]
            );

            if (userResult.rows.length === 0) {
                return {
                    ok: false,
                    response: NextResponse.json(
                        { error: 'User not found', code: 'UNAUTHORIZED' },
                        { status: 401 }
                    ),
                };
            }

            return { ok: true, value: { userId: devUserId } };
        }
    }

    return {
        ok: false,
        response: NextResponse.json(
            { error: 'Authentication required', code: 'UNAUTHORIZED' },
            { status: 401 }
        ),
    };
}

/**
 * Validate a session token and return user info.
 */
async function validateSessionToken(token: string): Promise<{ userId: string } | null> {
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

    return { userId: result.rows[0].user_id };
}

// ============================================================================
// Role Guards
// ============================================================================

/**
 * Require user has a specific role within an org.
 */
export async function requireRole(
    req: Request,
    orgId: string,
    allowedRoles: Role[]
): Promise<GuardResult<AuthenticatedUser & { membership: Membership }>> {
    // First authenticate
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.ok) return authResult;

    const { userId } = authResult.value;

    // Get membership for this org
    const membership = await getMembershipForOrg(userId, orgId);

    if (!membership) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Access denied: no membership in this organization', code: 'FORBIDDEN' },
                { status: 403 }
            ),
        };
    }

    if (!allowedRoles.includes(membership.role)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: `Access denied: requires one of [${allowedRoles.join(', ')}]`, code: 'FORBIDDEN' },
                { status: 403 }
            ),
        };
    }

    return { ok: true, value: { userId, membership } };
}

/**
 * Require user has a specific permission within an org.
 */
export async function requirePermission(
    req: Request,
    orgId: string,
    permission: Permission
): Promise<GuardResult<AuthenticatedUser & { membership: Membership }>> {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.ok) return authResult;

    const { userId } = authResult.value;
    const membership = await getMembershipForOrg(userId, orgId);

    if (!membership) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Access denied: no membership in this organization', code: 'FORBIDDEN' },
                { status: 403 }
            ),
        };
    }

    if (!hasPermission(membership.role, permission)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: `Access denied: missing permission [${permission}]`, code: 'FORBIDDEN' },
                { status: 403 }
            ),
        };
    }

    return { ok: true, value: { userId, membership } };
}

// ============================================================================
// Tenant Guards
// ============================================================================

/**
 * Require user has access to a specific org.
 */
export async function requireOrgAccess(
    req: Request,
    orgId: string
): Promise<GuardResult<AuthenticatedUser & { membership: Membership }>> {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.ok) return authResult;

    const { userId } = authResult.value;
    const membership = await getMembershipForOrg(userId, orgId);

    if (!membership) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Access denied: no access to this organization', code: 'INVALID_TENANT' },
                { status: 403 }
            ),
        };
    }

    return { ok: true, value: { userId, membership } };
}

/**
 * Require user has access to a specific team.
 */
export async function requireTeamAccess(
    req: Request,
    teamId: string
): Promise<GuardResult<AuthenticatedUser & { membership: Membership }>> {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.ok) return authResult;

    const { userId } = authResult.value;
    const membership = await getMembershipForTeam(userId, teamId);

    if (!membership) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Access denied: no access to this team', code: 'INVALID_TENANT' },
                { status: 403 }
            ),
        };
    }

    return { ok: true, value: { userId, membership } };
}

// ============================================================================
// Admin/Internal Guards
// ============================================================================

const INTERNAL_ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

/**
 * Require internal admin access (for diagnostic routes).
 * Uses secret header in production, dev header in development.
 */
export async function requireInternalAccess(
    req: Request
): Promise<GuardResult<{ source: 'secret' | 'dev_user' }>> {
    // Check secret header first
    const secretHeader = req.headers.get('x-inpsyq-admin-secret');
    if (secretHeader && INTERNAL_ADMIN_SECRET && secretHeader === INTERNAL_ADMIN_SECRET) {
        return { ok: true, value: { source: 'secret' } };
    }

    // Dev mode: allow dev user
    if (DEV_MODE) {
        const authResult = await getAuthenticatedUser(req);
        if (authResult.ok) {
            return { ok: true, value: { source: 'dev_user' } };
        }
    }

    return {
        ok: false,
        response: NextResponse.json(
            { error: 'Access denied: internal access required', code: 'FORBIDDEN' },
            { status: 403 }
        ),
    };
}

// ============================================================================
// Session Guards
// ============================================================================

/**
 * Require user can only operate on their own session/userId.
 */
export async function requireSelfOrAdmin(
    req: Request,
    targetUserId: string
): Promise<GuardResult<AuthenticatedUser>> {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.ok) return authResult;

    const { userId } = authResult.value;

    // Same user = OK
    if (userId === targetUserId) {
        return authResult;
    }

    // Check if user is ADMIN in any org (can operate on anyone)
    const memberships = await getMembershipsForUser(userId);
    const isAdmin = memberships.some(m => m.role === 'ADMIN');

    if (isAdmin) {
        return authResult;
    }

    return {
        ok: false,
        response: NextResponse.json(
            { error: 'Access denied: can only operate on your own data', code: 'FORBIDDEN' },
            { status: 403 }
        ),
    };
}

// ============================================================================
// Helpers
// ============================================================================

function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}
