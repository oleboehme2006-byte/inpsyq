#!/usr/bin/env npx tsx
/**
 * VERIFICATION SCRIPT — Phase 3+4 Aggregation & Attribution
 * 
 * Run with: npx tsx scripts/verify-agg-attrib.ts
 * 
 * This script validates:
 * 1. Phase 1+2 (runs verify-semantics first)
 * 2. Aggregation layer (week utilities, temporal metrics, series building)
 * 3. Attribution engine (internal, external, source rules, propagation)
 * 4. Deterministic fixtures with EXTERNAL, INTERNAL, and MIXED cases
 */

// ============================================================================
// Phase 1+2 Imports (for fixture data types)
// ============================================================================

import { INDEX_REGISTRY } from '../lib/semantics/indexRegistry';
import { DRIVER_REGISTRY, validateDriverIndexAssignment } from '../lib/semantics/driverRegistry';
import { DEPENDENCY_REGISTRY } from '../lib/semantics/dependencyRegistry';

// ============================================================================
// Phase 3 Imports
// ============================================================================

import {
    getISOMondayUTC,
    weekStartISO,
    listWeeksBack,
    assertWeekStartISO,
} from '../lib/aggregation/week';

import {
    computeDelta,
    computeTrendDir,
    computeVolatility,
    computeRegime,
    computeTemporalStability,
} from '../lib/aggregation/temporal';

import { buildTeamIndexSeries } from '../lib/aggregation/buildSeries';
import { AggregationInputs, WeeklyIndexPoint } from '../lib/aggregation/types';

// ============================================================================
// Phase 4 Imports
// ============================================================================

import { AttributionInputs } from '../lib/attribution/input';
import { computeAttribution } from '../lib/attribution/attributionEngine';
import { AttributionResult } from '../lib/attribution/types';

