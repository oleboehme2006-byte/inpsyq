#!/usr/bin/env npx tsx
/**
 * Helper to trigger weekly run using loaded environment variables.
 */
import './_bootstrap';
import { getVerifyBaseUrl, fetchJson } from './_verifyBaseUrl';

const BASE_URL = getVerifyBaseUrl();
const SECRET = process.env.INTERNAL_CRON_SECRET;

async function main() {
    if (!SECRET) {
        console.error('INTERNAL_CRON_SECRET not set in env');
        process.exit(1);
    }

    console.log(`Triggering Weekly Run at ${BASE_URL}...`);

    try {
        const result = await fetchJson(
            `${BASE_URL}/api/internal/run-weekly`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cron-secret': SECRET
                },
                body: JSON.stringify({})
            },
            'trigger-run'
        );

        console.log('Success:', result.status);
        console.log(JSON.stringify(result.json, null, 2));
    } catch (e: any) {
        console.error('Failed:', e.message);
        process.exit(1);
    }
}

main();
