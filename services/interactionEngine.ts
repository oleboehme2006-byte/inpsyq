import { query } from '../db/client';

export class InteractionEngine {
    /**
     * Retrieves the next interaction for a user.
     * In a real system, this would be complex. Here we pick random ones or sequenced ones.
     */
    async getNextInteraction(userId: string) {
        // Basic logic: Get a random interaction that isn't in cooldown.
        // Simplifying: just get a random rating interaction for now.

        const result = await query(`
      SELECT * FROM interactions 
      ORDER BY RANDOM() 
      LIMIT 1
    `);

        return result.rows[0];
    }

    async getInteractionById(interactionId: string) {
        const result = await query(`SELECT * FROM interactions WHERE interaction_id = $1`, [interactionId]);
        return result.rows[0];
    }
}

export const interactionEngine = new InteractionEngine();