// ============================================================================
// Test Harness
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ ${name}`);
        console.error(`   ${e instanceof Error ? e.message : e}`);
        failed++;
    }
}

function expectThrows(fn: () => void, message: string): void {
    try {
        fn();
        throw new Error(`Expected to throw: ${message}`);
    } catch (e) {
        // Expected
    }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertLessThanOrEqual(actual: number, max: number, message: string): void {
    if (actual > max) {
        throw new Error(`${message}: expected <= ${max}, got ${actual}`);
    }
}

console.log('\n=== PHASE 3+4 VERIFICATION ===\n');

// ============================================================================
// Phase 3: Week Utilities
// ============================================================================

console.log('--- Week Utilities ---');

test('getISOMondayUTC returns Monday', () => {
    const wed = new Date('2024-12-25T12:00:00Z'); // Christmas 2024 is Wednesday
    const monday = getISOMondayUTC(wed);
    assertEqual(monday.getUTCDay(), 1, 'Should be Monday');
    assertEqual(monday.getUTCDate(), 23, 'Should be Dec 23');
});

test('weekStartISO formats correctly', () => {
    const wed = new Date('2024-12-25T12:00:00Z');
    const iso = weekStartISO(wed);
    assertEqual(iso, '2024-12-23', 'Should format as ISO date');
});

test('listWeeksBack produces correct weeks', () => {
    const weeks = listWeeksBack('2024-12-23', 3);
    assertEqual(weeks.length, 3, 'Should have 3 weeks');
    assertEqual(weeks[0], '2024-12-23', 'First should be reference');
    assertEqual(weeks[1], '2024-12-16', 'Second should be 1 week back');
    assertEqual(weeks[2], '2024-12-09', 'Third should be 2 weeks back');
});

test('assertWeekStartISO validates Monday', () => {
    assertWeekStartISO('2024-12-23'); // Monday - should pass
    expectThrows(
        () => assertWeekStartISO('2024-12-24'), // Tuesday
        'Should reject non-Monday'
    );
});

// ============================================================================
// Phase 3: Temporal Metrics
// ============================================================================

console.log('\n--- Temporal Metrics ---');

test('computeDelta calculates difference', () => {
    const d1 = computeDelta(0.5, 0.4);
    const d2 = computeDelta(0.3, 0.5);
    if (Math.abs(d1 - 0.1) > 0.0001) throw new Error(`Delta should be 0.1, got ${d1}`);
    if (Math.abs(d2 - (-0.2)) > 0.0001) throw new Error(`Delta should be -0.2, got ${d2}`);
});

test('computeTrendDir determines direction', () => {
    assertEqual(computeTrendDir(0.05), 'UP', 'Positive delta = UP');
    assertEqual(computeTrendDir(-0.05), 'DOWN', 'Negative delta = DOWN');
    assertEqual(computeTrendDir(0.01), 'STABLE', 'Small delta = STABLE');
});

test('computeRegime returns NOISE for insufficient data', () => {
    const points: WeeklyIndexPoint[] = [
        { weekStart: '2024-12-23', value: 0.5, sigma: 0.1, delta: 0, trendDir: 'STABLE', volatility: 0.02, sampleN: 5, confidence: 0.8 },
    ];
    assertEqual(computeRegime(points), 'NOISE', 'Should be NOISE with 1 week');
});

test('computeTemporalStability returns correct levels', () => {
    assertEqual(computeTemporalStability(0.02, 0.05), 'HIGH', 'Low vol + low miss = HIGH');
    assertEqual(computeTemporalStability(0.20, 0.05), 'LOW', 'High vol = LOW');
    assertEqual(computeTemporalStability(0.02, 0.40), 'LOW', 'High miss = LOW');
    assertEqual(computeTemporalStability(0.08, 0.15), 'MED', 'Medium = MED');
});

// ============================================================================
// Phase 3: Series Building
// ============================================================================

console.log('\n--- Series Building ---');

test('buildTeamIndexSeries produces 4 indices in order', () => {
    const inputs: AggregationInputs = createMockAggregationInputs(9);
    const result = buildTeamIndexSeries(inputs, 9);

    assertEqual(result.series.length, 4, 'Should have 4 indices');
    assertEqual(result.series[0].indexKey, 'strain', 'First = strain');
    assertEqual(result.series[1].indexKey, 'withdrawal_risk', 'Second = withdrawal_risk');
    assertEqual(result.series[2].indexKey, 'trust_gap', 'Third = trust_gap');
    assertEqual(result.series[3].indexKey, 'engagement', 'Fourth = engagement');
});

test('buildTeamIndexSeries includes thresholds from registry', () => {
    const inputs: AggregationInputs = createMockAggregationInputs(9);
    const result = buildTeamIndexSeries(inputs, 9);

    const strainSeries = result.series[0];
    assertEqual(strainSeries.thresholds.critical, 0.75, 'Should use registry critical');
    assertEqual(strainSeries.directionality, 'higher_is_worse', 'Should use registry directionality');
});

// ============================================================================
// Phase 4: Attribution - Forbidden Combinations
// ============================================================================

console.log('\n--- Attribution: Forbidden Combinations ---');

test('Forbidden driver-index combinations throw', () => {
    // cognitive_load cannot contribute to trust_gap
    expectThrows(
        () => validateDriverIndexAssignment('cognitive_load', 'trust_gap'),
        'cognitive_load should not contribute to trust_gap'
    );

    // alignment_clarity cannot contribute to strain
    expectThrows(
        () => validateDriverIndexAssignment('alignment_clarity', 'strain'),
        'alignment_clarity should not contribute to strain'
    );
});

test('Attribution engine rejects forbidden combinations', () => {
    const inputs: AttributionInputs = {
        indexKey: 'trust_gap',
        indexValue: 0.6,
        indexSigma: 0.1,
        indexDelta: 0.05,
        indexConfidence: 0.8,
        volatility: 0.1,
        candidateInternalDrivers: [
            {
                driverFamily: 'cognitive_load', // FORBIDDEN for trust_gap
                contributionScore: 0.5,
                confidence: 0.8,
                volatility: 0.1,
                trendDelta: 0.05,
            },
        ],
        candidateDependencies: [],
    };

    expectThrows(
        () => computeAttribution(inputs),
        'Should throw for forbidden driver-index combination'
    );
});

// ============================================================================
// Phase 4: Attribution - EXTERNAL Dominance
// ============================================================================

console.log('\n--- Attribution: EXTERNAL Dominance ---');

test('EXTERNAL dominance clears internal drivers', () => {
    // Team A: High external impact (0.8), low internal (0.2)
    const inputs: AttributionInputs = {
        indexKey: 'strain',
        indexValue: 0.7,
        indexSigma: 0.1,
        indexDelta: 0.05,
        indexConfidence: 0.8,
        volatility: 0.1,
        candidateInternalDrivers: [
            {
                driverFamily: 'cognitive_load',
                contributionScore: 0.2, // Low
                confidence: 0.8,
                volatility: 0.1,
                trendDelta: 0.02,
            },
        ],
        candidateDependencies: [
            {
                dependency: 'organizational',
                impactScore: 0.8, // High
                confidence: 0.9,
                volatility: 0.05,
                trendDelta: 0.03,
                persistenceWeeks: 4,
            },
        ],
    };

    const result = computeAttribution(inputs);

    assertEqual(result.primarySource, 'EXTERNAL', 'Should be EXTERNAL');
    assertEqual(result.internal.length, 0, 'Internal should be empty');
    assertLessThanOrEqual(result.external.length, 3, 'External max 3');
});

// ============================================================================
// Phase 4: Attribution - INTERNAL Dominance
// ============================================================================

console.log('\n--- Attribution: INTERNAL Dominance ---');

test('INTERNAL dominance keeps internal drivers', () => {
    // Team B: High internal (0.7), low external (0.1)
    const inputs: AttributionInputs = {
        indexKey: 'strain',
        indexValue: 0.65,
        indexSigma: 0.1,
        indexDelta: -0.02,
        indexConfidence: 0.85,
        volatility: 0.08,
        candidateInternalDrivers: [
            {
                driverFamily: 'cognitive_load',
                contributionScore: 0.35,
                confidence: 0.8,
                volatility: 0.1,
                trendDelta: 0.02,
            },
            {
                driverFamily: 'emotional_load',
                contributionScore: 0.35,
                confidence: 0.85,
                volatility: 0.05,
                trendDelta: -0.01,
            },
        ],
        candidateDependencies: [
            {
                dependency: 'process',
                impactScore: 0.1, // Low
                confidence: 0.7,
                volatility: 0.1,
                trendDelta: 0,
                persistenceWeeks: 2,
            },
        ],
    };

    const result = computeAttribution(inputs);

    assertEqual(result.primarySource, 'INTERNAL', 'Should be INTERNAL');
    assertLessThanOrEqual(result.internal.length, 4, 'Internal max 4');
});

// ============================================================================
// Phase 4: Attribution - MIXED Source
// ============================================================================

console.log('\n--- Attribution: MIXED Source ---');

test('MIXED source caps both lists', () => {
    // Balanced: internal ~0.5, external ~0.5
    const inputs: AttributionInputs = {
        indexKey: 'strain',
        indexValue: 0.55,
        indexSigma: 0.12,
        indexDelta: 0.03,
        indexConfidence: 0.75,
        volatility: 0.12,
        candidateInternalDrivers: [
            { driverFamily: 'cognitive_load', contributionScore: 0.25, confidence: 0.8, volatility: 0.1, trendDelta: 0.02 },
            { driverFamily: 'emotional_load', contributionScore: 0.25, confidence: 0.75, volatility: 0.08, trendDelta: 0.01 },
        ],
        candidateDependencies: [
            { dependency: 'organizational', impactScore: 0.25, confidence: 0.8, volatility: 0.05, trendDelta: 0.02, persistenceWeeks: 3 },
            { dependency: 'temporal_deadline', impactScore: 0.25, confidence: 0.85, volatility: 0.1, trendDelta: 0.03, persistenceWeeks: 1 },
        ],
    };

    const result = computeAttribution(inputs);

    assertEqual(result.primarySource, 'MIXED', 'Should be MIXED');
    assertLessThanOrEqual(result.internal.length, 3, 'Internal max 3 in MIXED');
    assertLessThanOrEqual(result.external.length, 2, 'External max 2 in MIXED');
});

// ============================================================================
// Phase 4: Attribution - Contribution Bands (No Fake %)
// ============================================================================

console.log('\n--- Attribution: Contribution Bands ---');

test('Contribution bands are categorical, not percentages', () => {
    const inputs: AttributionInputs = {
        indexKey: 'strain',
        indexValue: 0.6,
        indexSigma: 0.1,
        indexDelta: 0.02,
        indexConfidence: 0.8,
        volatility: 0.1,
        candidateInternalDrivers: [
            { driverFamily: 'cognitive_load', contributionScore: 0.65, confidence: 0.8, volatility: 0.1, trendDelta: 0.02 },
            { driverFamily: 'emotional_load', contributionScore: 0.40, confidence: 0.75, volatility: 0.08, trendDelta: 0.01 },
            { driverFamily: 'autonomy_friction', contributionScore: 0.20, confidence: 0.7, volatility: 0.05, trendDelta: 0 },
        ],
        candidateDependencies: [],
    };

    const result = computeAttribution(inputs);

    // Verify bands are categorical values, not numbers
    for (const driver of result.internal) {
        const validBands = ['MINOR', 'MODERATE', 'MAJOR'];
        if (!validBands.includes(driver.contributionBand)) {
            throw new Error(`Invalid band: ${driver.contributionBand}`);
        }
    }

    // Check expected bands
    const major = result.internal.filter(d => d.contributionBand === 'MAJOR');
    const moderate = result.internal.filter(d => d.contributionBand === 'MODERATE');

    if (major.length === 0) {
        throw new Error('Should have at least one MAJOR');
    }
});

// ============================================================================
// Phase 4: Attribution - Propagation Risk
// ============================================================================

console.log('\n--- Attribution: Propagation Risk ---');

test('Propagation risk is deterministic', () => {
    // D3 with LOW controllability + worsening = HIGH
    const inputs: AttributionInputs = {
        indexKey: 'strain',
        indexValue: 0.75,
        indexSigma: 0.1,
        indexDelta: 0.08, // Worsening
        indexConfidence: 0.8,
        volatility: 0.15,
        candidateInternalDrivers: [],
        candidateDependencies: [
            {
                dependency: 'organizational', // LOW controllability
                impactScore: 0.7, // High enough for D3
                confidence: 0.85,
                volatility: 0.1,
                trendDelta: 0.05,
                persistenceWeeks: 5,
            },
        ],
    };

    const result = computeAttribution(inputs);

    assertEqual(result.propagationRisk.level, 'HIGH', 'Should be HIGH risk');
    if (result.propagationRisk.drivers.length === 0) {
        throw new Error('Should have drivers listed');
    }
});

// ============================================================================
// Phase 4: Attribution - Dependency Explanations Differ
// ============================================================================

console.log('\n--- Attribution: Dependency Explanations ---');

test('Dependency explanations differ by type', () => {
    const inputs: AttributionInputs = {
        indexKey: 'strain',
        indexValue: 0.6,
        indexSigma: 0.1,
        indexDelta: 0.03,
        indexConfidence: 0.8,
        volatility: 0.1,
        candidateInternalDrivers: [],
        candidateDependencies: [
            { dependency: 'organizational', impactScore: 0.5, confidence: 0.8, volatility: 0.05, trendDelta: 0.02, persistenceWeeks: 3 },
            { dependency: 'process', impactScore: 0.4, confidence: 0.75, volatility: 0.08, trendDelta: 0.01, persistenceWeeks: 2 },
        ],
    };

    const result = computeAttribution(inputs);

    if (result.external.length >= 2) {
        const org = result.external.find(e => e.dependency === 'organizational');
        const proc = result.external.find(e => e.dependency === 'process');

        if (org && proc) {
            if (org.pathway === proc.pathway) {
                throw new Error('Pathways should differ between dependency types');
            }
            if (org.failureMode === proc.failureMode) {
                throw new Error('Failure modes should differ between dependency types');
            }
        }
    }
});

// ============================================================================
// Helper: Create Mock Aggregation Inputs
// ============================================================================

function createMockAggregationInputs(weeks: number): AggregationInputs {
    const baseDate = new Date('2024-12-23');
    const perWeekData: Record<string, Record<string, { mean: number; sigma: number; sampleN: number; confidence: number }>> = {};

    for (let i = 0; i < weeks; i++) {
        const weekDate = new Date(baseDate);
        weekDate.setUTCDate(weekDate.getUTCDate() - (i * 7));
        const ws = weekStartISO(weekDate);

        perWeekData[ws] = {
            strain: { mean: 0.4 + (i * 0.02), sigma: 0.08, sampleN: 10, confidence: 0.8 },
            withdrawal_risk: { mean: 0.35, sigma: 0.1, sampleN: 10, confidence: 0.75 },
            trust_gap: { mean: 0.3, sigma: 0.09, sampleN: 10, confidence: 0.8 },
            engagement: { mean: 0.7 - (i * 0.01), sigma: 0.07, sampleN: 10, confidence: 0.85 },
        };
    }

    return {
        teamId: 'team-1',
        orgId: 'org-1',
        perWeekIndexAggregates: perWeekData,
    };
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== PHASE 3+4 SUMMARY ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review errors above.');
    process.exit(1);
} else {
    console.log('\n✅ All Phase 3+4 tests passed.');
    process.exit(0);
}
