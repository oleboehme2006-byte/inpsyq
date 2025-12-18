/**
 * Semantic Mapping & Data Transformation Layer
 * 
 * STRICT VISUALIZATION RULES:
 * - No business logic (calculating scores).
 * - Only formatting, normalization, and semantic mapping.
 * - Handles pivoting of raw DB rows into Visualization-Ready objects.
 */

// ==========================================
// 1. Raw Payload Types (Strictly Typed)
// ==========================================

import { safePercent } from '@/lib/utils/safeNumber';

export interface RawProfileRow {
    org_id: string;
    team_id: string;
    week_start: string; // ISO Date
    profile_type: 'WRP' | 'OUC' | 'TFP';
    activation_score: number;
    confidence: number;
}

export interface RawAuditPayload {
    org_id: string;
    team_id: string;
    week_start: string;
    indices: {
        strain: number;
        withdrawal: number;
        trust_gap: number;
    };
    team_parameter_means: Record<string, number>;
    parameter_contributions: Record<string, {
        team_mean: number;
        top_contributors: Array<{
            user_id: string;
            confidence: number;
            normalized_weight: number;
            employee_mean: number;
        }>
    }>;
}

// ==========================================
// 2. Visualization Types (Derived)
// ==========================================

export interface VizProfile {
    week_start: string;
    metrics: {
        WRP: { value: number; confidence: number };
        OUC: { value: number; confidence: number };
        TFP: { value: number; confidence: number };
    };
}

// Zone Definitions
export type ZoneType = 'healthy' | 'neutral' | 'watch' | 'critical';

export interface ZoneDefinition {
    label: string;
    max: number; // Upper bound (inclusive)
    color: string; // Tailwind class
    bg: string; // Background color for charts
    description: string;
}

export interface MetricDefinition {
    id: string;
    label: string;
    description: string;
    zones: ZoneDefinition[];
}

// ==========================================
// 3. Definitions & Zones
// ==========================================

export const PROFILE_METRICS: Record<string, MetricDefinition> = {
    WRP: { // Note: ID matches profile_type
        id: 'WRP',
        label: 'Work-Recovery Pace',
        description: 'Balance between exertion and recovery phases. Higher is sustainable.',
        zones: [
            { label: 'Critical Burnout Risk', max: 0.3, color: 'text-rose-500', bg: '#f43f5e', description: 'Immediate intervention required. Recovery absent.' },
            { label: 'Strain Accumulation', max: 0.6, color: 'text-amber-500', bg: '#f59e0b', description: 'Recovery is insufficient for current load.' },
            { label: 'Sustainable', max: 1.0, color: 'text-emerald-500', bg: '#10b981', description: 'Healthy rhythm of work and rest.' }
        ]
    },
    OUC: {
        id: 'OUC',
        label: 'Org. Unit Compatibility',
        description: 'Alignment between team members and organizational goals.',
        zones: [
            { label: 'Misaligned', max: 0.4, color: 'text-rose-500', bg: '#f43f5e', description: 'Significant friction with org objectives.' },
            { label: 'Functional', max: 0.7, color: 'text-blue-400', bg: '#60a5fa', description: 'Generally aligned but with operational gaps.' },
            { label: 'Synergistic', max: 1.0, color: 'text-emerald-500', bg: '#10b981', description: 'High coherence with mission.' }
        ]
    },
    TFP: {
        id: 'TFP',
        label: 'Team Friction Pressure',
        description: 'Internal resistance and interpersonal conflict. Lower is better.',
        zones: [
            { label: 'Fluid', max: 0.3, color: 'text-emerald-500', bg: '#10b981', description: 'Low friction, high communication flow.' },
            { label: 'Notable Tension', max: 0.6, color: 'text-amber-500', bg: '#f59e0b', description: 'Interpersonal friction affecting velocity.' },
            { label: 'High Friction', max: 1.0, color: 'text-rose-500', bg: '#f43f5e', description: 'Severe internal blockers and conflict.' }
        ]
    }
};

export const DRIVER_DESCRIPTIONS: Record<string, string> = {
    emotional_load: 'Intensity of emotional processing required by work contexts.',
    cognitive_load: 'Mental effort required to perform tasks and solve problems.',
    autonomy_friction: 'Perceived barriers to independent decision making.',
    role_ambiguity: 'Lack of clarity regarding responsibilities and expectations.',
    psych_safety: 'Confidence that the team is safe for interpersonal risk-taking.',
    social_cohesion: 'Strength of interpersonal bonds and sense of belonging.',
    trust_gap: 'Disparity between expected and actual trust levels.',
    cognitive_dissonance: 'Mental stress from holding contradictory beliefs or values.',
    meaning: 'Sense of purpose and value derived from work.',
    engagement: 'Level of enthusiasm and dedication to tasks.',
    control: 'Perceived influence over work processes and outcomes.',
    trust_peers: 'Reliability and confidence in team members.',
    trust_leadership: 'Faith in leadership decisions and integrity.',
    adaptive_capacity: 'Ability to adjust to new conditions and challenges.'
};

// ==========================================
// 4. Helpers
// ==========================================

export const getZone = (metricId: string, value: number): ZoneDefinition => {
    const def = PROFILE_METRICS[metricId];
    if (!def) return { label: 'Unknown', max: 1, color: 'text-slate-400', bg: '#94a3b8', description: '' };

    const sortedZones = [...def.zones].sort((a, b) => a.max - b.max);
    for (const z of sortedZones) {
        if (value <= z.max) return z;
    }
    return sortedZones[sortedZones.length - 1];
};

