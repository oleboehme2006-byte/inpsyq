export class RecommendationEngine {
    // Rule-based engine
    getRecommendations(profileType: string) {
        switch (profileType) {
            case 'WRP':
                return [
                    "Initiate 'meaning' based reflection session.",
                    "Review friction points in autonomy."
                ];
            case 'OUC':
                return [
                    "Reduce workload temporarily.",
                    "Increase decision-making latitude."
                ];
            case 'TFP':
                return [
                    "Schedule team building activity.",
                    "Leadership trust building workshop."
                ];
            default:
                return [];
        }
    }
}

export const recommendationEngine = new RecommendationEngine();
