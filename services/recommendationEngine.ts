export class RecommendationEngine {

    getRecommendations(profileType: string): string[] {
        switch (profileType) {
            case 'WRP':
                return ["Increase daily syncs", "Clarify role expectations", "Celebrate small wins"];
            case 'OUC':
                return ["Reduce meeting load", "Prioritize top 3 tasks", "Offer flexible hours"];
            case 'TFP':
                return ["Organize team social", "Facilitate conflict resolution", "Transparency in decisions"];
            default:
                return ["Monitor closely"];
        }
    }

    /**
     * Generate private, individual feedback based on profile scores and specific parameter gaps.
     * returns a short, supportive, non-corporate string.
     */
    generatePrivateFeedback(
        scores: { WRP: number, OUC: number, TFP: number },
        means: Record<string, number>
    ): string {
        // High Level Checks
        if (scores.OUC > 0.6) {
            if (means['emotional_load'] > 0.7) return "You seem to be carrying a heavy load lately. It might be time to discuss prioritization.";
            if (means['control'] < 0.4) return "It feels like things are out of your hands. Focus on what you can control directly.";
            return "You're under pressure. Remember to take breaks and disconnect.";
        }

        if (scores.WRP > 0.6) {
            if (means['meaning'] < 0.4) return "You might be feeling a bit disconnected from the 'why' of your work.";
            if (means['engagement'] < 0.4) return "Energy levels seem low. Is there a task that excites you more?";
            return "It seems like you're pulling back a bit. Reconnecting with a peer might help.";
        }

        if (scores.TFP > 0.6) {
            if (means['trust_leadership'] < 0.5) return "There seems to be some friction with decisions from above.";
            return "Team dynamics feel strained. A direct conversation could clear the air.";
        }

        // Specific Parameter Checks if no high profile score
        if (means['psych_safety'] < 0.4) return "It feels risky to speak up right now. Try sharing with a trusted peer first.";
        if (means['autonomy_friction'] > 0.6) return "Processes seem to be getting in your way.";

        return "You're navigating things well. Keep balancing your energy.";
    }
}

export const recommendationEngine = new RecommendationEngine();
