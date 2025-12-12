export const PARAMETERS = [
  'control',
  'psych_safety',
  'meaning',
  'emotional_load',
  'cognitive_dissonance',
  'trust_leadership',
  'trust_peers',
  'autonomy_friction',
  'engagement',
  'adaptive_capacity',
] as const;

export type Parameter = typeof PARAMETERS[number];

export const MOCK_MODE = process.env.MOCK_MODE === 'true'; // Configurable via env, default false if not set, but requirements say global flag. 

// Interaction Constants
export const COOLDOWN_DAYS = 7;

// Inference Constants
export const DEFAULT_VARIANCE = 0.25;
export const MIN_VARIANCE = 0.0025;
export const MAX_VARIANCE = 0.25;
export const CONFIDENCE_THRESHOLD = 0.55;
export const R_MULTIPLIER = 2.5;

// Profile Thresholds (Heuristics for Mock/Prototype)
export const WRP_THRESHOLD = 0.7;
export const OUC_THRESHOLD = 0.7;
export const TFP_THRESHOLD = 0.6;
