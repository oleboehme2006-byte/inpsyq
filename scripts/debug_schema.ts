
import './_bootstrap';
import { query } from '@/db/client';

async function debugSchema() {
    const tables = ['weekly_interpretations'];

    for (const table of tables) {
        console.log(`\nInspecting ${table}...`);
        try {
            const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
            if (res.rows.length === 0) {
                console.log(`[NOT FOUND] Table '${table}' does not exist.`);
            } else {
                console.table(res.rows);
            }
        } catch (e) {
            console.error(`Error checking ${table}:`, e);
        }
    }
}

debugSchema().catch(e => {
    console.error(e);
    process.exit(1);
});
