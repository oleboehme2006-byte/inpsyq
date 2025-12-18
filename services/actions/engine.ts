import { ValueProfile, DEFAULT_VALUES } from '../values/profile';
import { Construct } from '../measurement/constructs';

export type ActionTier = 'safe_default' | 'contextual' | 'explorative';

export interface ActionRecommendation {
    tier: ActionTier;
    title: string;
    description: string;
    target_construct: Construct;
    value_alignment_score: number; // 0-1 match with org values
}

export class ActionEngine {

    public generateActions(
        target: Construct,
        profile: ValueProfile = DEFAULT_VALUES
    ): ActionRecommendation[] {
        const actions: ActionRecommendation[] = [];

        // Example: Autonomy Actions
        if (target === 'autonomy') {
            // 1. Safe Default (Always good)
            actions.push({
                tier: 'safe_default',
                title: 'Audit Decision Rights',
                description: 'Clarify who owns which decisions in the team.',
                target_construct: 'autonomy',
                value_alignment_score: 1.0 // Universal
            });

            // 2. Contextual (Depends on High Autonomy pref)
            if (profile.autonomy_preference > 0.7) {
                actions.push({
                    tier: 'contextual',
                    title: 'Implement 20% Time',
                    description: 'Allow engineers 1 day/week for unstructured innovation.',
                    target_construct: 'autonomy',
                    value_alignment_score: profile.autonomy_preference
                });
            } else {
                actions.push({
                    tier: 'contextual',
                    title: 'Structured Delegation',
                    description: 'Delegate specific tasks with clear boundaries.',
                    target_construct: 'autonomy',
                    value_alignment_score: 1.0 - profile.autonomy_preference // Better for low-autonomy orgs
                });
            }
        }

        return actions;
    }
}

export const actionEngine = new ActionEngine();
