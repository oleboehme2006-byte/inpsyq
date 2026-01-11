/**
 * EMAIL TRANSPORT — Abstraction for email sending
 * 
 * Supports multiple providers:
 * - ResendTransport: Uses Resend API
 * - DisabledTransport: No-op (for local development)
 * - TestTransport: File-based outbox for verification scripts
 * 
 * CRITICAL: Magic links MUST use getPublicOriginUrl() for canonical origins.
 * Preview/staging deployments have last-mile email suppression.
 * 
 * PHASE 36.4: Email links point to /auth/consume (confirm page), NOT /api/auth/consume.
 */

import { getPublicOriginUrl, getPublicOrigin } from '@/lib/env/publicOrigin';
import { isProduction, isStaging } from '@/lib/env/appEnv';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface EmailResult {
    ok: boolean;
    id?: string;
    error?: string;
    suppressed?: boolean;
    suppressedReason?: string;
}

export interface EmailTransport {
    send(message: EmailMessage): Promise<EmailResult>;
}

// =============================================================================
// Resend Transport
// =============================================================================

class ResendTransport implements EmailTransport {
    private apiKey: string;
    private from: string;

    constructor() {
        this.apiKey = process.env.RESEND_API_KEY || '';
        this.from = process.env.EMAIL_FROM || 'InPsyq <no-reply@inpsyq.com>';

        if (!this.apiKey) {
            console.warn('[EMAIL] RESEND_API_KEY not set - emails will fail');
        }
    }

    async send(message: EmailMessage): Promise<EmailResult> {
        if (!this.apiKey) {
            return { ok: false, error: 'RESEND_API_KEY not configured' };
        }

        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.from,
                    to: [message.to],
                    subject: message.subject,
                    html: message.html,
                    text: message.text,
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('[EMAIL] Resend error:', errorData);
                return { ok: false, error: `Resend API error: ${response.status}` };
            }

            const data = await response.json() as { id: string };
            return { ok: true, id: data.id };
        } catch (e: any) {
            console.error('[EMAIL] Send failed:', e.message);
            return { ok: false, error: e.message };
        }
    }
}

// =============================================================================
// Disabled Transport (No-op)
// =============================================================================

class DisabledTransport implements EmailTransport {
    async send(message: EmailMessage): Promise<EmailResult> {
        console.log('[EMAIL] Disabled - would send to:', message.to, 'subject:', message.subject);
        return { ok: true, id: 'disabled' };
    }
}

// =============================================================================
// Test Transport (File-based outbox for verification scripts)
// =============================================================================

interface TestMail extends EmailMessage {
    sentAt: Date;
}

const testOutbox: TestMail[] = [];

class TestTransport implements EmailTransport {
    async send(message: EmailMessage): Promise<EmailResult> {
        const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const mail: TestMail = { ...message, sentAt: new Date() };
        testOutbox.push(mail);

        // Write to file for verification scripts
        try {
            const outboxDir = path.join(process.cwd(), 'artifacts', 'email_outbox');
            fs.mkdirSync(outboxDir, { recursive: true });

            // Extract magic link from HTML (Phase 36.4: now /auth/consume, not /api/auth/consume)
            const linkMatch = message.html.match(/href="([^"]*\/auth\/consume[^"]*)"/);
            const extractedLink = linkMatch ? linkMatch[1] : null;

            // Parse URL components
            let parsedUrl: URL | null = null;
            let urlComponents: any = null;
            if (extractedLink) {
                try {
                    parsedUrl = new URL(extractedLink);
                    urlComponents = {
                        protocol: parsedUrl.protocol,
                        host: parsedUrl.host,
                        pathname: parsedUrl.pathname,
                        token: parsedUrl.searchParams.get('token'),
                        tokenLength: parsedUrl.searchParams.get('token')?.length || 0,
                    };
                } catch { /* invalid URL */ }
            }

            const outboxFile = path.join(outboxDir, 'last_magic_link.json');
            fs.writeFileSync(outboxFile, JSON.stringify({
                id,
                sentAt: new Date().toISOString(),
                to: message.to.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
                subject: message.subject,
                extractedLink,
                urlComponents,
                textPreview: message.text?.substring(0, 200),
            }, null, 2));

            console.log(`[EMAIL] Test transport wrote to ${outboxFile}`);
        } catch (e: any) {
            console.error('[EMAIL] Failed to write test outbox:', e.message);
        }

        return { ok: true, id };
    }
}

/**
 * Get the test outbox (for verification scripts).
 */
