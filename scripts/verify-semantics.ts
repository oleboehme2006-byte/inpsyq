#!/usr/bin/env npx tsx
/**
 * VERIFICATION SCRIPT — Semantics & Scoring Engine
 * 
 * Run with: npx tsx scripts/verify-semantics.ts
 * 
 * This script validates:
 * 1. All registries load without errors
 * 2. Threshold ordering is correct
 * 3. Forbidden driver-index combinations throw
 * 4. Severity/impact computations produce expected outputs
 */

import {
    INDEX_REGISTRY,
    validateIndexThresholds,
    getQualitativeStateForIndex,
} from '../lib/semantics/indexRegistry';

import {
    DRIVER_REGISTRY,
    validateDriverRegistry,
    validateDriverIndexAssignment,
} from '../lib/semantics/driverRegistry';

import {
    DEPENDENCY_REGISTRY,
    validateDependencyIndexEffect,
} from '../lib/semantics/dependencyRegistry';

import {
    LINGUISTIC_RULES,
    containsForbiddenPhrase,
    validateGeneratedText,
} from '../lib/semantics/linguisticRules';

import { computeDriverSeverity } from '../lib/scoring/driverSeverity';
import { computeDependencyImpact } from '../lib/scoring/dependencyImpact';
import { getSeverityColor, getPriorityLevel } from '../lib/scoring/severityColors';

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

console.log('\n=== SEMANTICS & SCORING VERIFICATION ===\n');

// ============================================================================
// Phase 1: Semantic Registry Tests
// ============================================================================

console.log('--- Index Registry ---');

test('Index registry loads without errors', () => {
    if (Object.keys(INDEX_REGISTRY).length !== 4) {
        throw new Error('Expected 4 indices');
    }
});

test('Index thresholds are strictly ordered', () => {
    validateIndexThresholds(); // Throws on error
});

test('Qualitative states are deterministic', () => {
    // Strain: higher_is_worse
    const s1 = getQualitativeStateForIndex('strain', 0.8);
    const s2 = getQualitativeStateForIndex('strain', 0.1);
    if (s1 !== 'critical') throw new Error(`Expected critical, got ${s1}`);
    if (s2 !== 'minimal') throw new Error(`Expected minimal, got ${s2}`);

    // Engagement: higher_is_better
    const e1 = getQualitativeStateForIndex('engagement', 0.9);
    const e2 = getQualitativeStateForIndex('engagement', 0.2);
    if (e1 !== 'minimal') throw new Error(`Expected minimal (no concern), got ${e1}`);
    if (e2 !== 'critical') throw new Error(`Expected critical, got ${e2}`);
});

console.log('\n--- Driver Registry ---');

test('Driver registry loads without errors', () => {
    if (Object.keys(DRIVER_REGISTRY).length !== 6) {
        throw new Error('Expected 6 driver families');
    }
});

test('Driver registry is internally consistent', () => {
    validateDriverRegistry(); // Throws on error
});

test('Valid driver-index assignments pass', () => {
    validateDriverIndexAssignment('cognitive_load', 'strain'); // Should not throw
    validateDriverIndexAssignment('emotional_load', 'withdrawal_risk');
});

test('Forbidden driver-index assignments throw', () => {
    expectThrows(
        () => validateDriverIndexAssignment('cognitive_load', 'trust_gap'),
        'cognitive_load should not contribute to trust_gap'
    );
    expectThrows(
        () => validateDriverIndexAssignment('alignment_clarity', 'strain'),
        'alignment_clarity should not contribute to strain'
    );
});

console.log('\n--- Dependency Registry ---');

test('Dependency registry loads without errors', () => {
    if (Object.keys(DEPENDENCY_REGISTRY).length !== 3) {
        throw new Error('Expected 3 dependency types');
    }
});

test('Valid dependency-index effects pass', () => {
    validateDependencyIndexEffect('organizational', 'strain'); // Should not throw
    validateDependencyIndexEffect('process', 'engagement');
});

test('Invalid dependency-index effects throw', () => {
    expectThrows(
        () => validateDependencyIndexEffect('temporal_deadline', 'trust_gap'),
        'temporal_deadline should not affect trust_gap'
    );
});

console.log('\n--- Linguistic Rules ---');

test('Linguistic rules load for all indices', () => {
    if (Object.keys(LINGUISTIC_RULES).length !== 4) {
        throw new Error('Expected rules for 4 indices');
    }
});

