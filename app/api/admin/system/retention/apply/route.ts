/**
 * POST /api/admin/system/retention/apply
 * 
 * Execute retention plan.
 * ADMIN only, requires fresh session and explicit confirmation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { applyRetentionPlan } from '@/lib/security/retention';
import { logSecurityEvent } from '@/lib/security/auditLog';
import { checkRateLimit, getClientIP, getRateLimitKey } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Rate limit check (destructive action)
    const ip = getClientIP(req.headers);
    const rateLimitResult = checkRateLimit('ADMIN_DESTRUCTIVE', getRateLimitKey(ip));
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' }, request_id: requestId },
            { status: 429 }
        );
    }

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { userId, orgId } = guardResult.value;

    try {
        const body = await req.json().catch(() => ({}));

        // Require explicit confirmation
        if (body.confirm !== 'APPLY') {
            return NextResponse.json(
                { ok: false, error: { code: 'CONFIRMATION_REQUIRED', message: 'Set confirm: "APPLY" to execute' }, request_id: requestId },
                { status: 400 }
            );
        }

        const targetOrgId = body.org_id || orgId;
        const limit = body.limit || 1000;

        // Apply retention
        const result = await applyRetentionPlan({
            orgId: targetOrgId,
            limit,
            actorUserId: userId,
        });

        return NextResponse.json({
            ok: true,
            result,
            request_id: requestId,
        });

    } catch (e: any) {
        // Log failure
        await logSecurityEvent({
            actor_user_id: userId,
            org_id: orgId,
            action: 'RETENTION_APPLY_ABORTED',
            metadata: { error: e.message },
        });

        console.error('[Admin] Retention apply failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to apply retention' }, request_id: requestId },
            { status: 500 }
        );
    }
}