// ==========================================
// INDICES MAPPING (Stability & Risk)
// ==========================================

export const INDICES_METRICS: Record<string, MetricDefinition> = {
    strain: {
        id: 'strain',
        label: 'Organizational Strain',
        description: 'Compounded pressure from emotional load, low safety, and lack of control.',
        zones: [
            { label: 'Optimal', max: 0.2, color: 'text-emerald-500', bg: '#10b981', description: 'Minimal strain, highly sustainable.' },
            { label: 'Healthy', max: 0.4, color: 'text-blue-500', bg: '#3b82f6', description: 'Manageable pressure levels.' },
            { label: 'Elevated', max: 0.6, color: 'text-amber-500', bg: '#f59e0b', description: 'Pressure impacting resilience.' },
            { label: 'Critical', max: 1.0, color: 'text-rose-500', bg: '#f43f5e', description: 'Unsustainable overload risk.' }
        ]
    },
    withdrawal: {
        id: 'withdrawal',
        label: 'Withdrawal Risk',
        description: 'Disengagement signal driven by dissonance and lack of meaning.',
        zones: [
            { label: 'Committed', max: 0.2, color: 'text-emerald-500', bg: '#10b981', description: 'High alignment and retention likely.' },
            { label: 'Stable', max: 0.4, color: 'text-blue-500', bg: '#3b82f6', description: 'Baseline engagement.' },
            { label: 'Drifting', max: 0.6, color: 'text-amber-500', bg: '#f59e0b', description: 'Signs of checking out mentally.' },
            { label: 'Disconnected', max: 1.0, color: 'text-rose-500', bg: '#f43f5e', description: 'High turnover risk.' }
        ]
    },
    trust_gap: {
        id: 'trust_gap',
        label: 'Trust Divergence',
        description: 'Gap between peer trust and leadership trust. Near 0 is balanced.',
        zones: [
            { label: 'Balanced', max: 0.1, color: 'text-emerald-500', bg: '#10b981', description: 'Coherent trust across layers.' },
            { label: 'Aligned', max: 0.3, color: 'text-blue-500', bg: '#3b82f6', description: 'Minor divergence.' },
            { label: 'Fractured', max: 0.6, color: 'text-amber-500', bg: '#f59e0b', description: 'Significant split in trust targets.' },
            { label: 'Polarized', max: 2.0, color: 'text-rose-500', bg: '#f43f5e', description: 'Severe "Us vs Them" dynamic.' } // Gap is -1 to 1, absolute check
        ]
    }
};

/**
 * Normalizes an index value to a 0-100 "Stability Score" where 100 is Best.
 * Used for plotting comparison indices on a shared Y-axis.
 */
export const normalizeToStability = (metricId: string, rawValue: number): number => {
    // 1. Sanitize
    const val = isNaN(rawValue) ? 0 : rawValue;

    // 2. Logic per metric
    // For Strain/Withdrawal: 0 is Best (100%), 1 is Worst (0%)
    if (metricId === 'strain' || metricId === 'withdrawal') {
        const clamped = Math.max(0, Math.min(1, val));
        return (1 - clamped) * 100;
    }

    // For Trust Gap: 0 is Best (100%), +/- 1 is Worst (0%)
    if (metricId === 'trust_gap') {
        const absVal = Math.abs(val);
        const clamped = Math.min(1, absVal);
        return (1 - clamped) * 100;
    }

    return 50; // Fallback
};

export const getIndexZone = (metricId: string, rawValue: number): ZoneDefinition => {
    const def = INDICES_METRICS[metricId];
    if (!def) return { label: 'Unknown', max: 0, color: 'text-slate-400', bg: '#94a3b8', description: '' };

    // For Trust Gap, we use Absolute Value for zone lookup
    const checkVal = metricId === 'trust_gap' ? Math.abs(rawValue) : rawValue;

    const sorted = [...def.zones].sort((a, b) => a.max - b.max);
    for (const z of sorted) {
        if (checkVal <= z.max) return z;
    }
    return sorted[sorted.length - 1];
};

export const formatPercent = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    return safePercent(val);
};

// ==========================================
// 5. Transformers
// ==========================================

/**
 * Pivots raw profile rows (one per type) into a unified object per week.
 */
export const transformProfiles = (rows: RawProfileRow[]): VizProfile[] => {
    if (!Array.isArray(rows)) return [];

    const map = new Map<string, VizProfile['metrics']>();

    rows.forEach(r => {
        const date = r.week_start;
        if (!map.has(date)) {
            map.set(date, {
                WRP: { value: 0, confidence: 0 },
                OUC: { value: 0, confidence: 0 },
                TFP: { value: 0, confidence: 0 }
            });
        }
        const entry = map.get(date)!;
        if (r.profile_type === 'WRP' || r.profile_type === 'OUC' || r.profile_type === 'TFP') {
            entry[r.profile_type] = {
                value: r.activation_score,
                confidence: r.confidence
            };
        }
    });

    return Array.from(map.entries())
        .map(([week_start, metrics]) => ({ week_start, metrics }))
        .sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime());
};

/**
 * Extracts driver impact from audit payload.
 * Normalizes parameter means to 0-1 relative scale for visualization.
 */
export const transformDrivers = (audit: RawAuditPayload) => {
    if (!audit || !audit.parameter_contributions) return [];

    return Object.entries(audit.parameter_contributions)
        .map(([key, data]) => ({
            key,
            value: data.team_mean,
            label: key.replace(/_/g, ' '),
            description: DRIVER_DESCRIPTIONS[key] || 'Psychological parameter.'
        }))
        .sort((a, b) => b.value - a.value);
};
