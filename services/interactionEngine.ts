import { query } from '../db/client';

export class InteractionEngine {

    async getNextInteraction(userId: string) {
        // Legacy method, forwarding to session builder effectively if needed, 
        // but for the new flow we use buildSession mainly.
        // Kept for backward compat if simple flow used.
        const sess = await this.buildSession(userId);
        return sess.interactions[0];
    }

    /**
     * PROPER SESSION BUILDER
     * Returns a session ID and a list of interactions.
     */
    async buildSession(userId: string) {
        // 1. Create Session
        const sessionRes = await query(`
      INSERT INTO sessions (user_id, started_at)
      VALUES ($1, NOW())
      RETURNING session_id
    `, [userId]);
        const sessionId = sessionRes.rows[0].session_id;

        // 2. Select Interactions
        // Rules: Max 1 SLIDER (scale), Max 1 DIALOG, Total ~2-4.

        // Fetch all available interactions
        const allRes = await query(`SELECT * FROM interactions`);
        const all = allRes.rows;

        const sliders = all.filter(i => i.type === 'slider' || i.type === 'rating');
        const dialogs = all.filter(i => i.type === 'dialog');
        const others = all.filter(i => i.type !== 'slider' && i.type !== 'rating' && i.type !== 'dialog');

        const selected = [];

        // Pick 1 Slider
        if (sliders.length > 0) selected.push(sliders[Math.floor(Math.random() * sliders.length)]);

        // Pick 1 Dialog (50% chance)
        if (Math.random() > 0.5 && dialogs.length > 0) {
            selected.push(dialogs[Math.floor(Math.random() * dialogs.length)]);
        }

        // Fill rest with Text/Choice (others)
        // Target total 3
        while (selected.length < 3 && others.length > 0) {
            const pick = others[Math.floor(Math.random() * others.length)];
            // Avoid dupes
            if (!selected.find(s => s.interaction_id === pick.interaction_id)) {
                selected.push(pick);
            }
        }

        return {
            sessionId,
            interactions: selected
        };
    }

    async getInteractionById(interactionId: string) {
        const result = await query(`SELECT * FROM interactions WHERE interaction_id = $1`, [interactionId]);
        return result.rows[0];
    }
}

export const interactionEngine = new InteractionEngine();
