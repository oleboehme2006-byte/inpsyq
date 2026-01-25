import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { requireAdminStrict } from '@/lib/access/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        // ADMIN only
        const guardResult = await requireAdminStrict(req);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'user_id required' } },
                { status: 400 }
            );
        }

        const q = `
        SELECT week_start, parameter_means, parameter_uncertainty, profile_type_scores, confidence
        FROM employee_profiles
        WHERE user_id = $1
        ORDER BY week_start ASC
      `;

        const result = await query(q, [userId]);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
