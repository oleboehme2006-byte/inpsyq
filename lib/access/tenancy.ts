/**
 * TENANCY — Membership and Tenant Scoping
 * 
 * Handles membership lookups and tenant access validation.
 */

import { query } from '@/db/client';
import { Role, isValidRole } from './roles';
import { assertSameOrg } from '@/lib/tenancy/assertions';

// ============================================================================
// Types
// ============================================================================

export interface Membership {
    membershipId: string;
    userId: string;
    orgId: string;
    teamId: string | null;
    role: Role;
    createdAt: Date;
}

// ============================================================================
// Database Queries
// ============================================================================

/**
 * Get all memberships for a user.
 */
export async function getMembershipsForUser(userId: string): Promise<Membership[]> {
    const result = await query(
        `SELECT membership_id, user_id, org_id, team_id, role, created_at 
     FROM memberships 
     WHERE user_id = $1`,
        [userId]
    );

    return result.rows.map(mapRow);
}

/**
 * Get membership for a user in a specific org.
 */
export async function getMembershipForOrg(
    userId: string,
    orgId: string
): Promise<Membership | null> {
    const result = await query(
        `SELECT membership_id, user_id, org_id, team_id, role, created_at 
     FROM memberships 
     WHERE user_id = $1 AND org_id = $2`,
        [userId, orgId]
    );

    if (result.rows.length === 0) return null;
    const membership = mapRow(result.rows[0]);

    // Strict Assertion: Ensure the returned membership actually matches requested Org
    assertSameOrg(orgId, membership.orgId, 'getMembershipForOrg');

    return membership;
}

/**
 * Get membership for a user for a specific team (via team lookup).
 */
export async function getMembershipForTeam(
    userId: string,
    teamId: string
): Promise<Membership | null> {
    // First get the org for this team
    const teamResult = await query(
        `SELECT org_id FROM teams WHERE team_id = $1`,
        [teamId]
    );

    if (teamResult.rows.length === 0) return null;
    const orgId = teamResult.rows[0].org_id;

    // Get membership for that org
    const membership = await getMembershipForOrg(userId, orgId);
    if (!membership) return null;

    // Check if membership is for this team (or null = org-wide)
    if (membership.teamId !== null && membership.teamId !== teamId) {
        return null; // User has membership but for different team
    }

    return membership;
}

/**
 * Create a new membership.
 */
export async function createMembership(
    userId: string,
    orgId: string,
    role: Role,
    teamId?: string
): Promise<Membership> {
    const result = await query(
        `INSERT INTO memberships (user_id, org_id, team_id, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, org_id) 
     DO UPDATE SET role = $4, team_id = $3
     RETURNING membership_id, user_id, org_id, team_id, role, created_at`,
        [userId, orgId, teamId ?? null, role]
    );

    return mapRow(result.rows[0]);
}

// ============================================================================
// Access Checks
// ============================================================================

/**
 * Check if user can access a specific org.
 */
export async function canAccessOrg(userId: string, orgId: string): Promise<boolean> {
    const membership = await getMembershipForOrg(userId, orgId);
    return membership !== null;
}

/**
 * Check if user can access a specific team.
 */
export async function canAccessTeam(userId: string, teamId: string): Promise<boolean> {
    const membership = await getMembershipForTeam(userId, teamId);
    return membership !== null;
}

/**
 * Get user's role for a specific org.
 */
export async function getRoleForOrg(userId: string, orgId: string): Promise<Role | null> {
    const membership = await getMembershipForOrg(userId, orgId);
    return membership?.role ?? null;
}

// ============================================================================
// Helpers
// ============================================================================

function mapRow(row: any): Membership {
    return {
        membershipId: row.membership_id,
        userId: row.user_id,
        orgId: row.org_id,
        teamId: row.team_id,
        role: isValidRole(row.role) ? row.role : 'EMPLOYEE',
        createdAt: new Date(row.created_at),
    };
}
