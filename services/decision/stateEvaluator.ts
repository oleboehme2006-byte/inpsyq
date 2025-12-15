
import { DecisionState, StateLabel } from './types';
import { THRESHOLDS } from './constants';

export interface StateInput {
    // Normalized 0-1 inputs where 1 is "High presence of trait" (not necessarily good/bad yet)
    // We expect the caller to map raw keys to these standard keys.
    WRP?: number; // Higher = Better
    OUC?: number; // Higher = Better
    TFP?: number; // Higher = WORSE (Friction)
    Strain?: number; // Higher = WORSE
    Withdrawal?: number; // Higher = WORSE
}

export function evaluateState(metrics: StateInput): DecisionState {
    const scores: number[] = [];

    // Normalize all to "Health Score" (Higher is Better)
    if (metrics.WRP !== undefined) scores.push(metrics.WRP);
    if (metrics.OUC !== undefined) scores.push(metrics.OUC);
    if (metrics.TFP !== undefined) scores.push(1 - metrics.TFP); // Invert
    if (metrics.Strain !== undefined) scores.push(1 - metrics.Strain); // Invert
    if (metrics.Withdrawal !== undefined) scores.push(1 - metrics.Withdrawal); // Invert

    if (scores.length === 0) {
        return {
            label: 'UNKNOWN',
            score: 0,
            severity: 0,
            primary_metric: 'None',
            explanation: 'Insufficient data to calculate state.'
        };
    }

    const avgHealth = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Determine Label
    let label: StateLabel = 'HEALTHY';
    let explanation = 'Team metrics indicate a sustainable and aligned state.';

    if (avgHealth < THRESHOLDS.CRITICAL_HEALTH) {
        label = 'CRITICAL';
        explanation = 'Multiple key indicators are in the critical zone, suggesting immediate risk of burnout or turnover.';
    } else if (avgHealth < THRESHOLDS.RISK_HEALTH) {
        label = 'AT_RISK';
        explanation = 'Metrics show signs of instability or strain. Monitoring recommended.';
    }

    // Identify Primary Drag (The metric lowest in health)
    // We reconstruct the map to find min
    const healthMap: Record<string, number> = {};
    if (metrics.WRP !== undefined) healthMap['Work-Recovery Pace'] = metrics.WRP;
    if (metrics.OUC !== undefined) healthMap['Org Compatibility'] = metrics.OUC;
    if (metrics.TFP !== undefined) healthMap['Team Friction'] = 1 - metrics.TFP;
    if (metrics.Strain !== undefined) healthMap['Strain'] = 1 - metrics.Strain;

    let minVal = 1;
    let primary = 'General';

    for (const [k, v] of Object.entries(healthMap)) {
        if (v < minVal) {
            minVal = v;
            primary = k;
        }
    }

    // Severity: 1.0 = Worst (avgHealth = 0), 0.0 = Best (avgHealth = 1)
    const severity = parseFloat((1 - avgHealth).toFixed(2));

    return {
        label,
        score: parseFloat(avgHealth.toFixed(2)),
        severity,
        primary_metric: primary,
        explanation: `${explanation} Primary concern: ${primary}.`
    };
}
