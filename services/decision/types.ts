
/**
 * Decision Layer Types
 * Defines the strict output contract for the Interpretation Layer.
 */

// ==========================================
// 1. Classification Enums
// ==========================================

export type StateLabel = 'HEALTHY' | 'AT_RISK' | 'CRITICAL' | 'UNKNOWN';

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DETERIORATING';

export type InfluenceScope = 'ORGANIZATION' | 'TEAM' | 'LEADERSHIP' | 'INDIVIDUAL' | 'SYSTEMIC';

export type ActionUrgency = 'IMMEDIATE' | 'HIGH' | 'NORMAL';

// ==========================================
// 2. Component Structures
// ==========================================

export interface DecisionState {
    label: StateLabel;
    score: number; // Normalized 0-1 (1 = Good, 0 = Bad)
    severity: number; // 0-1 (1 = Most Critical)
    primary_metric: string; // e.g. "WRP" or "Strain"
    explanation: string;
}

export interface DecisionTrend {
    direction: TrendDirection;
    velocity: number; // Slope or delta
    consistency: number; // 0-1 (R-squared or similar confidence)
    explanation: string;
}

export interface AnalysedDriver {
    parameter: string;
    label: string;
    impact: number; // 0-1 Contribution to current state
    direction: 'POSITIVE' | 'NEGATIVE'; // Does it help or hurt?
    influence_scope: InfluenceScope;
    is_actionable: boolean;
    explanation: string;
}

export interface RecommendAction {
    type: string; // Unique Action Key/ID
    title: string;
    description: string;
    rationale: string; // Why this?
    urgency: ActionUrgency;
    target_role: 'EXECUTIVE' | 'TEAM_LEAD';
}

// ==========================================
// 3. Main Output Contract
// ==========================================

export interface DecisionSnapshot {
    meta: {
        org_id: string;
        team_id: string;
        week_start: string;
        coverage_weeks: number;
    };
    state: DecisionState;
    trend: DecisionTrend;
    drivers: {
        top_risks: AnalysedDriver[];
        top_strengths: AnalysedDriver[];
    };
    recommendation: {
        primary: RecommendAction;
        secondary: RecommendAction[];
    };
}
