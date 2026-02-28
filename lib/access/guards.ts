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
import { auth } from '@clerk/nextjs/server';

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

// Phase 24 strict error format
export interface RBACError {
    ok: false;
    error: {
        code: 'UNAUTHORIZED' | 'FORBIDDEN';
        message: string;
    };
}

export type GuardResult<T> =
    | { ok: true; value: T }
    | { ok: false; response: NextResponse<AccessDeniedError> };

export type RBACGuardResult<T> =
    | { ok: true; value: T }
    | { ok: false; response: NextResponse<RBACError> };


// ============================================================================
// Authentication
// ============================================================================

const DEV_USER_HEADER = 'x-dev-user-id';
// Dev auth bypass is opt-in: requires both NODE_ENV=development AND ENABLE_DEV_AUTH=true.
// This prevents the bypass from accidentally activating in self-hosted or Docker environments
// where NODE_ENV may not be 'production'.
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_AUTH === 'true';


/**
 * Get the authenticated user from the request.
 * 
 * In production: validates session cookie.
 * In development (NODE_ENV=development AND ENABLE_DEV_AUTH=true): also accepts
 * X-DEV-USER-ID header or inpsyq_dev_user cookie.
 */
export async function getAuthenticatedUser(
    req: Request
): Promise<GuardResult<AuthenticatedUser>> {
    // 1. Dev mode: accept X-DEV-USER-ID header or inpsyq_dev_user cookie
    if (DEV_MODE) {
        let devUserId: string | null = null;
        const cookieHeader = req.headers.get('cookie') || '';

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

    // 2. Production / Clerk Auth
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Authentication required', code: 'UNAUTHORIZED' },
                { status: 401 }
            ),
        };
    }

    // Resolve internal ID from DB
    const result = await query(
        'SELECT user_id FROM users WHERE clerk_id = $1',
        [clerkId]
    );

    if (result.rows.length === 0) {
        // User is authenticated in Clerk but not yet synced to DB
        // This can happen if webhook fails or is slow
        console.error(`[AUTH] User ${clerkId} not found in DB`);
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'User synchronization pending', code: 'UNAUTHORIZED' },
                { status: 401 }
            ),
        };
    }

    return { ok: true, value: { userId: result.rows[0].user_id } };
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
// RBAC Guards (Phase 24)
// ============================================================================

const SELECTED_ORG_COOKIE_NAME = 'inpsyq_selected_org';

export interface RBACContext {
    userId: string;
    orgId: string;
    role: Role;
    teamId: string | null;
}

/**
 * Require session and org context with specific roles.
 * Returns strict JSON errors.
 */
export async function requireRolesStrict(
    req: Request,
    allowedRoles: Role[]
): Promise<RBACGuardResult<RBACContext>> {
    // 1. Authenticate
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.ok) {
        // Convert to RBAC error format
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'UNAUTHORIZED' as const, message: 'Authentication required' } },
                { status: 401 }
            ),
        };
    }

    const { userId } = authResult.value;

    // 2. Get selected org from cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const orgMatch = cookieHeader.match(new RegExp(`${SELECTED_ORG_COOKIE_NAME}=([^;]+)`));
    let selectedOrgId = orgMatch?.[1];

    // 3. Get all memberships
    const memberships = await getMembershipsForUser(userId);

    if (memberships.length === 0) {
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'No organization access' } },
                { status: 403 }
            ),
        };
    }

    // Auto-select if single org
    if (memberships.length === 1) {
        selectedOrgId = memberships[0].orgId;
    }

    if (!selectedOrgId) {
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'No organization selected' } },
                { status: 403 }
            ),
        };
    }

    // 4. Find membership for selected org — must be a real membership, no cross-org bypass
    const membership = memberships.find(m => m.orgId === selectedOrgId);

    if (!membership) {
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'No access to selected organization' } },
                { status: 403 }
            ),
        };
    }

    // 5. Check role
    if (!allowedRoles.includes(membership.role)) {
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            ),
        };
    }

    return {
        ok: true,
        value: {
            userId,
            orgId: selectedOrgId!,
            role: membership.role,
            teamId: membership.teamId,
        },
    };
}

/**
 * Require team access with RBAC enforcement.
 * - TEAMLEAD: Only their own team
 * - EXECUTIVE, ADMIN: Any team in org
 */
export async function requireTeamAccessStrict(
    req: Request,
    teamId: string
): Promise<RBACGuardResult<RBACContext>> {
    // Get RBAC context (TEAMLEAD, EXECUTIVE, ADMIN allowed)
    const result = await requireRolesStrict(req, ['TEAMLEAD', 'EXECUTIVE', 'ADMIN']);
    if (!result.ok) return result;

    const { userId, orgId, role, teamId: userTeamId } = result.value;

    // Verify team belongs to org
    const teamResult = await query(
        `SELECT org_id FROM teams WHERE team_id = $1`,
        [teamId]
    );

    if (teamResult.rows.length === 0) {
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'Team not found' } },
                { status: 404 }
            ),
        };
    }

    const teamOrgId = teamResult.rows[0].org_id;
    if (teamOrgId !== orgId) {
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'Team not in your organization' } },
                { status: 403 }
            ),
        };
    }

    // TEAMLEAD: Can only access their own team
    if (role === 'TEAMLEAD' && userTeamId !== teamId) {
        return {
            ok: false,
            response: NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'Access denied to this team' } },
                { status: 403 }
            ),
        };
    }

    return { ok: true, value: result.value };
}

/**
 * Require ADMIN role only.
 */
export async function requireAdminStrict(
    req: Request
): Promise<RBACGuardResult<RBACContext>> {
    return requireRolesStrict(req, ['ADMIN']);
}

/**
 * Require EXECUTIVE or ADMIN role (org management).
 * Used by client-facing /api/org/* routes.
 */
export async function requireOrgManagement(
    req: Request
): Promise<RBACGuardResult<RBACContext>> {
    return requireRolesStrict(req, ['EXECUTIVE', 'ADMIN']);
}

// ============================================================================
// Helpers
// ============================================================================

function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