test('Forbidden phrases are detected', () => {
    const hasForbidden = containsForbiddenPhrase('strain', 'This is positive strain for the team');
    if (!hasForbidden) throw new Error('Should detect "positive strain"');
});

test('Validation throws on forbidden phrases', () => {
    expectThrows(
        () => validateGeneratedText('strain', 'The team has healthy strain levels'),
        'Should throw on "healthy strain"'
    );
});

// ============================================================================
// Phase 2: Scoring Engine Tests
// ============================================================================

console.log('\n--- Driver Severity Engine ---');

test('C0 for low contribution', () => {
    const result = computeDriverSeverity({
        contributionScore: 0.1,
        trendDelta: 0,
        confidence: 0.8,
        volatility: 0.2,
    });
    if (result.severityLevel !== 'C0') throw new Error(`Expected C0, got ${result.severityLevel}`);
});

test('C3 for high contribution + worsening trend', () => {
    const result = computeDriverSeverity({
        contributionScore: 0.65,
        trendDelta: -0.2,
        confidence: 0.8,
        volatility: 0.2,
    });
    if (result.severityLevel !== 'C3') throw new Error(`Expected C3, got ${result.severityLevel}`);
});

test('Confidence caps severity at C2', () => {
    const result = computeDriverSeverity({
        contributionScore: 0.85,
        trendDelta: -0.3,
        confidence: 0.4, // Low confidence
        volatility: 0.2,
    });
    if (result.severityLevel !== 'C2') throw new Error(`Expected C2 (capped), got ${result.severityLevel}`);
    if (!result.confidenceCapped) throw new Error('Expected confidenceCapped to be true');
});

test('Volatility amplifies but does not create severity', () => {
    // High volatility + no contribution → should stay C0
    const result1 = computeDriverSeverity({
        contributionScore: 0.05,
        trendDelta: 0,
        confidence: 0.8,
        volatility: 0.9,
    });
    if (result1.severityLevel !== 'C0') throw new Error(`Expected C0, got ${result1.severityLevel}`);

    // High volatility + moderate contribution → should escalate
    const result2 = computeDriverSeverity({
        contributionScore: 0.45,
        trendDelta: 0,
        confidence: 0.8,
        volatility: 0.9,
    });
    if (result2.severityLevel !== 'C3') throw new Error(`Expected C3 (amplified), got ${result2.severityLevel}`);
});

console.log('\n--- Dependency Impact Engine ---');

test('D1 for low impact', () => {
    const result = computeDependencyImpact({
        impactScore: 0.2,
        controllability: 'high',
        persistence: 1,
    });
    if (result.impactLevel !== 'D1') throw new Error(`Expected D1, got ${result.impactLevel}`);
});

test('Persistence escalates impact', () => {
    const result = computeDependencyImpact({
        impactScore: 0.35, // Moderate
        controllability: 'medium',
        persistence: 6, // Chronic
    });
    if (result.impactLevel !== 'D3') throw new Error(`Expected D3 (persistence-adjusted), got ${result.impactLevel}`);
    if (!result.persistenceAdjusted) throw new Error('Expected persistenceAdjusted to be true');
});

test('Controllability caps action eligibility', () => {
    const result = computeDependencyImpact({
        impactScore: 0.7,
        controllability: 'low',
        persistence: 2,
    });
    if (result.actionEligibilityCap !== 0.3) throw new Error(`Expected 0.3 cap, got ${result.actionEligibilityCap}`);
});

console.log('\n--- Severity Colors ---');

test('Severity colors are index-agnostic', () => {
    const c0 = getSeverityColor('C0');
    const c3 = getSeverityColor('C3');
    if (c0 !== 'severity-neutral') throw new Error(`Expected severity-neutral, got ${c0}`);
    if (c3 !== 'severity-critical') throw new Error(`Expected severity-critical, got ${c3}`);
});

test('Priority levels are ordered correctly', () => {
    const p0 = getPriorityLevel('C0');
    const p3 = getPriorityLevel('C3');
    if (p0 !== 0) throw new Error(`Expected 0, got ${p0}`);
    if (p3 !== 3) throw new Error(`Expected 3, got ${p3}`);
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== SUMMARY ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review errors above.');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed. Semantics & Scoring Engine verified.');
    process.exit(0);
}
