import { NextResponse } from 'next/server';
import { privateFeedbackService } from '@/services/privateFeedbackService';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { userId, content } = await req.json();
        if (!userId || !content) return NextResponse.json({ error: 'Invalid Input' }, { status: 400 });

        await privateFeedbackService.submitFeedback(userId, content);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) return NextResponse.json({ error: 'UserId required' }, { status: 400 });

        // Retrieve latest employee profile recommendation
        const profileRes = await query(`
            SELECT private_recommendation FROM employee_profiles
            WHERE user_id = $1
            ORDER BY week_start DESC
            LIMIT 1
        `, [userId]);

        const feedback = [];

        if (profileRes.rows.length > 0 && profileRes.rows[0].private_recommendation) {
            feedback.push(profileRes.rows[0].private_recommendation);
        } else {
            feedback.push("Processing your latest signals. Check back next week!");
        }

        return NextResponse.json({ feedback });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
