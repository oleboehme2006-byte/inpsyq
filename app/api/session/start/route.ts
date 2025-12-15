import { NextResponse } from 'next/server';
import { interactionEngine } from '@/services/interactionEngine';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        // Validate UUID format strictly to prevent Postgres invalid input syntax errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!userId || !uuidRegex.test(userId)) {
            return NextResponse.json({
                error: 'userId must be a valid UUID',
                hint: 'Use /api/admin/employees to search for valid users by Org ID.'
            }, { status: 400 });
        }

        const sessionData = await interactionEngine.buildSession(userId);

        return NextResponse.json(sessionData); // { sessionId, interactions: [...] }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
