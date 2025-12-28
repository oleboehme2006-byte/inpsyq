/**
 * PROPAGATION RISK — Deterministic Risk Computation
 * 
 * Computes propagation risk based on:
 * - Number of D2/D3 dependencies
 * - Controllability of D3 dependencies
 * - Volatility and trend direction
 */

import { DependencyImpactLevel } from '../scoring/types';
import { PropagationRisk, PropagationRiskLevel, ExternalDependencyAttribution } from './types';
import { ExternalDependencyCandidate } from './input';

// ============================================================================
// Computation
// ============================================================================

export interface PropagationRiskInput {
    /** Processed external dependencies */
    readonly dependencies: readonly ExternalDependencyAttribution[];
    /** Original dependency candidates (for additional data) */
    readonly candidates: readonly ExternalDependencyCandidate[];
    /** Whether the index is worsening */
    readonly isWorsening: boolean;
    /** Index volatility */
    readonly volatility: number;
    /** Is source mixed? */
    readonly isMixed: boolean;
}

/**
 * Compute propagation risk level.
 * 
 * Rules:
 * - HIGH: any D3 with LOW controllability AND index is worsening
 * - ELEVATED: >=2 D2+ dependencies OR mixed source with high volatility
 * - LOW: otherwise
 */
export function computePropagationRisk(input: PropagationRiskInput): PropagationRisk {
    const { dependencies, isWorsening, volatility, isMixed } = input;

    const drivers: string[] = [];

    // Check for D3 with LOW controllability
    const d3LowControl = dependencies.filter(
        d => d.impact === 'D3' && d.controllability === 'LOW'
    );

    // Count D2+ dependencies
    const d2Plus = dependencies.filter(
        d => d.impact === 'D2' || d.impact === 'D3'
    );

    // HIGH: D3 with LOW controllability + worsening
    if (d3LowControl.length > 0 && isWorsening) {
        for (const d of d3LowControl) {
            drivers.push(d.dependency);
        }
        return {
            level: 'HIGH',
            drivers,
        };
    }

    // ELEVATED: >=2 D2+ OR mixed with high volatility
    const highVolatility = volatility >= 0.15;

    if (d2Plus.length >= 2 || (isMixed && highVolatility)) {
        for (const d of d2Plus) {
            drivers.push(d.dependency);
        }
        if (isMixed && highVolatility && drivers.length === 0) {
            drivers.push('cross-source-coupling');
        }
        return {
            level: 'ELEVATED',
            drivers,
        };
    }

    // LOW: otherwise
    return {
        level: 'LOW',
        drivers: [],
    };
}

/**
 * Determine if index is worsening based on delta and directionality.
 * For higher_is_worse: positive delta = worsening
 * For higher_is_better: negative delta = worsening
 */
export function isIndexWorsening(
    delta: number,
    isHigherWorse: boolean
): boolean {
    const threshold = 0.02;
    if (isHigherWorse) {
        return delta > threshold;
    } else {
        return delta < -threshold;
    }
}
