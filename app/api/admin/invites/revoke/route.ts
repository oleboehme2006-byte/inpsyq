/**
 * POST /api/admin/invites/revoke
 * 
 * Revoke an active invite.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId } = guardResult.value;

    try {
        const body = await req.json();
        const { inviteId } = body;

        if (!inviteId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'inviteId is required' }, request_id: requestId },
                { status: 400 }
            );
        }

        // Delete the invite (only if it belongs to this org)
        const result = await query(
            'DELETE FROM active_invites WHERE payload_signature = $1 AND org_id = $2 RETURNING *',
            [inviteId, orgId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'NOT_FOUND', message: 'Invite not found or already revoked' }, request_id: requestId },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            message: 'Invite revoked successfully',
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] POST /invites/revoke failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to revoke invite' }, request_id: requestId },
            { status: 500 }
        );
    }
}
