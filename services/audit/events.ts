/**
 * AUDIT EVENTS SERVICE
 * 
 * Centralized logging for compliance, consumption tracking, and security.
 */

import { query } from '@/db/client';

export type AuditEventType =
    | 'RUN_START'
    | 'RUN_COMPLETE'
    | 'INTERPRETATION_GENERATED'
    | 'INTERPRETATION_FALLBACK'
    | 'ACCESS_VIOLATION'
    | 'INTEGRITY_VIOLATION'
    | 'LIMIT_EXCEEDED';

export async function logAuditEvent(
    orgId: string,
    teamId: string | null,
    eventType: AuditEventType,
    metadata: Record<string, any>
) {
    try {
        await query(`
            INSERT INTO audit_events (org_id, team_id, event_type, metadata, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [orgId, teamId, eventType, JSON.stringify(metadata)]);
    } catch (e) {
        // Fallback: don't crash core flow if audit fails, but log to stderr
        console.error('[AUDIT FAILURE]', e);
    }
}
