/**
 * REQUEST LINK API — Request Magic Link for Login
 * 
 * POST /api/auth/request-link
 * Body: { email: string }
 * 
 * Validates invite-only access, creates login token, sends email.
 * Always returns { ok: true } to prevent account enumeration.
 */

import { NextResponse } from 'next/server';
import { normalizeEmail, createLoginToken, isEmailAllowed } from '@/lib/auth/loginToken';
import { sendMagicLinkEmail } from '@/services/email/transport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting (per-process, resets on restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per email/IP

function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count++;
    return true;
}

export async function POST(req: Request) {
    const requestId = crypto.randomUUID();

    try {
        const body = await req.json();
        const email = body.email;

        // Validate email format
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Valid email is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        const normalizedEmail = normalizeEmail(email);

        // Get IP for rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // Rate limit by email AND IP
        const emailLimited = !checkRateLimit(`email:${normalizedEmail}`);
        const ipLimited = !checkRateLimit(`ip:${ip}`);

        if (emailLimited || ipLimited) {
            // Still return ok to prevent enumeration
            console.log(`[AUTH] Rate limited: email=${normalizedEmail} ip=${ip}`);
            return NextResponse.json({ ok: true, request_id: requestId });
        }

        // Check if email is allowed (has invite or membership)
        const allowCheck = await isEmailAllowed(normalizedEmail);

        if (!allowCheck.allowed) {
            // Log but still return ok to prevent enumeration
            console.log(`[AUTH] Request-link denied for unknown email: ${normalizedEmail}`);
            return NextResponse.json({ ok: true, request_id: requestId });
        }

        // Create login token
        const { token, expiresAt } = await createLoginToken({
            email: normalizedEmail,
            orgId: allowCheck.orgId,
            role: allowCheck.role,
            ip,
        });

        // Send email
        const emailResult = await sendMagicLinkEmail(normalizedEmail, token, expiresAt);

        if (!emailResult.ok) {
            console.error(`[AUTH] Failed to send magic link email: ${emailResult.error}`);
            // Still return ok - don't leak internal errors
        } else {
            console.log(`[AUTH] Magic link sent to ${normalizedEmail} (source: ${allowCheck.source})`);
        }

        return NextResponse.json({ ok: true, request_id: requestId });

    } catch (error: any) {
        console.error('[API] /auth/request-link failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}
