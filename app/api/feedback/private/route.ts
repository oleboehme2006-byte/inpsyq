import { NextResponse } from 'next/server';
import { privateFeedbackService } from '@/services/privateFeedbackService';

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
