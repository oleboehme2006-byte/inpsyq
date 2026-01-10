/**
 * POST /api/admin/system/retention/plan
 * 
 * Compute retention plan (dry-run only).
 * ADMIN only, no side effects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { computeRetentionPlan } from '@/lib/security/retention';
import { logSecurityEvent } from '@/lib/security/auditLog';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { userId, orgId } = guardResult.value;

    try {
        const body = await req.json().catch(() => ({}));
        const targetOrgId = body.org_id || orgId;
        const limit = body.limit || 1000;

        // Compute plan
        const plan = await computeRetentionPlan({
            orgId: targetOrgId,
            limit,
        });

        // Log the action
        await logSecurityEvent({
            actor_user_id: userId,
            org_id: targetOrgId,
            action: 'RETENTION_PLAN_RUN',
            metadata: {
                counts: plan.counts,
                limit,
            },
        });

        return NextResponse.json({
            ok: true,
            plan,
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] Retention plan failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to compute retention plan' }, request_id: requestId },
            { status: 500 }
        );
    }
}
