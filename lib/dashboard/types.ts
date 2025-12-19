/**
 * Dashboard Data Transfer Objects
 * Canonical types for decision-grade dashboard rendering.
 * 
 * These DTOs are the single source of truth for UI rendering.
 * They are assembled server-side and contain all data needed for display.
 */

import { StateLabel, TrendDirection, InfluenceScope, ActionUrgency } from '@/services/decision/types';

// ==========================================
// Common Types
// ==========================================

export type ScoreBand = 'excellent' | 'good' | 'moderate' | 'concerning' | 'critical';
export type CausalLabel = 'strong_causal' | 'likely_causal' | 'correlational' | 'unknown';
export type TrendRegime = 'stable' | 'shift' | 'noise';
export type GovernanceStatus = 'clear' | 'review_needed' | 'blocked';

// ==========================================
// Meta (Every DTO must include this)
// ==========================================

export interface DashboardMeta {
    request_id: string;
    generated_at: string;
    range_weeks: number;
    cache_hit: boolean;
    governance_blocked: boolean;
    duration_ms?: number;
}

// ==========================================
// State Block
// ==========================================

export interface StateBlock {
    label: StateLabel;
    score_band: ScoreBand;
    severity: number;  // 0-1 (1 = most critical)
    explanation: string;
    governance_status: GovernanceStatus;
    confidence: number;  // 0-1
    last_measured_at?: string;
}

// ==========================================
// Trend Block
// ==========================================

export interface TrendBlock {
    direction: TrendDirection;
    velocity: number;  // Rate of change
    volatility: number;  // 0-1 (higher = more volatile)
    regime: TrendRegime;
    explanation?: string;
}

// ==========================================
// Semantic Indices
// ==========================================

export interface SemanticIndices {
    strain_index: number;  // 0-1
    withdrawal_risk: number;  // 0-1
    trust_gap: number;  // 0-1
    // Optional additional indices
    engagement_index?: number;
    psychological_safety?: number;
}

// ==========================================
// Driver Attribution
// ==========================================

export interface DriverAttribution {
    construct: string;
    label: string;
    impact: number;  // 0-1
    direction: 'positive' | 'negative';
    scope: InfluenceScope;
    causal_label: CausalLabel;
    evidence_refs: string[];  // Interaction IDs or measurement references
    uncertainty: number;  // 0-1
    is_actionable: boolean;
    explanation: string;
}

// ==========================================
// Recommended Action
// ==========================================

export interface RecommendedAction {
    action_id: string;
    title: string;
    description: string;
    rationale: string;
    urgency: ActionUrgency;
    expected_effect: string;  // Counterfactual preview
    monitor_constructs: string[];  // What to observe after
    checklist?: string[];  // Implementation steps
}

// ==========================================
// Risk Assessment
// ==========================================

export interface RiskAssessment {
    epistemic: number;  // 0-1 (data quality risk)
    ethical: number;  // 0-1 (potential for harm)
    organizational: number;  // 0-1 (business impact)
    blocking_reason?: string;  // If governance_blocked
}

// ==========================================
// Measurement Diagnostics
// ==========================================

export interface MeasurementDiagnostics {
    construct_coverage: Record<string, number>;  // construct -> coverage %
    epistemic_states: Record<string, 'ignorant' | 'uncertain' | 'confident' | 'verified'>;
    last_measured_at: string;
    entropy?: number;
    saturation?: number;
    drift_warning?: string;
}

// ==========================================
// Audit Trail
// ==========================================

export interface AuditBlock {
    sessions_count: number;
    participation_rate: number;  // 0-1
    missingness: number;  // 0-1 (how much data is missing)
    data_quality_score?: number;  // 0-1
}

// ==========================================
// TEAM DASHBOARD DTO
// ==========================================

