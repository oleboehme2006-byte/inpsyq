/**
 * GET  /api/user/tutorial-status   — returns { seen: TutorialSeen }
 * PATCH /api/user/tutorial-status  — body { track: TutorialTrack }, marks track as seen
 *
 * Protected: requires authenticated session (Clerk or dev header).
 * Public tutorial pages at /tutorial/* bypass this API entirely.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type TutorialTrack = 'executive' | 'teamlead' | 'employee' | 'admin';

export interface TutorialSeen {
    executive: boolean;
    teamlead: boolean;
    employee: boolean;
    admin: boolean;
}

const VALID_TRACKS: TutorialTrack[] = ['executive', 'teamlead', 'employee', 'admin'];

async function resolveUserId(req: NextRequest): Promise<string | null> {
    // Dev mode: accept X-DEV-USER-ID header or inpsyq_dev_user cookie
    if (process.env.NODE_ENV === 'development') {
        const devHeader = req.headers.get('x-dev-user-id');
        if (devHeader) return devHeader;

        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/inpsyq_dev_user=([^;]+)/);
        if (match?.[1]) return match[1];
    }

    // Production: Clerk userId (clerk_id), then resolve internal user_id
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const res = await query(`SELECT user_id FROM users WHERE clerk_id = $1`, [clerkId]);
    return res.rows[0]?.user_id ?? null;
}

export async function GET(req: NextRequest) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
        }

        const res = await query(
            `SELECT tutorial_seen FROM users WHERE user_id = $1`,
            [userId]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
        }

        const seen: TutorialSeen = res.rows[0].tutorial_seen ?? {
            executive: false, teamlead: false, employee: false, admin: false,
        };

        return NextResponse.json({ ok: true, seen });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
        }

        let body: { track?: string } = {};
        try {
            const text = await req.text();
            if (text) body = JSON.parse(text);
        } catch {
            return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
        }

        const track = body.track as TutorialTrack;
        if (!track || !VALID_TRACKS.includes(track)) {
            return NextResponse.json(
                { ok: false, error: `track must be one of: ${VALID_TRACKS.join(', ')}` },
                { status: 400 }
            );
        }

        await query(
            `UPDATE users
             SET tutorial_seen = COALESCE(tutorial_seen, '{}'::jsonb) || jsonb_build_object($2, true)
             WHERE user_id = $1`,
            [userId, track]
        );

        return NextResponse.json({ ok: true, track });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
