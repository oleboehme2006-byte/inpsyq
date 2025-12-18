
import { ITEM_BANK } from './item_bank';
import { Item, SourceType, Difficulty } from './item_bank_factory/types';
import { CONSTRUCTS, Construct } from './constructs';

export interface SelectConfig {
    constructTargets?: Construct[];
    count?: number;
    excludeIds?: string[];
}

// Runtime Hook for selecting items from the Bank
export function selectItems(config: SelectConfig): Item[] {
    const mode = process.env.ITEM_BANK_MODE === 'on';
    if (!mode) return []; // Fallback to LLM Generator if off

    const targets = config.constructTargets || [];
    let pool = ITEM_BANK.filter(i => !config.excludeIds?.includes(i.item_id));

    if (targets.length > 0) {
        pool = pool.filter(i => targets.includes(i.construct));
    }

    // Simple Random Shuffle for now
    pool = pool.sort(() => 0.5 - Math.random());

    const count = config.count || 10;
    return pool.slice(0, count);
}
