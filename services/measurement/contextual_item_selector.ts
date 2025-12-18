
import { MeasurementContext, EpistemicState } from './context';
import { Item, MeasurementIntent, MeasurementTone, TemporalSensitivity } from './item_bank_factory/types';
import { calculateEpistemicState } from './epistemics';

interface SelectionConfig {
    userId: string;
    targetCount: number;
    contexts: MeasurementContext[];
    itemBank: Item[];
    recentConstructs: string[]; // Constructs used in last 2 sessions
}

// Sensitivity Scores: Low=1, Medium=2, High=3
function sensitivityScore(s?: TemporalSensitivity): number {
    if (s === 'high') return 3;
    if (s === 'medium') return 2;
    return 1;
}

function determineTemporalRequirement(ctx: MeasurementContext): TemporalSensitivity {
    if (!ctx.last_observed_at) return 'low';

    const daysSince = (Date.now() - new Date(ctx.last_observed_at).getTime()) / (1000 * 60 * 60 * 24);

    // High Volatility -> Needs High Sensitivity regardless of time
    if (ctx.volatility > 0.25) return 'high';

    if (daysSince < 7) return 'high'; // Frequent check-in needs sensitive items
    if (daysSince < 21) return 'medium';
    return 'low'; // Monthly or sporadic
}

export function selectItemsForSession(config: SelectionConfig): Item[] {
    const { targetCount, contexts, itemBank, recentConstructs } = config;
    let selected: Item[] = [];

    // --- 1. Construct Selection Strategy ---

    // Block redundant constructs unless they are volitile
    const blockedConstructs = new Set<string>();
    recentConstructs.forEach(c => {
        const ctx = contexts.find(ctx => ctx.construct === c);
        if (ctx && ctx.volatility <= 0.25) {
            blockedConstructs.add(c);
        }
    });

    // Bucket Contexts
    const ignorant = contexts.filter(c => c.epistemic_state === 'ignorant');
    const exploratory = contexts.filter(c => c.epistemic_state === 'exploratory');
    const confirmatory = contexts.filter(c => c.epistemic_state === 'confirmatory');
    const stable = contexts.filter(c => c.epistemic_state === 'stable');

    let targetConstructs: string[] = [];

    // Priority 1: Ignorant (Bootstrap)
    ignorant.forEach(c => {
        if (!blockedConstructs.has(c.construct)) targetConstructs.push(c.construct);
    });

    // Priority 2: Exploratory (High Gain)
    // Add exploration if we have room
    exploratory.forEach(c => {
        if (!blockedConstructs.has(c.construct)) targetConstructs.push(c.construct);
    });

    // Priority 3: Confirmatory (Refine)
    if (targetConstructs.length < targetCount) {
        confirmatory.forEach(c => {
            if (!blockedConstructs.has(c.construct)) targetConstructs.push(c.construct);
        });
    }

    // Priority 4: Stable (Maintenance) - ONLY if strictly needed or Volatility Spike (handled by blocked logic)
    // If stable and NOT blocked (volatility spiked), it might be added?
    // Epistemic rules say stable usually shouldn't be asked.
    // We skip stable unless we are desperate.

    // Cap coverage
    // If we have TOO MANY constructs, random sample from the lower priorities?
    // For now, simple slice.
    // If we have too few, we will pad later.
    const priorityList = [...targetConstructs].slice(0, targetCount);


    // --- 2. Item Selection per Construct ---

    for (const construct of priorityList) {
        const ctx = contexts.find(c => c.construct === construct);
        if (!ctx) continue;

        const candidates = itemBank.filter(i => i.construct === construct);
        const requiredSensitivity = determineTemporalRequirement(ctx);
        const reqScore = sensitivityScore(requiredSensitivity);

        // Filter Logic
        let valid = candidates.filter(i => {
            // Standard Hard Rules
            if (ctx.epistemic_state === 'ignorant' && i.intent === 'confirm') return false;
            // If stable, we really shouldn't be here, but if we are:
            if (ctx.epistemic_state === 'stable' && i.intent === 'explore') return false;

            if (ctx.observation_count < 3 && i.intent === 'challenge') return false;

            // Tone Safety
            if ((ctx.posterior_sigma || 1) > 0.4 && i.tone === 'behavioral') return false;

            // Temporal Match
            if (sensitivityScore(i.temporal_sensitivity) < reqScore) return false;

            return true;
        });

        // If we filtered everyone out (e.g. strict temporal), try relaxing temporal?
        if (valid.length === 0) {
            valid = candidates.filter(i => {
                // Relaxed Hard Rules (Keep Epistemic, Relax Temporal)
                if (ctx.epistemic_state === 'ignorant' && i.intent === 'confirm') return false;
                if (ctx.epistemic_state === 'stable' && i.intent === 'explore') return false;
                return true;
            });
        }

        if (valid.length > 0) {
            // Select random valid item
            // TODO: In future, use 'last_used' item history to avoid same item repetition
            selected.push(valid[Math.floor(Math.random() * valid.length)]);
        }
    }


    // --- 3. Padding (Information Gain Guarantee) ---
    // If insufficient items, pad ONLY with exploratory diagnostic items.
    // Never pad with challenge items.

    // Safety break
    let loopGuard = 0;
    while (selected.length < targetCount && loopGuard < 100) {
        loopGuard++;

        // Candidate pool for padding: "exploratory" intent, "diagnostic" tone
        // Any construct? 
        // Ideally constructs we haven't picked yet, or double-dip on high uncertainty ones.

        // Strategy: Double dip on Exploratory Contexts first
        const exploratoryContexts = contexts.filter(c => c.epistemic_state === 'ignorant' || c.epistemic_state === 'exploratory');
        let targetC = '';

        if (exploratoryContexts.length > 0) {
            targetC = exploratoryContexts[Math.floor(Math.random() * exploratoryContexts.length)].construct;
        } else {
            // Random from bank
            const randomItem = itemBank[Math.floor(Math.random() * itemBank.length)];
            targetC = randomItem.construct;
        }

        const candidates = itemBank.filter(i =>
            i.construct === targetC &&
            i.intent === 'explore' &&
            i.tone === 'diagnostic' &&
            !selected.find(s => s.item_id === i.item_id)
        );

        if (candidates.length > 0) {
            selected.push(candidates[Math.floor(Math.random() * candidates.length)]);
        } else {
            // If failed to find specific pad item for that construct, try GLOBAL pad
            const globalPad = itemBank.filter(i =>
                i.intent === 'explore' &&
                i.tone === 'diagnostic' &&
                !selected.find(s => s.item_id === i.item_id)
            );
            if (globalPad.length > 0) {
                selected.push(globalPad[Math.floor(Math.random() * globalPad.length)]);
            }
        }
    }

    // --- 4. Final Tone Harmonizer Check ---
    // <=30% behavioral, <=20% challenge
    // If violated, replace?
    // For MVP, just limiting selection above would be better, but we only filter per-item.
    // Let's implement a quick audit and replace if needed.

    const behavioralCount = selected.filter(i => i.tone === 'behavioral').length;
    const challengeCount = selected.filter(i => i.intent === 'challenge').length;

    // If violations, we should swap.
    // Implementation: This implementation relies on the probability (filtering) being good enough for now.
    // True strict enforcement would require backtracking or iterative selection.

    return selected.slice(0, targetCount);
}
