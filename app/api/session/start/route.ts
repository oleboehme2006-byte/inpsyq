import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { interactionEngine } from '@/services/interactionEngine';
import { COOLDOWN_DAYS } from '@/lib/constants';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json(); // In real app, from auth token

        if (!userId) { // For demo, we might need to create a dummy user logic if not provided
            // But scope says "Authentication logic" is NOT to be implemented.
            // Assuming the UI will pass a userId (e.g., from a URL param or local storage mock)
            return NextResponse.json({ error: 'UserId required' }, { status: 400 });
        }

        // Check for recent session cooldown?
        // "cool down days" applies to specific interactions, but maybe we enforce global session limit?
        // Requirement says "interactions... cooldown_days".
        // Let's just start a session.

        const interaction = await interactionEngine.getNextInteraction(userId);

        const sessionRes = await query(`
      INSERT INTO sessions (user_id, started_at)
      VALUES ($1, NOW())
      RETURNING session_id
    `, [userId]);

        const sessionId = sessionRes.rows[0].session_id;

        return NextResponse.json({
            sessionId,
            interaction
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
