
import './_bootstrap';
import { query } from '@/db/client';

async function main() {
    console.log('Checking measurements table schema...');

    const res = await query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'measurements'`
    );

    console.log(res.rows);
}

main().catch(console.error);
