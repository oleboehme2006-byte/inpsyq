
import './_bootstrap';
import { query } from '@/db/client';

async function debugSchema() {
    console.log('Inspecting weekly_locks...');
    try {
        const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'weekly_locks'`);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}

debugSchema().catch(e => {
    console.error(e);
    process.exit(1);
});
