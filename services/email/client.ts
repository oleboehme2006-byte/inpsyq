
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY is not set. Emails will not be sent.');
}

export const resend = new Resend(RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM || 'InPsyq <onboarding@resend.dev>';
