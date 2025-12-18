
import { ITEM_BANK } from '../services/measurement/item_bank';
import { CONSTRUCTS } from '../services/measurement/constructs';

function run() {
    console.log(`--- Item Bank Statistics ---`);
    console.log(`Total Items: ${ITEM_BANK.length}`);

    // By Construct
    console.log(`\n[By Construct]`);
    const byConstruct: Record<string, number> = {};
    CONSTRUCTS.forEach(c => byConstruct[c] = 0);
    ITEM_BANK.forEach((i: any) => byConstruct[i.construct] = (byConstruct[i.construct] || 0) + 1);
    console.table(byConstruct);

    // By Type
    console.log(`\n[By Type]`);
    const byType: Record<string, number> = {};
    ITEM_BANK.forEach((i: any) => byType[i.type] = (byType[i.type] || 0) + 1);
    console.table(byType);

    // By Time Window
    console.log(`\n[By Window]`);
    const byWindow: Record<string, number> = {};
    ITEM_BANK.forEach((i: any) => byWindow[i.time_window] = (byWindow[i.time_window] || 0) + 1);
    console.table(byWindow);

    // By Source
    console.log(`\n[By Source]`);
    const bySource: Record<string, number> = {};
    ITEM_BANK.forEach((i: any) => bySource[i.source] = (bySource[i.source] || 0) + 1);
    console.table(bySource);
}

run();
