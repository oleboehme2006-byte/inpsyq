import { Construct } from '../measurement/constructs';

export type DeviationSeverity = 'normal' | 'healthy_deviation' | 'risk_deviation' | 'extreme_risk';

export interface NormRange {
    mean: number; // Target mean (0.0 - 1.0)
    sigma: number; // Acceptable standard deviation (usually 0.15-0.2)
    min_healthy: number; // lower bound
    max_healthy: number; // upper bound
}

export interface NormProfile {
    id: string;
    name: string;
    organization_id: string;
    constructs: Record<Construct, NormRange>;
}

export interface NormAssessment {
    construct: Construct;
    raw_score: number;
    deviation_z_score: number; // (score - mean) / sigma
    severity: DeviationSeverity;
    is_aligned: boolean;
}
