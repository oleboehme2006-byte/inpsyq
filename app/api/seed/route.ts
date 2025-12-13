import { NextResponse } from 'next/server';
import { syntheticDataGenerator } from '@/mock/syntheticDataGenerator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const ids = await syntheticDataGenerator.generate();
        return NextResponse.json({ success: true, ...ids });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
