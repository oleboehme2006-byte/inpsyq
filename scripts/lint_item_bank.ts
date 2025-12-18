
import { ITEM_BANK } from '../services/measurement/item_bank';
import { validateItem } from '../services/measurement/item_bank_factory/validators';

function run() {
    console.log(`--- Item Bank Linting ---`);
    console.log(`Items: ${ITEM_BANK.length}`);

    let failures = 0;

    ITEM_BANK.forEach(item => {
        const val = validateItem(item);
        if (!val.valid) {
            console.error(`[FAIL] ${item.item_id}: ${val.errors.join(', ')}`);
            failures++;
        } else if (val.warnings.length > 0) {
            // Optional: Log warnings?
            // console.warn(`[WARN] ${item.item_id}: ${val.warnings.join(', ')}`);
        }
    });

    if (failures > 0) {
        console.error(`\n❌ Lint Failed: ${failures} invalid items found.`);
        process.exit(1);
    } else {
        console.log(`\n✅ Lint Passed. All items valid.`);
        process.exit(0);
    }
}

run();
