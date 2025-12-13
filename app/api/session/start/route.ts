import { NextResponse } from 'next/server';
import { interactionEngine } from '@/services/interactionEngine';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'UserId required' }, { status: 400 });
        }

        const sessionData = await interactionEngine.buildSession(userId);

        return NextResponse.json(sessionData); // { sessionId, interactions: [...] }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
