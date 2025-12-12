import { query } from '../db/client';

export class PrivateFeedbackService {
    async submitFeedback(userId: string, content: string) {
        // In a real system, this would be encrypted or anonymized more rigorously.
        // For Foundation: Just insert.

        // week start current Monday
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        await query(`
            INSERT INTO private_feedback (user_id, week_start, content)
            VALUES ($1, $2, $3)
        `, [userId, weekStart, content]);
    }
}

export const privateFeedbackService = new PrivateFeedbackService();
