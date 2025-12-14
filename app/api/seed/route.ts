import { NextResponse } from 'next/server';
import { syntheticDataGenerator } from '@/mock/syntheticDataGenerator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    // 1. Production Guard (Secure)
    if (process.env.VERCEL_ENV === 'production') {
        return NextResponse.json({
            error: 'Seeding disabled in production. Use the standalone seed script via "npm run seed:prod".'
        }, { status: 403 });
    }

    try {
        const ids = await syntheticDataGenerator.generate();
        return NextResponse.json({ success: true, ...ids });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
