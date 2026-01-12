/**
 * Check Sessions Schema
 */
import './_bootstrap';
import { query } from '@/db/client';

async function main() {
    const res = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sessions'
    `);
    console.log(res.rows.map(r => r.column_name));
}

main().catch(console.error);
