export interface RiskVector {
    epistemic: number; // 0-1 (Uncertainty, lack of data)
    ethical: number;   // 0-1 (Potential for harm, bias, or identifying individuals)
    organizational: number; // 0-1 (Political fallout, trust erosion risk)
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskAssessment {
    vector: RiskVector;
    overall_level: RiskLevel;
    flags: string[];
    blocking: boolean; // If true, do not show result
}
