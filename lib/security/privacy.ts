/**
 * Privacy & GDPR Operations Module
 * 
 * Handles user soft-delete, org data erasure, and retention enforcement.
 */

import { query } from '@/db/client';
import { logSecurityEvent } from './auditLog';

export interface SoftDeleteResult {
    ok: boolean;
    userId: string;
    sessionsRevoked: number;
    error?: string;
}

/**
 * Soft-delete a user (GDPR Art. 17 support).
 * Marks user as deleted, revokes sessions, prevents login.
 * Does NOT affect historical aggregates.
 */
export async function softDeleteUser(
    adminUserId: string,
    targetUserId: string,
    orgId: string
): Promise<SoftDeleteResult> {
    try {
        // Mark user as deleted
        await query(`
            UPDATE users 
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE user_id = $1
        `, [targetUserId]);

        // Revoke all sessions
        const sessionsRes = await query(`
            DELETE FROM sessions WHERE user_id = $1
            RETURNING session_id
        `, [targetUserId]);
        const sessionsRevoked = sessionsRes.rowCount || 0;

        // Log the action
        await logSecurityEvent({
            actor_user_id: adminUserId,
            org_id: orgId,
            action: 'USER_DELETED',
            target_user_id: targetUserId,
            metadata: { sessionsRevoked },
        });

        return {
            ok: true,
            userId: targetUserId,
            sessionsRevoked,
        };
    } catch (e: any) {
        console.error('[PRIVACY] Soft delete failed:', e.message);
        return {
            ok: false,
            userId: targetUserId,
            sessionsRevoked: 0,
            error: e.message,
        };
    }
}

export interface OrgPurgeResult {
    ok: boolean;
    orgId: string;
    dryRun: boolean;
    counts: {
        sessions: number;
        responses: number;
        invites: number;
        memberships: number;
    };
    error?: string;
}

/**
 * Purge all org data (GDPR erasure).
 * WARNING: Irreversible unless dry_run=true.
 */
export async function purgeOrgData(
    adminUserId: string,
    orgId: string,
    dryRun: boolean = true
): Promise<OrgPurgeResult> {
    const counts = {
        sessions: 0,
        responses: 0,
        invites: 0,
        memberships: 0,
    };

    try {
        // Log start
        await logSecurityEvent({
            actor_user_id: adminUserId,
            org_id: orgId,
            action: 'ORG_PURGE_STARTED',
            metadata: { dryRun },
        });

        // Count data to be deleted
        const sessionsRes = await query(`
            SELECT COUNT(*) as count FROM sessions s
            JOIN memberships m ON s.user_id = m.user_id
            WHERE m.org_id = $1
        `, [orgId]);
        counts.sessions = parseInt(sessionsRes.rows[0]?.count || '0', 10);

        const invitesRes = await query(`
            SELECT COUNT(*) as count FROM invites WHERE org_id = $1
        `, [orgId]);
        counts.invites = parseInt(invitesRes.rows[0]?.count || '0', 10);

        const membershipsRes = await query(`
            SELECT COUNT(*) as count FROM memberships WHERE org_id = $1
        `, [orgId]);
        counts.memberships = parseInt(membershipsRes.rows[0]?.count || '0', 10);

        if (!dryRun) {
            // Delete sessions for org users
            await query(`
                DELETE FROM sessions s
                USING memberships m
                WHERE s.user_id = m.user_id AND m.org_id = $1
            `, [orgId]);

            // Delete invites
            await query(`DELETE FROM invites WHERE org_id = $1`, [orgId]);

            // Delete memberships
            await query(`DELETE FROM memberships WHERE org_id = $1`, [orgId]);

            // Log completion
            await logSecurityEvent({
                actor_user_id: adminUserId,
                org_id: orgId,
                action: 'ORG_PURGE_COMPLETED',
                metadata: { counts },
            });
        }

        return {
            ok: true,
            orgId,
            dryRun,
            counts,
        };
    } catch (e: any) {
        console.error('[PRIVACY] Org purge failed:', e.message);
        return {
            ok: false,
            orgId,
            dryRun,
            counts,
            error: e.message,
        };
    }
}

/**
 * Check if a user is deleted.
 */
export async function isUserDeleted(userId: string): Promise<boolean> {
    const res = await query(`
        SELECT deleted_at FROM users WHERE user_id = $1
    `, [userId]);

    if (res.rows.length === 0) {
        return true; // Not found = treat as deleted
    }

    return res.rows[0].deleted_at !== null;
}
