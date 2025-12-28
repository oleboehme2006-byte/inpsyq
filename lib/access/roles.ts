/**
 * ROLES — Role Definitions and Permissions Matrix
 * 
 * Defines the RBAC role hierarchy and permissions for the InPsyq system.
 */

// ============================================================================
// Role Enum
// ============================================================================

export type Role = 'ADMIN' | 'EXECUTIVE' | 'TEAMLEAD' | 'EMPLOYEE';

export const ROLES: readonly Role[] = ['ADMIN', 'EXECUTIVE', 'TEAMLEAD', 'EMPLOYEE'];

export function isValidRole(role: string): role is Role {
    return ROLES.includes(role as Role);
}

// ============================================================================
// Permissions
// ============================================================================

export type Permission =
    | 'admin:read'
    | 'admin:write'
    | 'internal:read'
    | 'internal:write'
    | 'dashboard:org'
    | 'dashboard:team'
    | 'session:own'
    | 'session:any'
    | 'invite:create'
    | 'invite:accept';

/**
 * Permissions matrix: which roles have which permissions.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
    ADMIN: [
        'admin:read',
        'admin:write',
        'internal:read',
        'internal:write',
        'dashboard:org',
        'dashboard:team',
        'session:any',
        'invite:create',
        'invite:accept',
    ],

    EXECUTIVE: [
        'admin:read',
        'dashboard:org',
        'dashboard:team',
        'session:own',
        'invite:create',
        'invite:accept',
    ],

    TEAMLEAD: [
        'admin:read',
        'dashboard:team',
        'session:own',
        'invite:accept',
    ],

    EMPLOYEE: [
        'session:own',
        'invite:accept',
    ],
} as const;

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

// ============================================================================
// Role Hierarchy
// ============================================================================

/**
 * Role priority for comparison (higher = more privileged).
 */
export const ROLE_PRIORITY: Readonly<Record<Role, number>> = {
    ADMIN: 100,
    EXECUTIVE: 80,
    TEAMLEAD: 60,
    EMPLOYEE: 40,
} as const;

/**
 * Check if roleA is at least as privileged as roleB.
 */
export function isAtLeast(roleA: Role, roleB: Role): boolean {
    return ROLE_PRIORITY[roleA] >= ROLE_PRIORITY[roleB];
}

/**
 * Get the highest role from a list.
 */
export function getHighestRole(roles: Role[]): Role | null {
    if (roles.length === 0) return null;
    return roles.reduce((highest, current) =>
        ROLE_PRIORITY[current] > ROLE_PRIORITY[highest] ? current : highest
    );
}
