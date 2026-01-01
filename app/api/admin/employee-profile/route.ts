import { NextResponse } from 'next/server';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
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
