
// Psychological Constructs Canonical Definition

export const CONSTRUCTS = [
    'psychological_safety',  // belief that team is safe for risk-taking
    'trust_leadership',      // trust in immediate manager/leadership
    'trust_peers',          // trust in team members
    'autonomy',             // discretion over work
    'meaning',              // sense of purpose
    'fairness',             // justice (distributive/procedural)
    'workload',             // demand vs capacity
    'role_clarity',         // understanding of expectations
    'social_support',       // emotional/instrumental help
    'learning_climate',     // support for skill growth
    'adaptive_capacity',    // ability to handle change
    'engagement',           // vigor, dedication, absorption
    'cognitive_dissonance', // mental friction / conflict
    'emotional_load'        // accumulated affective strain
] as const;

export type Construct = typeof CONSTRUCTS[number];

export const CONSTRUCT_DEFINITIONS: Record<Construct, string> = {
    psychological_safety: "Belief that the environment is safe for interpersonal risk-taking. EXCLUDES: General comfort or physical safety.",
    trust_leadership: "Confidence in the integrity and ability of leadership. EXCLUDES: Liking the manager as a person.",
    trust_peers: "Confidence in the reliability and support of colleagues. EXCLUDES: Social friendship outside work.",
    autonomy: "Degree of discretion and control over one's work. EXCLUDES: Lack of guidance or chaos.",
    meaning: "Perception that work is significant and purposeful. EXCLUDES: General happiness.",
    fairness: "Perception of just treatment, transparency, and equity. EXCLUDES: Getting what you want (entitlement).",
    workload: "Balance between job demands and resources. EXCLUDES: Laziness or boredom.",
    role_clarity: "Clear understanding of responsibilities and expectations. EXCLUDES: Rigid micromanagement.",
    social_support: "Availability of help and emotional backing from others. EXCLUDES: Gossip or distraction.",
    learning_climate: "Environment that encourages skill development and growth. EXCLUDES: Mandatory training compliance.",
    adaptive_capacity: "Ready ability to cope with and adjust to change. EXCLUDES: Resignation or apathy.",
    engagement: "Positive, fulfilling, work-related state of mind. EXCLUDES: Workaholism.",
    cognitive_dissonance: "Mental discomfort from conflicting beliefs or values.",
    emotional_load: "Accumulated burden of regulating emotions and stress."
};

export function isValidConstruct(c: string): c is Construct {
    return CONSTRUCTS.includes(c as Construct);
}
