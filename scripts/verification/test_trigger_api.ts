
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

process.env.NODE_ENV = 'development'; // Force dev mode for guards

// Load envs
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

async function main() {
    // Dynamic import of the route
    const { POST } = await import('@/app/api/admin/pipeline/trigger/route');

    console.log('Testing POST /api/admin/pipeline/trigger...');

    const orgId = '11111111-1111-4111-8111-111111111111';
    const teamId = '22222222-2222-4222-8222-222222222201';
    const userId = '33333333-3333-4333-8333-000000000001'; // Admin user

    // Mock Request
    const url = 'http://localhost:3000/api/admin/pipeline/trigger';
    const body = JSON.stringify({ teamId });

    // We need to mock the headers so requireAdminStrict passes.
    // It likely looks for cookies or X-DEV-USER-ID in dev.
    const req = new NextRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-DEV-USER-ID': userId,
            'Cookie': `inpsyq_dev_user=${userId}; inpsyq_selected_org=${orgId}`
        },
        body
    });

    try {
        const res = await POST(req);
        const data = await res.json();

        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (res.status === 200 && data.ok) {
            console.log('SUCCESS: API Route verified.');
        } else {
            console.error('FAILURE: API Route returned error.');
            process.exit(1);
        }

    } catch (err) {
        console.error('Error testing route:', err);
        process.exit(1);
    }
}

main();
