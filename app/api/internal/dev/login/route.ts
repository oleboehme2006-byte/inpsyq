import { NextResponse } from 'next/server';

/**
 * DEV ONLY: Login for browser validation
 * 
 * Sets the 'inpsyq_dev_user' cookie to allow browser-based testing 
 * without injecting custom headers.
 */
export async function POST(req: Request) {
    // 1. Strict Dev Gate
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    try {
        // GATE: Only allow in development
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json(
                { error: 'Not Found' }, // Mimic 404 to avoid leaking existence
                { status: 404 }
            );
        }

        const { user_id } = await req.json();

        // 2. Validate UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!user_id || !uuidRegex.test(user_id)) {
            return NextResponse.json({ error: 'Invalid UUID' }, { status: 400 });
        }

        // 3. Set Cookie
        // Note: HttpOnly is critical so client JS can't mess with it (simulating secure session)
        // SameSite=Lax is ample for local dev navigation
        const response = NextResponse.json({ ok: true, user_id });

        // Construct cookie string manually or use Next.js cookies() API? 
        // NextResponse.cookies is the modern way but basic Set-Cookie header works universally.
        // Let's use the response.cookies API if available in this Next.js version, 
        // fallback to header if needed. But NextResponse supports .cookies.set().

        response.cookies.set({
            name: 'inpsyq_dev_user',
            value: user_id,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        });

        return response;

    } catch (e) {
        return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }
}

export const dynamic = 'force-dynamic';
