import { Construct } from '../measurement/constructs';
import { ConstructEdge, OntologyNode } from './types';

// Hard-coded Directed Acyclic Graph of Organizational Psychology
// Layer 1: Inputs (Resources/Demands)
// Layer 2: States (Psychological Experience)
// Layer 3: Outcomes (Engagement/Burnout/Performance proxies)

export const CAUSAL_EDGES: ConstructEdge[] = [
    // --- FROM ROLE CLARITY ---
    { source: 'role_clarity', target: 'psychological_safety', type: 'contributes_to', strength: 0.6, description: 'Knowing what to do reduces anxiety and interpersonal risk.' },
    { source: 'role_clarity', target: 'cognitive_dissonance', type: 'inhibits', strength: 0.7, description: 'Clear expectations prevent conflicting demands.' },

    // --- FROM AUTONOMY ---
    { source: 'autonomy', target: 'meaning', type: 'contributes_to', strength: 0.5, description: 'Control allows job crafting and ownership.' },
    { source: 'autonomy', target: 'engagement', type: 'contributes_to', strength: 0.6, description: 'Self-determination is a primary driver of vigor.' },

    // --- FROM SOCIAL SUPPORT ---
    { source: 'social_support', target: 'emotional_load', type: 'inhibits', strength: 0.6, description: 'Buffering effect of support on stress.' },
    { source: 'social_support', target: 'trust_peers', type: 'contributes_to', strength: 0.8, description: 'Reliable help builds trust.' },
    { source: 'social_support', target: 'psychological_safety', type: 'contributes_to', strength: 0.5, description: 'Supportive peers create safe environments.' },

    // --- FROM FAIRNESS ---
    { source: 'fairness', target: 'trust_leadership', type: 'contributes_to', strength: 0.9, description: 'Justice is the foundation of vertical trust.' },
    { source: 'fairness', target: 'cognitive_dissonance', type: 'inhibits', strength: 0.4, description: 'Fair treatment aligns with expectations of equity.' },

    // --- FROM WORKLOAD ---
    { source: 'workload', target: 'emotional_load', type: 'contributes_to', strength: 0.8, description: 'High demands directly consume energy.' },
    { source: 'workload', target: 'adaptive_capacity', type: 'inhibits', strength: 0.5, description: ' exhaustion reduces ability to change.' },

    // --- FROM LEARNING CLIMATE ---
    { source: 'learning_climate', target: 'adaptive_capacity', type: 'contributes_to', strength: 0.7, description: 'Growth mindset fosters adaptability.' },
    { source: 'learning_climate', target: 'psychological_safety', type: 'reciprocal' as any, strength: 0.5, description: 'Safety enables learning, learning rewards safety.' }, // Handled as contributes_to in TS for DAG simplicity, but kept in mind.

    // --- SECOND ORDER INTERACTIONS ---
    { source: 'psychological_safety', target: 'learning_climate', type: 'contributes_to', strength: 0.6, description: 'Safety is a prerequisite for learning behavior.' },
    { source: 'psychological_safety', target: 'engagement', type: 'contributes_to', strength: 0.4, description: 'Safety unlocks full expression of self.' },

    { source: 'trust_leadership', target: 'psychological_safety', type: 'contributes_to', strength: 0.7, description: 'Leaders set the safety tone.' },
    { source: 'trust_peers', target: 'psychological_safety', type: 'contributes_to', strength: 0.5, description: 'Peers reinforce norms.' },

    { source: 'emotional_load', target: 'engagement', type: 'inhibits', strength: 0.6, description: 'Burnout mechanism (Exhaustion).' },
    { source: 'cognitive_dissonance', target: 'engagement', type: 'inhibits', strength: 0.4, description: 'Mental friction reduces dedication.' },

    { source: 'adaptive_capacity', target: 'emotional_load', type: 'inhibits', strength: 0.3, description: 'Resilience buffers stress.' },

    { source: 'meaning', target: 'engagement', type: 'amplifies', strength: 0.8, description: 'Purpose is the strongest multiplier of engagement.' }
];

export const CONSTRUCT_LAYERS: Record<Construct, 'first_order' | 'second_order' | 'outcome'> = {
    role_clarity: 'first_order',
    workload: 'first_order',
    autonomy: 'first_order',
    fairness: 'first_order',
    social_support: 'first_order',
    learning_climate: 'first_order',

    trust_leadership: 'second_order',
    trust_peers: 'second_order',
    psychological_safety: 'second_order',
    meaning: 'second_order',
    adaptive_capacity: 'second_order',
    cognitive_dissonance: 'second_order',
    emotional_load: 'second_order',

    engagement: 'outcome' // In this intra-psychic model, engagement is the proximal outcome. Retention/Performance are extra-psychic.
};

export const CONSTRUCT_TYPES: Record<Construct, 'latent' | 'behavioral' | 'structural'> = {
    // Inputs (Structural/Environmental)
    role_clarity: 'structural',
    workload: 'structural',
    autonomy: 'structural',
    fairness: 'structural',
    social_support: 'structural',
    learning_climate: 'structural',

    // States (Latent Psych)
    trust_leadership: 'latent',
    trust_peers: 'latent',
    psychological_safety: 'latent',
    meaning: 'latent',
    adaptive_capacity: 'latent',
    cognitive_dissonance: 'latent',
    emotional_load: 'latent',

    // Outcome (Behavioral/Expressive)
    engagement: 'behavioral'
};
