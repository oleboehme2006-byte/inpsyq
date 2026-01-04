/**
 * EMAIL TRANSPORT — Abstraction for email sending
 * 
 * Supports multiple providers:
 * - ResendTransport: Uses Resend API
 * - DisabledTransport: No-op (for local development)
 * - TestTransport: In-memory outbox for tests
 */

export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface EmailTransport {
    send(message: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }>;
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

    async send(message: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> {
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
    async send(message: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> {
        console.log('[EMAIL] Disabled - would send to:', message.to, 'subject:', message.subject);
        return { ok: true, id: 'disabled' };
    }
}

// =============================================================================
// Test Transport (In-memory outbox for tests)
// =============================================================================

interface TestMail extends EmailMessage {
    sentAt: Date;
}

const testOutbox: TestMail[] = [];

class TestTransport implements EmailTransport {
    async send(message: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> {
        const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        testOutbox.push({ ...message, sentAt: new Date() });
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
 * Get the configured email transport.
 */
export function getEmailTransport(): EmailTransport {
    if (transportInstance) {
        return transportInstance;
    }

    const provider = process.env.EMAIL_PROVIDER || 'disabled';

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

    console.log(`[EMAIL] Using ${provider} transport`);
    return transportInstance;
}

/**
 * Send a magic link email.
 */
export async function sendMagicLinkEmail(
    email: string,
    token: string,
    expiresAt: Date
): Promise<{ ok: boolean; error?: string }> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3001';
    const consumeUrl = `${baseUrl}/api/auth/consume?token=${encodeURIComponent(token)}`;

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
