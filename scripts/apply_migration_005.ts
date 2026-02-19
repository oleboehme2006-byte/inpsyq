
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// 1. Load Environment Variables (Manual shim for standalone execution)
const loadEnv = () => {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        console.log('[Migrate] Loading .env.local...');
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } else {
        console.log('[Migrate] No .env.local found. Relying on process.env.');
    }

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        console.error('[Migrate] Error: DATABASE_URL is missing.');
        process.exit(1);
    }
};

loadEnv();

async function main() {
    console.log('[Migrate] Applying db/migrations/005_org_stats.sql...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        try {
            const sqlPath = path.resolve(process.cwd(), 'db/migrations/005_org_stats.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');

            console.log('[Migrate] Executing SQL...');
            await client.query(sql);
            console.log('[Migrate] SUCCESS: Migration applied.');
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('[Migrate] FAILED', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
