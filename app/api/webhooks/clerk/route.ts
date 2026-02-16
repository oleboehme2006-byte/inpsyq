
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { query } from '@/db/client';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        // If secret is missing, we can't verify source. Fail safely.
        console.error('[CLERK] WEBHOOK_SECRET is not set in .env.local');
        return new Response('Error occured -- no svix secret', { status: 500 });
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', { status: 400 });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', { status: 400 });
    }

    // Handle User Creation and Updates
    const eventType = evt.type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
            console.warn(`[CLERK] User ${id} has no email`);
            return new Response('No email', { status: 200 });
        }

        const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || email.split('@')[0];

        try {
            await query('BEGIN');

            const existingByClerk = await query('SELECT user_id FROM users WHERE clerk_id = $1', [id]);

            if (existingByClerk.rows.length > 0) {
                await query('UPDATE users SET name = $2, email = $3 WHERE clerk_id = $1', [id, name, email]);
            } else {
                const existingByEmail = await query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [email]);

                if (existingByEmail.rows.length > 0) {
                    console.log(`[CLERK] Linking existing user ${email} to Clerk ID ${id}`);
                    await query('UPDATE users SET clerk_id = $1, name = $3 WHERE user_id = $2', [id, existingByEmail.rows[0].user_id, name]);
                } else {
                    console.log(`[CLERK] Creating new user ${email} (${id})`);
                    await query('INSERT INTO users (clerk_id, email, name) VALUES ($1, $2, $3)', [id, email, name]);
                }
            }

            await query('COMMIT');
        } catch (e: any) {
            await query('ROLLBACK');
            console.error('[CLERK] Sync failed:', e.message);
            return new Response('Db error', { status: 500 });
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        try {
            // We don't delete the user to keep historical data, 
            // but we clear the clerk_id so they are "de-authenticated"
            console.log(`[CLERK] User ${id} deleted in Clerk. Unlinking in DB.`);
            await query('UPDATE users SET clerk_id = NULL WHERE clerk_id = $1', [id]);
        } catch (e: any) {
            console.error('[CLERK] Delete sync failed:', e.message);
            return new Response('Db error', { status: 500 });
        }
    }

    return new Response('', { status: 200 });
}