export function getTestOutbox(): TestMail[] {
    return [...testOutbox];
}

/**
 * Clear the test outbox.
 */
export function clearTestOutbox(): void {
    testOutbox.length = 0;
}

// =============================================================================
// Factory
// =============================================================================

let transportInstance: EmailTransport | null = null;

/**
 * Get the effective email provider (after override).
 */
export function getEffectiveEmailProvider(): string {
    const configured = process.env.EMAIL_PROVIDER || 'disabled';
    const vercelEnv = process.env.VERCEL_ENV;

    // Preview deployments: FORCE disabled
    if (vercelEnv === 'preview') {
        return 'disabled';
    }

    // Staging: FORCE disabled
    if (isStaging()) {
        return 'disabled';
    }

    return configured;
}

/**
 * Get the configured email transport.
 */
export function getEmailTransport(): EmailTransport {
    if (transportInstance) {
        return transportInstance;
    }

    const provider = getEffectiveEmailProvider();

    switch (provider) {
        case 'resend':
            transportInstance = new ResendTransport();
            break;
        case 'test':
            transportInstance = new TestTransport();
            break;
        case 'disabled':
        default:
            transportInstance = new DisabledTransport();
            break;
    }

    console.log(`[EMAIL] Using ${provider} transport (configured: ${process.env.EMAIL_PROVIDER}, vercel_env: ${process.env.VERCEL_ENV})`);
    return transportInstance;
}

/**
 * Check if email should be suppressed (last-mile check).
 */
export function shouldSuppressEmail(): { suppress: boolean; reason: string } {
    const vercelEnv = process.env.VERCEL_ENV;

    // Preview: ALWAYS suppress (even if resend somehow configured)
    if (vercelEnv === 'preview') {
        return { suppress: true, reason: 'VERCEL_ENV=preview' };
    }

    // Staging: ALWAYS suppress
    if (isStaging()) {
        return { suppress: true, reason: 'APP_ENV=staging' };
    }

    // Disabled provider
    if (getEffectiveEmailProvider() === 'disabled') {
        return { suppress: true, reason: 'EMAIL_PROVIDER=disabled' };
    }

    return { suppress: false, reason: '' };
}

/**
 * Send a magic link email.
 * 
 * CRITICAL: Uses getPublicOriginUrl() for canonical origin - NEVER VERCEL_URL.
 * PHASE 36.4: Links to /auth/consume (confirm page), NOT /api/auth/consume.
 */
export async function sendMagicLinkEmail(
    email: string,
    token: string,
    expiresAt: Date
): Promise<EmailResult> {
    // INVARIANT: Token must exist and be non-trivial
    if (!token || token.length < 20) {
        console.error(`[EMAIL] INVARIANT VIOLATION: token missing or too short (length=${token?.length || 0})`);
        return { ok: false, error: 'INVARIANT_TOKEN_MISSING' };
    }

    // Last-mile suppression check
    const suppressCheck = shouldSuppressEmail();
    if (suppressCheck.suppress) {
        console.log(`[EMAIL] SUPPRESSED: ${suppressCheck.reason}`);
        return { ok: true, suppressed: true, suppressedReason: suppressCheck.reason };
    }

    // Get canonical origin (NEVER uses VERCEL_URL)
    const originInfo = getPublicOrigin();
    const baseUrl = originInfo.origin;

    // Log origin for debugging
    console.log(`[EMAIL] Magic link origin: ${baseUrl} (source: ${originInfo.source}, enforced: ${originInfo.enforced})`);

    // PHASE 36.4: Link to confirm page, NOT direct API
    const consumeUrl = `${baseUrl}/auth/consume?token=${encodeURIComponent(token)}`;

    const expiresInMinutes = Math.round((expiresAt.getTime() - Date.now()) / 60000);

    const transport = getEmailTransport();
    return transport.send({
        to: email,
        subject: 'Your InPsyq Login Link',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Login to InPsyq</h2>
                <p>Click the link below to log in. This link expires in ${expiresInMinutes} minutes.</p>
                <p style="margin: 24px 0;">
                    <a href="${consumeUrl}" 
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Log In
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                    If you didn't request this email, you can safely ignore it.
                </p>
                <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #999; font-size: 12px;">
                    This link can only be used once and will expire at ${expiresAt.toISOString()}.
                </p>
            </div>
        `,
        text: `Login to InPsyq\n\nClick here to log in: ${consumeUrl}\n\nThis link expires in ${expiresInMinutes} minutes.`,
    });
}
