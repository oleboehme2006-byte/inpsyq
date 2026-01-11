/**
 * REQUEST LINK API — Request Magic Link for Login
 * 
 * POST /api/auth/request-link
 * Body: { email: string }
 * 
 * Validates invite-only access, creates login token, sends email.
 * Always returns { ok: true } to prevent account enumeration.
 * 
 * SAFETY FEATURES:
 * - Preview deployments: Email sending disabled
 * - Origin validation: Ensures canonical production domain
 */

import { NextResponse } from 'next/server';
import { normalizeEmail, createLoginToken, isEmailAllowed } from '@/lib/auth/loginToken';
import { sendMagicLinkEmail } from '@/services/email/transport';
import { isProduction } from '@/lib/env/appEnv';
import { assertPublicOriginValid, getPublicOrigin } from '@/lib/env/publicOrigin';
import { createHash } from 'crypto';

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

/**
 * Check if email sending should be suppressed.
 * Preview deployments and staging MUST NOT send real emails.
 */
function shouldSuppressEmail(): { suppress: boolean; reason: string } {
    const vercelEnv = process.env.VERCEL_ENV;
    const appEnv = process.env.APP_ENV;

    // Preview deployments: NEVER send real emails
    if (vercelEnv === 'preview') {
        return { suppress: true, reason: 'VERCEL_ENV=preview' };
    }

    // Staging: NEVER send real emails
    if (appEnv === 'staging') {
        return { suppress: true, reason: 'APP_ENV=staging' };
    }

    // Check EMAIL_PROVIDER
    const provider = process.env.EMAIL_PROVIDER;
    if (!provider || provider === 'disabled') {
        return { suppress: true, reason: 'EMAIL_PROVIDER=disabled' };
    }

    return { suppress: false, reason: '' };
}

export async function POST(req: Request) {
    const requestId = crypto.randomUUID();
    const vercelEnv = process.env.VERCEL_ENV || 'unknown';

    try {
        // In production, validate origin configuration
        if (isProduction()) {
            try {
                assertPublicOriginValid();
            } catch (e: any) {
                console.error(`[AUTH] Origin misconfigured: ${e.message}`);
                return NextResponse.json(
                    { error: 'Configuration error', code: 'ORIGIN_MISCONFIGURED', request_id: requestId },
                    { status: 500 }
                );
            }
        }

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
        const emailHash = createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 12);

        // Get IP for rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // Rate limit by email AND IP
        const emailLimited = !checkRateLimit(`email:${normalizedEmail}`);
        const ipLimited = !checkRateLimit(`ip:${ip}`);

        if (emailLimited || ipLimited) {
            // Still return ok to prevent enumeration
            console.log(`[AUTH] Rate limited: emailHash=${emailHash} ip=${ip}`);
            return NextResponse.json({ ok: true, request_id: requestId });
        }

        // Check if email is allowed (has invite or membership)
        const allowCheck = await isEmailAllowed(normalizedEmail);

        if (!allowCheck.allowed) {
            // Log but still return ok to prevent enumeration
            console.log(`[AUTH] Request-link denied for unknown email: hash=${emailHash}`);
            return NextResponse.json({ ok: true, request_id: requestId });
        }

        // Create login token
        const { token, expiresAt } = await createLoginToken({
            email: normalizedEmail,
            orgId: allowCheck.orgId,
            role: allowCheck.role,
            ip,
        });

        // Check if email should be suppressed
        const suppressCheck = shouldSuppressEmail();
        if (suppressCheck.suppress) {
            console.log(`[AUTH] EMAIL_SUPPRESSED: reason=${suppressCheck.reason} emailHash=${emailHash} vercel_env=${vercelEnv}`);
            // Return success but don't send email
            return NextResponse.json({ ok: true, request_id: requestId });
        }

        // Log origin info for debugging
        const originInfo = getPublicOrigin(new Headers(req.headers));
        console.log(`[AUTH] Sending magic link: origin=${originInfo.origin} source=${originInfo.source} enforced=${originInfo.enforced}`);

        // Send email
        const emailResult = await sendMagicLinkEmail(normalizedEmail, token, expiresAt);

        if (!emailResult.ok) {
            console.error(`[AUTH] Failed to send magic link email: ${emailResult.error}`);
            // Still return ok - don't leak internal errors
        } else {
            console.log(`[AUTH] Magic link sent to hash=${emailHash} (source: ${allowCheck.source})`);
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

