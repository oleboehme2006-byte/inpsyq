import { query } from '@/db/client';

export class SessionHistoryService {

    async getLastPrompts(userId: string, limit: number = 50): Promise<string[]> {
        // Fetch prompts from interactions used in user's sessions
        const res = await query(`
            SELECT i.prompt_text 
            FROM interactions i
            JOIN responses r ON r.interaction_id = i.interaction_id
            JOIN sessions s ON r.session_id = s.session_id
            WHERE s.user_id = $1
            ORDER BY s.started_at DESC
            LIMIT $2
        `, [userId, limit]);

        return res.rows.map(r => r.prompt_text);
    }

    normalizeFingerprint(text: string): Set<string> {
        // Lowercase, strip punctuation, tokenize by whitespace
        const clean = text.toLowerCase().replace(/[^\w\s]/g, '');
        const tokens = clean.split(/\s+/).filter(t => t.length > 2); // Ignore short words
        return new Set(tokens);
    }

    calculateJaccard(textA: string, textB: string): number {
        const setA = this.normalizeFingerprint(textA);
        const setB = this.normalizeFingerprint(textB);

        if (setA.size === 0 || setB.size === 0) return 0;

        const intersection = new Set(Array.from(setA).filter(x => setB.has(x)));
        const union = new Set([...Array.from(setA), ...Array.from(setB)]);

        return intersection.size / union.size;
    }

    isTooSimilar(newPrompt: string, history: string[], threshold: number = 0.75): boolean {
        // Quick exact check
        if (history.includes(newPrompt)) return true;

        // Jaccard check
        for (const past of history) {
            if (this.calculateJaccard(newPrompt, past) > threshold) {
                return true;
            }
        }
        return false;
    }
}

export const historyService = new SessionHistoryService();
