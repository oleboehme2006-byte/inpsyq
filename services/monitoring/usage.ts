
import { query } from '@/db/client';

export interface UsageRecord {
    orgId: string;
    teamId: string | null;
    weekStart: string;
    inputHash: string;
    modelId: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    provider: string;
    isFallback: boolean;
}

/**
 * Log interpretation usage to DB.
 * Safe to call without awaiting (fire and forget), but better awaited in critical paths.
 */
export async function logInterpretationUsage(record: UsageRecord): Promise<void> {
    try {
        await query(`
            INSERT INTO interpretation_usage
            (org_id, team_id, week_start, input_hash, model_id, prompt_tokens, completion_tokens, total_tokens, latency_ms, provider, is_fallback, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        `, [
            record.orgId,
            record.teamId,
            record.weekStart,
            record.inputHash,
            record.modelId,
            record.promptTokens,
            record.completionTokens,
            record.promptTokens + record.completionTokens,
            record.latencyMs,
            record.provider,
            record.isFallback
        ]);
    } catch (e) {
        console.error('[Usage] Failed to log usage:', e);
        // Do not throw, monitoring failure shouldn't break app
    }
}

/**
 * Check if org has exceeded token budget for the week.
 * (Optional: can be used in addition to generation count limits)
 */
export async function checkTokenBudget(orgId: string, limit: number): Promise<boolean> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

    const res = await query(`
        SELECT SUM(total_tokens) as used
        FROM interpretation_usage
        WHERE org_id = $1 AND created_at > $2
     `, [orgId, startOfWeek]);

    const used = parseInt(res.rows[0].used || '0', 10);
    return used < limit;
}
