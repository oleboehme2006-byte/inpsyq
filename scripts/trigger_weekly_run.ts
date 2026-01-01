#!/usr/bin/env npx tsx
/**
 * Helper to trigger weekly run using loaded environment variables.
 */
import './_bootstrap';
import './_bootstrap';
import { BASE_URL } from './_verifyBaseUrl';

const SECRET = process.env.INTERNAL_CRON_SECRET;

async function main() {
    if (!SECRET) {
        console.error('INTERNAL_CRON_SECRET not set in env');
        process.exit(1);
    }

    console.log(`Triggering Weekly Run at ${BASE_URL}...`);

    try {
        const res = await fetch(
            `${BASE_URL}/api/internal/run-weekly`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cron-secret': SECRET
                },
                body: JSON.stringify({})
            }
        );

        const json = await res.json();

        console.log('Success:', res.status);
        console.log(JSON.stringify(json, null, 2));

        if (!res.ok) {
            process.exit(1);
        }
    } catch (e: any) {
        console.error('Failed:', e.message);
        process.exit(1);
    }
}

main();
