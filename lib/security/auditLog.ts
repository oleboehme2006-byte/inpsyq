/**
 * Security Audit Log Module
 * 
 * Append-only logging for security-relevant events.
 * Used for compliance, incident response, and forensics.
 */

import { query } from '@/db/client';

export type AuditAction =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'SESSION_CREATED'
    | 'SESSION_REVOKED'
    | 'ROLE_CHANGED'
    | 'INVITE_CREATED'
    | 'INVITE_REVOKED'
    | 'INVITE_ACCEPTED'
    | 'WEEKLY_RUN_STARTED'
    | 'WEEKLY_RUN_COMPLETED'
    | 'WEEKLY_RUN_FAILED'
    | 'USER_DELETED'
    | 'ORG_PURGE_STARTED'
    | 'ORG_PURGE_COMPLETED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'REAUTH_REQUIRED'
    | 'RETENTION_PLAN_RUN'
    | 'RETENTION_APPLY_RUN'
    | 'RETENTION_APPLY_ABORTED'
    | 'MONITORING_CHECK_RAN';

export interface AuditLogEntry {
    actor_user_id: string | null;
    org_id: string | null;
    action: AuditAction;
    target_user_id?: string | null;
    target_team_id?: string | null;
    metadata?: Record<string, any>;
    ip_address?: string;
}

/**
 * Log a security event (append-only).
 */
export async function logSecurityEvent(entry: AuditLogEntry): Promise<void> {
    try {
        await query(`
            INSERT INTO audit_logs (
                actor_user_id,
                org_id,
                action,
                target_user_id,
                target_team_id,
                metadata,
                ip_address,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
            entry.actor_user_id,
            entry.org_id,
            entry.action,
            entry.target_user_id || null,
            entry.target_team_id || null,
            JSON.stringify(entry.metadata || {}),
            entry.ip_address || null,
        ]);
    } catch (e: any) {
        // Log to console but don't fail the main operation
        console.error('[AUDIT] Failed to log event:', entry.action, e.message);
    }
}

/**
 * Query security audit logs.
 * Supports pagination and filtering.
 */
export async function querySecurityLogs(filters: {
    org_id?: string;
    actor_user_id?: string;
    action?: AuditAction;
    since?: Date;
    limit?: number;
    offset?: number;
}): Promise<{ logs: any[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filters.org_id) {
        conditions.push(`org_id = $${paramIdx++}`);
        params.push(filters.org_id);
    }

    if (filters.actor_user_id) {
        conditions.push(`actor_user_id = $${paramIdx++}`);
        params.push(filters.actor_user_id);
    }

    if (filters.action) {
        conditions.push(`action = $${paramIdx++}`);
        params.push(filters.action);
    }

    if (filters.since) {
        conditions.push(`created_at >= $${paramIdx++}`);
        params.push(filters.since);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Count total
    const countRes = await query(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Fetch logs
    const logsRes = await query(
        `SELECT * FROM audit_logs ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, limit, offset]
    );

    return { logs: logsRes.rows, total };
}