export interface TeamDashboardDTO {
    meta: DashboardMeta;
    state: StateBlock;
    trend: TrendBlock;
    indices: SemanticIndices;
    drivers: {
        top_risks: DriverAttribution[];
        top_strengths: DriverAttribution[];
    };
    action: {
        recommended: RecommendedAction;
        alternatives: RecommendedAction[];
    };
    risk: RiskAssessment;
    measurement: MeasurementDiagnostics;
    audit: AuditBlock;
    // Optional AI-generated narrative (non-blocking)
    narrative?: {
        summary?: string;
        generated_at?: string;
        mode?: 'llm' | 'template' | 'none';
    };
}

// ==========================================
// EXECUTIVE DASHBOARD DTO
// ==========================================

export interface TeamSummary {
    team_id: string;
    team_name: string;
    state_label: StateLabel;
    score_band: ScoreBand;
    severity: number;
    trend_direction: TrendDirection;
    velocity: number;
    governance_status: GovernanceStatus;
}

export interface SystemicDriverCluster {
    construct: string;
    label: string;
    affected_teams: string[];
    aggregate_impact: number;
    scope: 'organization' | 'department' | 'localized';
}

export interface InterventionRadarItem {
    action_id: string;
    title: string;
    urgency: ActionUrgency;
    affected_teams: string[];
    expected_effect: string;
}

export interface ExecutiveDashboardDTO {
    meta: DashboardMeta;
    org_id: string;
    // Portfolio View
    teams: TeamSummary[];
    team_ranking: {
        team_id: string;
        rank: number;
        composite_score: number;  // severity × velocity
    }[];
    // Org-Level Aggregates
    org_state: StateBlock;
    org_trend: TrendBlock;
    org_indices: SemanticIndices;
    // Risk Distribution
    risk_distribution: {
        critical: number;
        at_risk: number;
        healthy: number;
    };
    // Systemic Analysis
    systemic_drivers: SystemicDriverCluster[];
    interventions: InterventionRadarItem[];
    // Governance & Coverage
    governance_summary: {
        blocked_teams: string[];
        review_needed_teams: string[];
        coverage_rate: number;
    };
    audit: AuditBlock;
}

// ==========================================
// Factory Helpers
// ==========================================

export function createEmptyTeamDashboardDTO(requestId: string): TeamDashboardDTO {
    return {
        meta: {
            request_id: requestId,
            generated_at: new Date().toISOString(),
            range_weeks: 0,
            cache_hit: false,
            governance_blocked: false,
        },
        state: {
            label: 'UNKNOWN',
            score_band: 'moderate',
            severity: 0,
            explanation: 'Insufficient data',
            governance_status: 'clear',
            confidence: 0,
        },
        trend: {
            direction: 'STABLE',
            velocity: 0,
            volatility: 0,
            regime: 'noise',
        },
        indices: {
            strain_index: 0,
            withdrawal_risk: 0,
            trust_gap: 0,
        },
        drivers: {
            top_risks: [],
            top_strengths: [],
        },
        action: {
            recommended: {
                action_id: 'gather_data',
                title: 'Gather More Data',
                description: 'Insufficient data for recommendations.',
                rationale: 'Need more measurement coverage.',
                urgency: 'NORMAL',
                expected_effect: 'Improved understanding',
                monitor_constructs: [],
            },
            alternatives: [],
        },
        risk: {
            epistemic: 1,
            ethical: 0,
            organizational: 0,
        },
        measurement: {
            construct_coverage: {},
            epistemic_states: {},
            last_measured_at: new Date().toISOString(),
        },
        audit: {
            sessions_count: 0,
            participation_rate: 0,
            missingness: 1,
        },
    };
}

export function scoreBandFromSeverity(severity: number): ScoreBand {
    if (severity >= 0.8) return 'critical';
    if (severity >= 0.6) return 'concerning';
    if (severity >= 0.4) return 'moderate';
    if (severity >= 0.2) return 'good';
    return 'excellent';
}

export function governanceStatusFromRisk(risk: RiskAssessment): GovernanceStatus {
    if (risk.ethical > 0.7 || risk.epistemic > 0.8) return 'blocked';
    if (risk.ethical > 0.4 || risk.epistemic > 0.6) return 'review_needed';
    return 'clear';
}
