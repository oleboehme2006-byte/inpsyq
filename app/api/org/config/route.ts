/**
 * GET/PATCH /api/org/config
 * 
 * Read and update organization configuration.
 * Gated to EXECUTIVE and ADMIN roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgManagement } from '@/lib/access/guards';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6]; // Sun=0, Mon=1, ...

export async function GET(req: NextRequest) {
    const guardResult = await requireOrgManagement(req);
    if (!guardResult.ok) return guardResult.response;

    const { orgId } = guardResult.value;

    try {
        const result = await query(
            `SELECT name, slug, config, 
                    subscription_status, plan_id, trial_ends_at
             FROM orgs WHERE org_id = $1`,
            [orgId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } },
                { status: 404 }
            );
        }

        const org = result.rows[0];
        const config = org.config || {};

        return NextResponse.json({
            ok: true,
            org: {
                name: org.name,
                slug: org.slug,
                weekStartDay: config.week_start_day ?? 1, // Default Monday
                pulseTime: config.pulse_time ?? '09:00',
                timezone: config.timezone ?? 'Europe/Berlin',
                subscriptionStatus: org.subscription_status ?? 'trialing',
                planId: org.plan_id ?? 'free_trial',
                trialEndsAt: org.trial_ends_at,
            },
        });
    } catch (e: any) {
        console.error('[Org] GET /config failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch config' } },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    const guardResult = await requireOrgManagement(req);
    if (!guardResult.ok) return guardResult.response;

    const { orgId } = guardResult.value;

    try {
        const body = await req.json();
        const { weekStartDay, pulseTime, timezone } = body;

        // Get current config
        const current = await query('SELECT config FROM orgs WHERE org_id = $1', [orgId]);
        const config = current.rows[0]?.config || {};

        // Validate and merge updates
        if (weekStartDay !== undefined) {
            if (!VALID_WEEK_DAYS.includes(weekStartDay)) {
                return NextResponse.json(
                    { ok: false, error: { code: 'VALIDATION_ERROR', message: 'weekStartDay must be 0-6 (Sun-Sat)' } },
                    { status: 400 }
                );
            }
            config.week_start_day = weekStartDay;
        }

        if (pulseTime !== undefined) {
            if (typeof pulseTime !== 'string' || !/^\d{2}:\d{2}$/.test(pulseTime)) {
                return NextResponse.json(
                    { ok: false, error: { code: 'VALIDATION_ERROR', message: 'pulseTime must be HH:MM format' } },
                    { status: 400 }
                );
            }
            config.pulse_time = pulseTime;
        }

        if (timezone !== undefined) {
            if (typeof timezone !== 'string' || timezone.length < 2) {
                return NextResponse.json(
                    { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid timezone' } },
                    { status: 400 }
                );
            }
            config.timezone = timezone;
        }

        await query(
            'UPDATE orgs SET config = $1 WHERE org_id = $2',
            [JSON.stringify(config), orgId]
        );

        return NextResponse.json({ ok: true, config, message: 'Configuration updated' });
    } catch (e: any) {
        console.error('[Org] PATCH /config failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update config' } },
            { status: 500 }
        );
    }
}
